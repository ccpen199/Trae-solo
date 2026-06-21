import { get, post } from './request';
import { Company, SearchFilters, SearchResult, PaginationResult } from '@/types';

export const searchApi = {
  searchCompanies: (params: SearchFilters & { page?: number; pageSize?: number }): Promise<SearchResult> => {
    return post<SearchResult>('/search/companies', params);
  },

  getCompanyDetail: (id: string): Promise<Company> => {
    return get<Company>(`/companies/${id}`);
  },

  getCompanyLawsuits: (id: string, params?: { page?: number; pageSize?: number }): Promise<PaginationResult<any>> => {
    return get<PaginationResult<any>>(`/companies/${id}/lawsuits`, { params });
  },

  getCompanyExecutions: (id: string, params?: { page?: number; pageSize?: number }): Promise<PaginationResult<any>> => {
    return get<PaginationResult<any>>(`/companies/${id}/executions`, { params });
  },

  getCompanyShareholders: (id: string): Promise<any[]> => {
    return get<any[]>(`/companies/${id}/shareholders`);
  },

  getCompanyRisk: (id: string): Promise<{ score: number; level: string; details: any[] }> => {
    return get(`/companies/${id}/risk`);
  },

  getRelationGraph: (id: string): Promise<{ nodes: any[]; edges: any[] }> => {
    return get(`/companies/${id}/relations`);
  },

  searchPerson: (keyword: string, filters?: any): Promise<PaginationResult<any>> => {
    return post<PaginationResult<any>>('/search/persons', { keyword, ...filters });
  },

  searchCases: (params: any): Promise<PaginationResult<any>> => {
    return post<PaginationResult<any>>('/search/cases', params);
  },

  exportSearchResults: (params: SearchFilters): Promise<Blob> => {
    return post('/search/export', params, { responseType: 'blob' });
  },
};
