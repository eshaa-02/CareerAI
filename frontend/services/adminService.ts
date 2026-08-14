import api from './api';
import { User, Company, Job, PaginationMeta } from '@/types';

export interface AdminAnalytics {
  totals: {
    users: number;
    candidates: number;
    employers: number;
    jobs: number;
    activeJobs: number;
    applications: number;
    companies: number;
    verifiedCompanies: number;
  };
  userGrowth: { _id: { year: number; month: number }; count: number }[];
  applicationsByStatus: { _id: string; count: number }[];
  jobsByCategory: { _id: string; count: number }[];
}

export const adminService = {
  getAnalytics: async (): Promise<{ analytics: AdminAnalytics }> => {
    const { data } = await api.get('/admin/analytics');
    return data;
  },
  getUsers: async (params: { role?: string; search?: string; page?: number } = {}) => {
    const query = new URLSearchParams(params as Record<string, string>);
    const { data } = await api.get<{ users: User[]; pagination: PaginationMeta }>(`/admin/users?${query.toString()}`);
    return data;
  },
  toggleSuspendUser: async (id: string) => {
    const { data } = await api.put<{ user: User }>(`/admin/users/${id}/suspend`);
    return data;
  },
  deleteUser: async (id: string) => {
    await api.delete(`/admin/users/${id}`);
  },
  getCompanies: async (verified?: boolean) => {
    const query = verified !== undefined ? `?verified=${verified}` : '';
    const { data } = await api.get<{ companies: Company[] }>(`/admin/companies${query}`);
    return data;
  },
  verifyCompany: async (id: string) => {
    const { data } = await api.put<{ company: Company }>(`/admin/companies/${id}/verify`);
    return data;
  },
  getJobs: async (status?: string) => {
    const { data } = await api.get<{ jobs: Job[] }>(`/admin/jobs${status ? `?status=${status}` : ''}`);
    return data;
  },
  closeJob: async (id: string) => {
    const { data } = await api.put<{ job: Job }>(`/admin/jobs/${id}/close`);
    return data;
  },
};
