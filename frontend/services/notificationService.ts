import api from './api';
import { Notification, PaginationMeta } from '@/types';

export const notificationService = {
  getMyNotifications: async (page = 1): Promise<{ notifications: Notification[]; unreadCount: number; pagination: PaginationMeta }> => {
    const { data } = await api.get(`/notifications?page=${page}`);
    return data;
  },
  markAsRead: async (id: string) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },
  markAllAsRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },
  deleteNotification: async (id: string) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};
