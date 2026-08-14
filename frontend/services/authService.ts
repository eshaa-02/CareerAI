import api from './api';
import { User } from '@/types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'candidate' | 'employer';
  companyName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.put('/auth/update-password', { currentPassword, newPassword });
    return data;
  },
  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  resetPassword: async (resetToken: string, password: string) => {
    const { data } = await api.put(`/auth/reset-password/${resetToken}`, { password });
    return data;
  },
};
