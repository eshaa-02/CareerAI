import api from './api';
import { Interview } from '@/types';

export interface ScheduleInterviewPayload {
  applicationId: string;
  interviewRound: string;
  interviewType: string;
  meetingPlatform: string;
  meetingLink?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timezone: string;
  instructions?: string;
  agenda?: string;
  interviewerIds?: string[];
}

export const interviewService = {
  schedule: async (payload: ScheduleInterviewPayload) => {
    const { data } = await api.post<{ interview: Interview }>('/interviews', payload);
    return data;
  },
  reschedule: async (id: string, payload: { date: string; startTime: string; endTime: string; note?: string }) => {
    const { data } = await api.put<{ interview: Interview }>(`/interviews/${id}/reschedule`, payload);
    return data;
  },
  cancel: async (id: string, reason: string) => {
    const { data } = await api.put<{ interview: Interview }>(`/interviews/${id}/cancel`, { reason });
    return data;
  },
  markCompleted: async (id: string) => {
    const { data } = await api.put<{ interview: Interview }>(`/interviews/${id}/complete`);
    return data;
  },
  setOutcome: async (id: string, outcome: string) => {
    const { data } = await api.put<{ interview: Interview }>(`/interviews/${id}/outcome`, { outcome });
    return data;
  },
  submitFeedback: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.post(`/interviews/${id}/feedback`, payload);
    return data;
  },
  updateNotes: async (id: string, notes: string) => {
    const { data } = await api.put<{ interview: Interview }>(`/interviews/${id}/notes`, { notes });
    return data;
  },
  getEmployerInterviews: async (params: { status?: string; range?: string; type?: string } = {}) => {
    const query = new URLSearchParams(params as Record<string, string>);
    const { data } = await api.get<{ interviews: Interview[] }>(`/interviews/employer?${query.toString()}`);
    return data;
  },
  getEmployerAnalytics: async () => {
    const { data } = await api.get('/interviews/employer/analytics');
    return data;
  },
  getCandidateInterviews: async (status?: string) => {
    const { data } = await api.get<{ interviews: Interview[] }>(`/interviews/candidate${status ? `?status=${status}` : ''}`);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<{ interview: Interview }>(`/interviews/${id}`);
    return data;
  },
  respond: async (id: string, response: 'accepted' | 'declined' | 'reschedule_requested', note?: string, requestedDate?: string) => {
    const { data } = await api.put<{ interview: Interview }>(`/interviews/${id}/respond`, { response, note, requestedDate });
    return data;
  },
  join: async (id: string) => {
    const { data } = await api.put<{ interview: Interview }>(`/interviews/${id}/join`);
    return data;
  },
  getICSDownloadUrl: (id: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return `${base}/interviews/${id}/calendar.ics`;
  },
};
