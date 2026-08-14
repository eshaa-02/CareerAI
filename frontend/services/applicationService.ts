import api from './api';
import { Application } from '@/types';

export const applicationService = {
  applyToJob: async (jobId: string, coverLetter: string) => {
    const { data } = await api.post<{ application: Application }>(`/applications/${jobId}`, { coverLetter });
    return data;
  },
  withdrawApplication: async (id: string) => {
    const { data } = await api.put<{ application: Application }>(`/applications/${id}/withdraw`);
    return data;
  },
  getApplicantsForJob: async (jobId: string, status?: string) => {
    const { data } = await api.get(`/applications/job/${jobId}${status ? `?status=${status}` : ''}`);
    return data;
  },
  getAllApplicantsForEmployer: async (status?: string) => {
    const { data } = await api.get(`/applications/employer/all${status ? `?status=${status}` : ''}`);
    return data;
  },
  updateStatus: async (id: string, status: string, note?: string) => {
    const { data } = await api.put<{ application: Application }>(`/applications/${id}/status`, { status, note });
    return data;
  },
  getApplicationById: async (id: string) => {
    const { data } = await api.get<{ application: Application }>(`/applications/${id}`);
    return data;
  },
};
