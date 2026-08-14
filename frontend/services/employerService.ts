import api from './api';

export interface EmployerAnalytics {
  totals: {
    totalJobs: number;
    activeJobs: number;
    closedJobs: number;
    totalApplications: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
  };
  companyVerified: boolean;
  applicationsOverTime: { _id: { year: number; month: number; day: number }; count: number }[];
  topJobsByApplicants: { _id: string; title: string; applicationsCount: number; views: number; status: string }[];
}

export const employerService = {
  getAnalytics: async (): Promise<{ analytics: EmployerAnalytics }> => {
    const { data } = await api.get('/employer/analytics');
    return data;
  },
};
