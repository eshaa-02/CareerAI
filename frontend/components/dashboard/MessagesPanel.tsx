'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  MessageCircle,
  Send,
  User,
  Loader2,
} from 'lucide-react';

type Participant = {
  _id: string;
  name?: string;
  avatar?: any;
  role?: string;
};

type Conversation = {
  _id: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageAt: string;
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  'http://localhost:5000';

export default function MessagesPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] =
    useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedConversationRef =
    useRef<Conversation | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  const user =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || 'null')
      : null;

  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    selectedConversationRef.current =
      selectedConversation;
  }, [selectedConversation]);

  // ============================================
  // SOCKET CONNECTION
  // ============================================

  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Messaging socket connected');

      socket.emit(
        'join_user',
        currentUserId
      );
    });

    // Someone sent us a message
    socket.on('new_message', ({ message, conversationId }) => {
      setConversations((prev) => {
        const existing = prev.find(
          (c) => c._id === conversationId
        );

        if (!existing) {
          loadConversations();
          return prev;
        }

        return [
          {
            ...existing,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unreadCount:
              selectedConversationRef.current?._id ===
                conversationId
                ? 0
                : (existing.unreadCount || 0) + 1,
          },
          ...prev.filter(
            (c) => c._id !== conversationId
          ),
        ];
      });

      if (
        selectedConversationRef.current?._id ===
        conversationId
      ) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) => m._id === message._id
          );

          if (exists) return prev;

          return [...prev, message];
        });
      }
    });

    socket.on('message_sent', ({ message, conversationId }) => {
      if (
        selectedConversationRef.current?._id ===
        conversationId
      ) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) => m._id === message._id
          );

          if (exists) return prev;

          return [...prev, message];
        });
      }
    });

    socket.on(
      'conversation_updated',
      ({
        conversationId,
        lastMessage,
        lastMessageAt,
      }) => {
        setConversations((prev) => {
          const conversation = prev.find(
            (c) => c._id === conversationId
          );

          if (!conversation) return prev;

          return [
            {
              ...conversation,
              lastMessage,
              lastMessageAt,
            },
            ...prev.filter(
              (c) => c._id !== conversationId
            ),
          ];
        });
      }
    );

    socket.on('disconnect', () => {
      console.log('Messaging socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  // ============================================
  // LOAD CONVERSATIONS
  // ============================================

  const loadConversations = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/messages/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Failed to load conversations'
        );
      }

      setConversations(data.conversations || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  // ============================================
  // OPEN CONVERSATION
  // ============================================

  const openConversation = async (
    conversation: Conversation
  ) => {
    try {
      setSelectedConversation(conversation);
      setMessages([]);
      setMessagesLoading(true);

      socketRef.current?.emit(
        'join_conversation',
        conversation._id
      );

      const response = await fetch(
        `${API_URL}/messages/conversations/${conversation._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Failed to load messages'
        );
      }

      setMessages(data.messages || []);

      // Clear unread
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversation._id
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ============================================
  // SEND MESSAGE
  // ============================================

  const sendMessage = async () => {
    if (
      !selectedConversation ||
      !messageText.trim() ||
      sending
    ) {
      return;
    }

    const text = messageText.trim();

    try {
      setSending(true);

      const response = await fetch(
        `${API_URL}/messages/conversations/${selectedConversation._id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: text,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Failed to send message'
        );
      }

      setMessageText('');

      const sentMessage = data.message;

      setMessages((prev) => {
        const exists = prev.some(
          (m) => m._id === sentMessage._id
        );

        if (exists) return prev;

        return [...prev, sentMessage];
      });

      setConversations((prev) => {
        const conversation = prev.find(
          (c) =>
            c._id === selectedConversation._id
        );

        if (!conversation) return prev;

        return [
          {
            ...conversation,
            lastMessage: text,
            lastMessageAt:
              sentMessage.createdAt,
          },
          ...prev.filter(
            (c) =>
              c._id !== selectedConversation._id
          ),
        ];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  // ============================================
  // ENTER TO SEND
  // ============================================

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey
    ) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherParticipant = (
    conversation: Conversation
  ) => {
    return conversation.participants.find(
      (p) =>
        p._id !== currentUserId
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Messages
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Chat with candidates and employers in real time.
        </p>
      </div>

      {/* Main Chat */}

      <div className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] lg:grid-cols-[320px_1fr]">

        {/* Conversations */}

        <div className="border-b border-[var(--border-color)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--border-color)] p-4">
            <h2 className="font-semibold text-[var(--text-primary)]">
              Conversations
            </h2>
          </div>

          <div className="max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  No conversations yet.
                </p>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Start a conversation from a job,
                  application, or candidate profile.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const other =
                  getOtherParticipant(
                    conversation
                  );

                const active =
                  selectedConversation?._id ===
                  conversation._id;

                return (
                  <button
                    key={conversation._id}
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
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 text-sm font-bold text-[var(--accent-primary)]">
                      {other?.name
                        ?.charAt(0)
                        ?.toUpperCase() || (
                          <User className="h-5 w-5" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-[var(--text-primary)]">
                          {other?.name ||
                            'Unknown User'}
                        </p>

                        {!!conversation.unreadCount && (
                          <span className="rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--bg-primary)]">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-xs capitalize text-[var(--text-muted)]">
                        {other?.role ||
                          'User'}
                      </p>

                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                        {conversation.lastMessage ||
                          'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat */}

        <div className="flex min-h-[650px] flex-col">
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto h-12 w-12 text-[var(--text-muted)]" />

                <p className="mt-4 text-sm text-[var(--text-muted)]">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}

              <div className="flex items-center gap-3 border-b border-[var(--border-color)] p-4">
                {(() => {
                  const other =
                    getOtherParticipant(
                      selectedConversation
                    );

                  return (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 font-bold text-[var(--accent-primary)]">
                        {other?.name
                          ?.charAt(0)
                          ?.toUpperCase() || 'U'}
                      </div>

                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {other?.name ||
                            'Unknown User'}
                        </p>

                        <p className="text-xs capitalize text-[var(--text-muted)]">
                          {other?.role ||
                            'User'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                    No messages yet. Say hello 👋
                  </div>
                ) : (
                  messages.map((message) => {
                    const senderId =
                      typeof message.senderId ===
                        'string'
                        ? message.senderId
                        : message.senderId?._id;

                    const mine =
                      senderId === currentUserId;

                    return (
                      <div
                        key={message._id}
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
                            {message.content}
                          </p>

                          <p
                            className={`mt-1 text-[10px] ${mine
                                ? 'opacity-70'
                                : 'text-[var(--text-muted)]'
                              }`}
                          >
                            {new Date(
                              message.createdAt
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}

              <div className="border-t border-[var(--border-color)] p-4">
                <div className="flex gap-2">
                  <input
                    value={messageText}
                    onChange={(e) =>
                      setMessageText(
                        e.target.value
                      )
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-primary)]"
                    maxLength={5000}
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
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