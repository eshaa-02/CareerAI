import api from './api';

export interface Conversation {
  _id: string;
  participants: { _id: string; name: string; avatar?: { url: string }; role: string }[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export const messageService = {
  getConversations: async () => {
    const { data } = await api.get<{ conversations: Conversation[] }>('/messages/conversations');
    return data;
  },
  getMessages: async (conversationId: string) => {
    const { data } = await api.get<{ messages: Message[] }>(`/messages/conversations/${conversationId}`);
    return data;
  },
  startConversation: async (participantId: string) => {
    const { data } = await api.post<{ conversation: Conversation }>('/messages/conversations', { participantId });
    return data;
  },
};
