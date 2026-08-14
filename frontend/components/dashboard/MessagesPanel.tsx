'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  MessageCircle,
  Send,
  User,
  Loader2,
  ArrowLeft,
  Plus,
  Search,
  Building2,
  CheckCircle2,
  X,
} from 'lucide-react';

import Cookies from 'js-cookie';

/* ============================================================
   TYPES
============================================================ */

type Participant = {
  _id: string;
  name?: string;
  avatar?: any;
  role?: string;
  company?: {
    _id: string;
    name: string;
    logo?: any;
  } | null;
};

type Conversation = {
  _id: string;
  participants: Participant[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
};

type Message = {
  _id: string;
  conversationId: string;
  senderId: Participant | string;
  receiverId: Participant | string;
  content: string;
  createdAt: string;
  read: boolean;
};

/* ============================================================
   SEARCH TYPES
============================================================ */

type SearchResult = {
  type: 'user' | 'company';

  /*
   * userId is always the actual user who will receive
   * the conversation request.
   */
  userId: string;

  companyId?: string;

  name: string;

  contactName?: string;

  email?: string;

  avatar?: any;

  industry?: string;

  location?: string;

  skills?: string[];

  verified?: boolean;

  role?: string;
};

type SearchUser = {
  _id: string;
  name?: string;
  email?: string;
  avatar?: any;
  role?: string;
  location?: string;
  skills?: string[];
};

type SearchCompany = {
  _id: string;
  name: string;

  logo?: {
    url?: string;
    publicId?: string;
  };

  industry?: string;

  location?: string;

  description?: string;

  verified?: boolean;

  ownerId?: string | SearchUser;
};

/* ============================================================
   API
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  'http://localhost:5000';

/* ============================================================
   COMPONENT
============================================================ */

export default function MessagesPanel() {
  /* ==========================================================
     CONVERSATIONS
  ========================================================== */

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState<Conversation | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [messageText, setMessageText] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  /* ==========================================================
     NEW MESSAGE SEARCH
  ========================================================== */

  const [showNewMessage, setShowNewMessage] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [searchResults, setSearchResults] =
    useState<SearchResult[]>([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [startingConversation, setStartingConversation] =
    useState<string | null>(null);

  /* ==========================================================
     REFS
  ========================================================== */

  const socketRef =
    useRef<Socket | null>(null);

  const selectedConversationRef =
    useRef<Conversation | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const searchTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /* ==========================================================
     TOKEN
  ========================================================== */

  const getToken = () => {
    if (typeof window === 'undefined') {
      return null;
    }

    return (
      Cookies.get('token') ||
      localStorage.getItem('token')
    );
  };

  /* ==========================================================
     CURRENT USER
  ========================================================== */

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const storedUser =
        localStorage.getItem('user');

      if (!storedUser) {
        return;
      }

      const parsedUser =
        JSON.parse(storedUser);

      const id =
        parsedUser?._id ||
        parsedUser?.id ||
        null;

      setCurrentUserId(id);
    } catch (error) {
      console.error(
        'FAILED TO READ USER:',
        error
      );
    }
  }, []);

  /* ==========================================================
     SELECTED CONVERSATION REF
  ========================================================== */

  useEffect(() => {
    selectedConversationRef.current =
      selectedConversation;
  }, [selectedConversation]);

  /* ==========================================================
     LOAD CONVERSATIONS
  ========================================================== */

  const loadConversations = async () => {
    try {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const response = await fetch(
        `${API_URL}/messages/conversations`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to load conversations'
        );
      }

      setConversations(
        Array.isArray(data?.conversations)
          ? data.conversations
          : []
      );
    } catch (error) {
      console.error(
        'LOAD CONVERSATIONS ERROR:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     NORMALIZE USER SEARCH RESULT
  ========================================================== */

  const normalizeUserResult = (
    user: SearchUser
  ): SearchResult | null => {
    if (!user?._id) {
      return null;
    }

    /*
     * Do not show the currently logged-in user.
     */
    if (
      currentUserId &&
      String(user._id) ===
      String(currentUserId)
    ) {
      return null;
    }

    return {
      type: 'user',

      userId: String(user._id),

      name:
        user.name?.trim() ||
        user.email ||
        'Unknown User',

      email: user.email,

      avatar: user.avatar,

      location: user.location,

      skills: user.skills || [],

      role: user.role || 'candidate',
    };
  };

  /* ==========================================================
     NORMALIZE COMPANY SEARCH RESULT
  ========================================================== */

  const normalizeCompanyResult = (
    company: SearchCompany
  ): SearchResult | null => {
    if (!company?._id) {
      return null;
    }

    /*
     * Company owner can come as:
     *
     * ownerId: "mongodb-id"
     *
     * OR
     *
     * ownerId: {
     *   _id: "...",
     *   name: "..."
     * }
     */

    let ownerId = '';
    let ownerName = '';

    if (
      typeof company.ownerId ===
      'string'
    ) {
      ownerId = company.ownerId;
    }

    if (
      typeof company.ownerId ===
      'object' &&
      company.ownerId
    ) {
      ownerId = String(
        company.ownerId._id || ''
      );

      ownerName =
        company.ownerId.name || '';
    }

    /*
     * If company has no owner, it cannot be used
     * to start a user-to-user conversation.
     */
    if (!ownerId) {
      console.warn(
        'Company has no ownerId:',
        company
      );

      return null;
    }

    /*
     * Don't show the user's own company.
     */
    if (
      currentUserId &&
      String(ownerId) ===
      String(currentUserId)
    ) {
      return null;
    }

    return {
      type: 'company',

      /*
       * IMPORTANT:
       * Conversation endpoint needs participantId,
       * therefore userId is the company owner.
       */
      userId: ownerId,

      companyId: String(
        company._id
      ),

      name:
        company.name?.trim() ||
        'Unnamed Company',

      contactName:
        ownerName || undefined,

      avatar: company.logo,

      industry:
        company.industry || 'Company',

      location:
        company.location || '',

      verified:
        Boolean(company.verified),

      role: 'employer',
    };
  };

  /* ==========================================================
     SEARCH
  ========================================================== */

  const searchUsers = (
    value: string
  ) => {
    setSearchText(value);

    /*
     * Cancel previous request timer.
     */
    if (searchTimeoutRef.current) {
      clearTimeout(
        searchTimeoutRef.current
      );

      searchTimeoutRef.current = null;
    }

    /*
     * Empty search.
     */
    if (!value.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    /*
     * Search after 350ms.
     */
    searchTimeoutRef.current =
      setTimeout(async () => {
        try {
          const token = getToken();

          if (!token) {
            console.error(
              'SEARCH: AUTH TOKEN NOT FOUND'
            );

            setSearchResults([]);
            return;
          }

          setSearchLoading(true);

          const query =
            value.trim();

          console.log(
            'MESSAGE SEARCH:',
            query
          );

          const response =
            await fetch(
              `${API_URL}/messages/search?q=${encodeURIComponent(
                query
              )}`,
              {
                method: 'GET',

                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type':
                    'application/json',
                },

                cache: 'no-store',
              }
            );

          const data =
            await response.json();

          console.log(
            'MESSAGE SEARCH RESPONSE:',
            data
          );

          if (!response.ok) {
            throw new Error(
              data?.message ||
              data?.error ||
              'Search failed'
            );
          }

          /*
           * ======================================================
           * CASE 1
           *
           * Backend returns:
           *
           * {
           *   results: [...]
           * }
           *
           * ======================================================
           */

          if (
            Array.isArray(
              data?.results
            )
          ) {
            const normalized =
              data.results
                .map(
                  (item: any) => {
                    /*
                     * Already normalized result.
                     */
                    if (
                      item?.userId &&
                      item?.name
                    ) {
                      return {
                        ...item,

                        type:
                          item.type ===
                            'company'
                            ? 'company'
                            : 'user',

                        userId:
                          String(
                            item.userId
                          ),
                      } as SearchResult;
                    }

                    /*
                     * Raw company.
                     */
                    if (
                      item?.companyId ||
                      item?.industry
                    ) {
                      return normalizeCompanyResult(
                        item
                      );
                    }

                    /*
                     * Raw user.
                     */
                    return normalizeUserResult(
                      item
                    );
                  }
                )
                .filter(
                  Boolean
                ) as SearchResult[];

            setSearchResults(
              normalized
            );

            return;
          }

          /*
           * ======================================================
           * CASE 2
           *
           * Backend returns:
           *
           * {
           *   users: [],
           *   companies: []
           * }
           *
           * ======================================================
           */

          const users =
            Array.isArray(
              data?.users
            )
              ? data.users
              : [];

          const companies =
            Array.isArray(
              data?.companies
            )
              ? data.companies
              : [];

          const normalizedUsers =
            users
              .map(
                normalizeUserResult
              )
              .filter(
                Boolean
              ) as SearchResult[];

          const normalizedCompanies =
            companies
              .map(
                normalizeCompanyResult
              )
              .filter(
                Boolean
              ) as SearchResult[];

          /*
           * Companies first, then users.
           */
          setSearchResults([
            ...normalizedCompanies,
            ...normalizedUsers,
          ]);
        } catch (error) {
          console.error(
            'MESSAGE SEARCH ERROR:',
            error
          );

          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 350);
  };

  /* ==========================================================
     CLEAN SEARCH TIMER
  ========================================================== */

  useEffect(() => {
    return () => {
      if (
        searchTimeoutRef.current
      ) {
        clearTimeout(
          searchTimeoutRef.current
        );
      }
    };
  }, []);

  /* ==========================================================
     START NEW CONVERSATION
  ========================================================== */

  const startNewConversation =
    async (
      result: SearchResult
    ) => {
      try {
        const token = getToken();

        if (!token) {
          console.error(
            'START CONVERSATION: TOKEN NOT FOUND'
          );
          return;
        }

        if (!result.userId) {
          console.error(
            'START CONVERSATION: USER ID MISSING',
            result
          );
          return;
        }

        setStartingConversation(
          result.userId
        );

        /*
         * IMPORTANT:
         *
         * Even when the result is a company,
         * we send the COMPANY OWNER'S USER ID.
         */
        const participantId =
          result.userId;

        console.log(
          'STARTING CONVERSATION WITH:',
          {
            type: result.type,
            name: result.name,
            participantId,
          }
        );

        const response =
          await fetch(
            `${API_URL}/messages/conversations`,
            {
              method: 'POST',

              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                participantId,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          'START CONVERSATION RESPONSE:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            'Failed to start conversation'
          );
        }

        const conversation =
          data?.conversation;

        if (!conversation) {
          throw new Error(
            'Conversation was not returned by server'
          );
        }

        /*
         * Add/update conversation.
         */
        setConversations(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  item._id ===
                  conversation._id
              );

            if (exists) {
              return previous.map(
                (item) =>
                  item._id ===
                    conversation._id
                    ? {
                      ...item,
                      ...conversation,
                    }
                    : item
              );
            }

            return [
              {
                ...conversation,
                unreadCount: 0,
              },
              ...previous,
            ];
          }
        );

        /*
         * Close search.
         */
        setShowNewMessage(false);
        setSearchText('');
        setSearchResults([]);

        /*
         * Open conversation.
         */
        await openConversation(
          conversation
        );
      } catch (error) {
        console.error(
          'START CONVERSATION ERROR:',
          error
        );
      } finally {
        setStartingConversation(null);
      }
    };

  /* ==========================================================
     SOCKET
  ========================================================== */

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    const socket =
      io(SOCKET_URL, {
        transports: [
          'websocket',
          'polling',
        ],

        withCredentials: true,

        auth: {
          token,
        },
      });

    socketRef.current =
      socket;

    socket.on(
      'connect',
      () => {
        console.log(
          'MESSAGE SOCKET CONNECTED:',
          socket.id
        );

        socket.emit(
          'join_user',
          currentUserId
        );

        if (
          selectedConversationRef.current
        ) {
          socket.emit(
            'join_conversation',
            selectedConversationRef
              .current._id
          );
        }
      }
    );

    socket.on(
      'connect_error',
      (error) => {
        console.error(
          'MESSAGE SOCKET ERROR:',
          error.message
        );
      }
    );

    socket.on(
      'disconnect',
      () => {
        console.log(
          'MESSAGE SOCKET DISCONNECTED'
        );
      }
    );

    /* ========================================================
       NEW MESSAGE
    ======================================================== */

    socket.on(
      'new_message',
      ({
        message,
        conversationId,
      }) => {
        setConversations(
          (previous) => {
            const existing =
              previous.find(
                (conversation) =>
                  conversation._id ===
                  conversationId
              );

            if (!existing) {
              loadConversations();
              return previous;
            }

            const updated = {
              ...existing,

              lastMessage:
                message.content,

              lastMessageAt:
                message.createdAt,

              unreadCount:
                selectedConversationRef
                  .current?._id ===
                  conversationId
                  ? 0
                  : (existing.unreadCount ||
                    0) + 1,
            };

            return [
              updated,

              ...previous.filter(
                (conversation) =>
                  conversation._id !==
                  conversationId
              ),
            ];
          }
        );

        if (
          selectedConversationRef
            .current?._id ===
          conversationId
        ) {
          setMessages(
            (previous) => {
              const alreadyExists =
                previous.some(
                  (item) =>
                    item._id ===
                    message._id
                );

              if (alreadyExists) {
                return previous;
              }

              return [
                ...previous,
                message,
              ];
            }
          );
        }
      }
    );

    /* ========================================================
       MESSAGE SENT
    ======================================================== */

    socket.on(
      'message_sent',
      ({
        message,
        conversationId,
      }) => {
        if (
          selectedConversationRef
            .current?._id ===
          conversationId
        ) {
          setMessages(
            (previous) => {
              const exists =
                previous.some(
                  (item) =>
                    item._id ===
                    message._id
                );

              if (exists) {
                return previous;
              }

              return [
                ...previous,
                message,
              ];
            }
          );
        }
      }
    );

    /* ========================================================
       CONVERSATION UPDATED
    ======================================================== */

    socket.on(
      'conversation_updated',
      ({
        conversationId,
        lastMessage,
        lastMessageAt,
      }) => {
        setConversations(
          (previous) => {
            const conversation =
              previous.find(
                (item) =>
                  item._id ===
                  conversationId
              );

            if (!conversation) {
              return previous;
            }

            return [
              {
                ...conversation,

                lastMessage,

                lastMessageAt,
              },

              ...previous.filter(
                (item) =>
                  item._id !==
                  conversationId
              ),
            ];
          }
        );
      }
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  /* ==========================================================
     OPEN CONVERSATION
  ========================================================== */

  const openConversation =
    async (
      conversation: Conversation
    ) => {
      try {
        const token = getToken();

        if (!token) {
          return;
        }

        setSelectedConversation(
          conversation
        );

        selectedConversationRef.current =
          conversation;

        setMessages([]);

        setMessagesLoading(true);

        socketRef.current?.emit(
          'join_conversation',
          conversation._id
        );

        const response =
          await fetch(
            `${API_URL}/messages/conversations/${conversation._id}`,
            {
              method: 'GET',

              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type':
                  'application/json',
              },

              cache: 'no-store',
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            'Failed to load messages'
          );
        }

        setMessages(
          Array.isArray(
            data?.messages
          )
            ? data.messages
            : []
        );

        setConversations(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                  conversation._id
                  ? {
                    ...item,
                    unreadCount: 0,
                  }
                  : item
            )
        );
      } catch (error) {
        console.error(
          'OPEN CONVERSATION ERROR:',
          error
        );
      } finally {
        setMessagesLoading(false);
      }
    };

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  const sendMessage =
    async () => {
      const text =
        messageText.trim();

      if (
        !text ||
        !selectedConversation ||
        sending
      ) {
        return;
      }

      try {
        const token = getToken();

        if (!token) {
          return;
        }

        setSending(true);

        const response =
          await fetch(
            `${API_URL}/messages/conversations/${selectedConversation._id}/messages`,
            {
              method: 'POST',

              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                content: text,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            'Failed to send message'
          );
        }

        setMessageText('');

        const sentMessage =
          data?.message;

        if (sentMessage) {
          setMessages(
            (previous) => {
              const exists =
                previous.some(
                  (item) =>
                    item._id ===
                    sentMessage._id
                );

              if (exists) {
                return previous;
              }

              return [
                ...previous,
                sentMessage,
              ];
            }
          );
        }

        await loadConversations();
      } catch (error) {
        console.error(
          'SEND MESSAGE ERROR:',
          error
        );
      } finally {
        setSending(false);
      }
    };

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: 'smooth',
      }
    );
  }, [messages]);

  /* ==========================================================
     HELPERS
  ========================================================== */

  const getOtherParticipant = (
    conversation: Conversation
  ) => {
    return conversation.participants.find(
      (participant) =>
        participant._id !==
        currentUserId
    );
  };

  const getSenderId = (
    sender:
      | Participant
      | string
  ) => {
    if (
      typeof sender ===
      'string'
    ) {
      return sender;
    }

    return sender?._id;
  };

  const getParticipantDisplayName = (
    participant?: Participant
  ) => {
    if (!participant) {
      return 'Unknown User';
    }

    if (
      participant.role ===
      'employer' &&
      participant.company?.name
    ) {
      return participant.company.name;
    }

    return (
      participant.name ||
      'Unknown User'
    );
  };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Messages
          </h1>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Chat with candidates and employers in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowNewMessage(true);
            setSearchText('');
            setSearchResults([]);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-semibold text-[var(--bg-primary)] transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </div>

      {/* ======================================================
          NEW MESSAGE SEARCH
      ====================================================== */}

      {showNewMessage && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                New Message
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {currentUserId
                  ? 'Search companies, employers, or candidates.'
                  : 'Loading your account...'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowNewMessage(false);
                setSearchText('');
                setSearchResults([]);
              }}
              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-alt)] hover:text-[var(--text-primary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {/* SEARCH INPUT */}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />

              <input
                autoFocus
                value={searchText}
                onChange={(event) =>
                  searchUsers(
                    event.target.value
                  )
                }
                placeholder="Search companies, employers, or candidates..."
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* SEARCH RESULTS */}

            <div className="mt-3">
              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
                </div>
              ) : searchText.trim() &&
                searchResults.length ===
                0 ? (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Try another name, company, skill, or industry.
                  </p>
                </div>
              ) : searchResults.length >
                0 ? (
                <div className="max-h-[350px] overflow-y-auto">
                  {searchResults.map(
                    (result, index) => (
                      <button
                        key={`${result.type}-${result.userId}-${result.companyId || index}`}
                        type="button"
                        disabled={
                          startingConversation ===
                          result.userId
                        }
                        onClick={() =>
                          startNewConversation(
                            result
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[var(--bg-card-alt)] disabled:opacity-60"
                      >
                        {/* AVATAR */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-primary)]/15 font-bold text-[var(--accent-primary)]">
                          {result.avatar?.url ? (
                            <img
                              src={
                                result.avatar
                                  .url
                              }
                              alt={
                                result.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : result.type ===
                            'company' ? (
                            <Building2 className="h-5 w-5" />
                          ) : (
                            result.name
                              ?.charAt(
                                0
                              )
                              .toUpperCase() || (
                              <User className="h-5 w-5" />
                            )
                          )}
                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-[var(--text-primary)]">
                              {result.name}
                            </p>

                            {result.verified && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                            )}
                          </div>

                          {result.type ===
                            'company' ? (
                            <>
                              <p className="truncate text-xs text-[var(--text-secondary)]">
                                {result.industry ||
                                  'Company'}
                              </p>

                              {result.location && (
                                <p className="truncate text-xs text-[var(--text-muted)]">
                                  {
                                    result.location
                                  }
                                </p>
                              )}

                              {result.contactName && (
                                <p className="truncate text-xs text-[var(--text-muted)]">
                                  Contact:{' '}
                                  {
                                    result.contactName
                                  }
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-xs capitalize text-[var(--text-secondary)]">
                                {result.role ===
                                  'employer'
                                  ? 'Employer'
                                  : 'Candidate'}
                              </p>

                              {result.skills &&
                                result.skills
                                  .length >
                                0 && (
                                  <p className="truncate text-xs text-[var(--text-muted)]">
                                    {result.skills
                                      .slice(
                                        0,
                                        3
                                      )
                                      .join(
                                        ' • '
                                      )}
                                  </p>
                                )}

                              {result.location && (
                                <p className="truncate text-xs text-[var(--text-muted)]">
                                  {
                                    result.location
                                  }
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* LOADER / ICON */}

                        {startingConversation ===
                          result.userId ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
                        ) : (
                          <MessageCircle className="h-5 w-5 text-[var(--text-muted)]" />
                        )}
                      </button>
                    )
                  )}
                </div>
              ) : (
                <div className="py-5 text-center text-xs text-[var(--text-muted)]">
                  Start typing to search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN MESSAGE AREA
      ====================================================== */}

      <div className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] lg:grid-cols-[320px_1fr]">
        {/* ====================================================
            CONVERSATIONS
        ==================================================== */}

        <div className="border-b border-[var(--border-color)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--border-color)] p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">
                Conversations
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowNewMessage(true);
                  setSearchText('');
                  setSearchResults([]);
                }}
                className="rounded-lg p-2 text-[var(--accent-primary)] transition hover:bg-[var(--bg-card-alt)]"
                title="New message"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length ===
              0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto h-9 w-9 text-[var(--text-muted)]" />

                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  No conversations yet.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewMessage(
                      true
                    );
                    setSearchText('');
                    setSearchResults([]);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-xs font-semibold text-[var(--bg-primary)]"
                >
                  <Plus className="h-4 w-4" />
                  Start a conversation
                </button>
              </div>
            ) : (
              conversations.map(
                (conversation) => {
                  const other =
                    getOtherParticipant(
                      conversation
                    );

                  const active =
                    selectedConversation?._id ===
                    conversation._id;

                  return (
                    <button
                      key={
                        conversation._id
                      }
                      type="button"
                      onClick={() =>
                        openConversation(
                          conversation
                        )
                      }
                      className={`flex w-full items-center gap-3 border-b border-[var(--border-color)] p-4 text-left transition ${active
                          ? 'bg-[var(--accent-primary)]/10'
                          : 'hover:bg-[var(--bg-card-alt)]'
                        }`}
                    >
                      {/* AVATAR */}

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-primary)]/15 font-bold text-[var(--accent-primary)]">
                        {other?.avatar
                          ?.url ? (
                          <img
                            src={
                              other
                                .avatar
                                .url
                            }
                            alt={getParticipantDisplayName(
                              other
                            )}
                            className="h-full w-full object-cover"
                          />
                        ) : other?.role ===
                          'employer' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          other?.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase() || (
                            <User className="h-5 w-5" />
                          )
                        )}
                      </div>

                      {/* INFO */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-[var(--text-primary)]">
                            {getParticipantDisplayName(
                              other
                            )}
                          </p>

                          {!!conversation.unreadCount && (
                            <span className="rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--bg-primary)]">
                              {
                                conversation.unreadCount
                              }
                            </span>
                          )}
                        </div>

                        <p className="text-xs capitalize text-[var(--text-muted)]">
                          {other?.role ===
                            'employer'
                            ? 'Employer'
                            : other?.role ||
                            'User'}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                          {conversation.lastMessage ||
                            'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>

        {/* ====================================================
            CHAT
        ==================================================== */}

        <div className="flex min-h-[650px] flex-col">
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto h-12 w-12 text-[var(--text-muted)]" />

                <p className="mt-4 text-sm text-[var(--text-muted)]">
                  Select a conversation or start a new message
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewMessage(
                      true
                    );
                    setSearchText('');
                    setSearchResults([]);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)]"
                >
                  <Plus className="h-4 w-4" />
                  New Message
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* =================================================
                  CHAT HEADER
              ================================================= */}

              <div className="flex items-center gap-3 border-b border-[var(--border-color)] p-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConversation(
                      null
                    );

                    selectedConversationRef.current =
                      null;
                  }}
                  className="mr-1 rounded-lg p-2 hover:bg-[var(--bg-card-alt)] lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {(() => {
                  const other =
                    getOtherParticipant(
                      selectedConversation
                    );

                  return (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-primary)]/15 font-bold text-[var(--accent-primary)]">
                        {other?.avatar
                          ?.url ? (
                          <img
                            src={
                              other
                                .avatar
                                .url
                            }
                            alt={getParticipantDisplayName(
                              other
                            )}
                            className="h-full w-full object-cover"
                          />
                        ) : other?.role ===
                          'employer' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          other?.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase() ||
                          'U'
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {getParticipantDisplayName(
                            other
                          )}
                        </p>

                        <p className="text-xs capitalize text-[var(--text-muted)]">
                          {other?.role ===
                            'employer'
                            ? 'Employer'
                            : other?.role ||
                            'User'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* =================================================
                  MESSAGES
              ================================================= */}

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length ===
                  0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                    No messages yet. Say hello 👋
                  </div>
                ) : (
                  <>
                    {messages.map(
                      (message) => {
                        const senderId =
                          getSenderId(
                            message.senderId
                          );

                        const mine =
                          String(
                            senderId
                          ) ===
                          String(
                            currentUserId
                          );

                        return (
                          <div
                            key={
                              message._id
                            }
                            className={`flex ${mine
                                ? 'justify-end'
                                : 'justify-start'
                              }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 ${mine
                                  ? 'rounded-br-md bg-[var(--accent-primary)] text-[var(--bg-primary)]'
                                  : 'rounded-bl-md bg-[var(--bg-card-alt)] text-[var(--text-primary)]'
                                }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm">
                                {
                                  message.content
                                }
                              </p>

                              <p
                                className={`mt-1 text-[10px] ${mine
                                    ? 'opacity-70'
                                    : 'text-[var(--text-muted)]'
                                  }`}
                              >
                                {new Date(
                                  message.createdAt
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute:
                                      '2-digit',
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}

                    <div
                      ref={
                        messagesEndRef
                      }
                    />
                  </>
                )}
              </div>

              {/* =================================================
                  MESSAGE INPUT
              ================================================= */}

              <div className="border-t border-[var(--border-color)] p-4">
                <div className="flex gap-2">
                  <input
                    value={
                      messageText
                    }
                    onChange={(event) =>
                      setMessageText(
                        event.target
                          .value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        'Enter'
                      ) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    maxLength={5000}
                    className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                  />

                  <button
                    type="button"
                    onClick={
                      sendMessage
                    }
                    disabled={
                      sending ||
                      !messageText.trim()
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}