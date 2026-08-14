import api from './api';
import { Job, Company } from '@/types';

export interface PublicStats {
  totalJobs: number;
  totalCompanies: number;
  totalCandidates: number;
  totalApplications: number;
}

export const statsService = {
  getPublicStats: async (): Promise<{ stats: PublicStats }> => {
    const { data } = await api.get('/stats/public');
    return data;
  },
  getHomepageContent: async (): Promise<{
    latestJobs: Job[];
    featuredCompanies: Company[];
    trendingCategories: { name: string; count: number }[];
  }> => {
    const { data } = await api.get('/stats/homepage-content');
    return data;
  },
};
