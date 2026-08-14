import api from './api';
import { Job, PaginationMeta } from '@/types';

export interface JobFilters {
  search?: string;
  location?: string;
  type?: string;
  experience?: string;
  category?: string;
  isRemote?: boolean;
  minSalary?: number;
  maxSalary?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export const jobService = {
  getJobs: async (filters: JobFilters = {}): Promise<{ jobs: Job[]; pagination: PaginationMeta }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const { data } = await api.get(`/jobs?${params.toString()}`);
    return data;
  },
  getJobById: async (id: string): Promise<{ job: Job }> => {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },
  getSimilarJobs: async (id: string): Promise<{ jobs: Job[] }> => {
    const { data } = await api.get(`/jobs/${id}/similar`);
    return data;
  },
  getTrendingCategories: async (): Promise<{ categories: { name: string; count: number }[] }> => {
    const { data } = await api.get('/jobs/meta/categories');
    return data;
  },
  getMyJobs: async (status?: string): Promise<{ jobs: Job[] }> => {
    const { data } = await api.get(`/jobs/employer/my-jobs${status ? `?status=${status}` : ''}`);
    return data;
  },
  createJob: async (payload: Partial<Job>): Promise<{ job: Job }> => {
    const { data } = await api.post('/jobs', payload);
    return data;
  },
  updateJob: async (id: string, payload: Partial<Job>): Promise<{ job: Job }> => {
    const { data } = await api.put(`/jobs/${id}`, payload);
    return data;
  },
  deleteJob: async (id: string): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },
};
