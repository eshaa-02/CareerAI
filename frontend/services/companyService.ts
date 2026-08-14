import api from './api';
import { Company, Job, PaginationMeta } from '@/types';

export const companyService = {
  getCompanies: async (params: { search?: string; industry?: string; page?: number } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.append(k, String(v)));
    const { data } = await api.get<{ companies: Company[]; pagination: PaginationMeta }>(
      `/companies?${query.toString()}`
    );
    return data;
  },
  getCompanyById: async (id: string) => {
    const { data } = await api.get<{ company: Company; jobs: Job[] }>(`/companies/${id}`);
    return data;
  },
  getMyCompany: async () => {
    const { data } = await api.get<{ company: Company }>('/companies/me');
    return data;
  },
  updateMyCompany: async (payload: Partial<Company>) => {
    const { data } = await api.put<{ company: Company }>('/companies/me', payload);
    return data;
  },
};
