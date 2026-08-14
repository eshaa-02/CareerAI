import api from './api';
import { CandidateProfile, Application, Job } from '@/types';

export const candidateService = {
  getMyProfile: async () => {
    const { data } = await api.get<{ profile: CandidateProfile; completionPercentage: number }>('/candidates/me');
    return data;
  },
  updateMyProfile: async (payload: Partial<CandidateProfile>) => {
    const { data } = await api.put<{ profile: CandidateProfile }>('/candidates/me', payload);
    return data;
  },
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const { data } = await api.put<{ profile: CandidateProfile }>('/candidates/me/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  addEducation: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<{ profile: CandidateProfile }>('/candidates/me/education', payload);
    return data;
  },
  deleteEducation: async (eduId: string) => {
    const { data } = await api.delete<{ profile: CandidateProfile }>(`/candidates/me/education/${eduId}`);
    return data;
  },
  addExperience: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<{ profile: CandidateProfile }>('/candidates/me/experience', payload);
    return data;
  },
  deleteExperience: async (expId: string) => {
    const { data } = await api.delete<{ profile: CandidateProfile }>(`/candidates/me/experience/${expId}`);
    return data;
  },
  toggleSavedJob: async (jobId: string) => {
    const { data } = await api.put<{ saved: boolean }>(`/candidates/me/saved-jobs/${jobId}`);
    return data;
  },
  getSavedJobs: async () => {
    const { data } = await api.get<{ jobs: Job[] }>('/candidates/me/saved-jobs');
    return data;
  },
  getJobMatch: async (jobId: string) => {
    const { data } = await api.get('/candidates/me/match/' + jobId);
    return data;
  },
  getRecommendedJobs: async () => {
    const { data } = await api.get<{ jobs: { job: Job; matchScore: number }[] }>('/candidates/me/recommended-jobs');
    return data;
  },
  getMyApplications: async () => {
    const { data } = await api.get<{ applications: Application[] }>('/candidates/me/applications');
    return data;
  },
};
