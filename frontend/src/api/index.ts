import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  batches?: any[];
  jobs?: any[];
}

export const apiEndpoints = {
  divisions: {
    getTree: () => api.get<any, ApiResponse>('/divisions/tree'),
    getList: (params?: any) => api.get<any, ApiResponse>('/divisions', { params }),
  },
  companies: {
    getList: (params?: any) => api.get<any, ApiResponse>('/companies', { params }),
    getDetail: (id: string) => api.get<any, ApiResponse>(`/companies/${id}`),
  },
  jobs: {
    getList: (params?: any) => api.get<any, ApiResponse>('/jobs', { params }),
    getDetail: (id: string) => api.get<any, ApiResponse>(`/jobs/${id}`),
    apply: (id: string, graduateId: string) => api.post<any, ApiResponse>(`/jobs/${id}/apply`, { graduate_id: graduateId }),
    getMatchedGraduates: (id: string, limit?: number) => api.get<any, ApiResponse>(`/jobs/${id}/matched-graduates`, { params: { limit } }),
  },
  fairs: {
    getList: (params?: any) => api.get<any, ApiResponse>('/fairs', { params }),
    getDetail: (id: string) => api.get<any, ApiResponse>(`/fairs/${id}`),
  },
  graduates: {
    getList: (params?: any) => api.get<any, ApiResponse>('/graduates', { params }),
    getDetail: (id: string) => api.get<any, ApiResponse>(`/graduates/${id}`),
  },
  policies: {
    getList: (params?: any) => api.get<any, ApiResponse>('/policies', { params }),
  },
  prosperity: {
    getCurrent: (params: any) => api.get<any, ApiResponse>('/prosperity/current', { params }),
    getHistory: (params: any) => api.get<any, ApiResponse>('/prosperity/history', { params }),
    getRanking: (params?: any) => api.get<any, ApiResponse>('/prosperity/ranking', { params }),
    calculateAll: () => api.post<any, ApiResponse>('/prosperity/calculate-all'),
  },
  industryZones: {
    getList: () => api.get<any, ApiResponse>('/industry-zones'),
  },
  rpo: {
    importJobs: (data: any) => api.post<any, ApiResponse>('/rpo/import', data),
    getBatches: (params: any) => api.get<any, ApiResponse>('/rpo/batches', { params }),
  },
  schools: {
    getList: (params?: any) => api.get<any, ApiResponse>('/schools', { params }),
    getJobs: (id: string, params?: any) => api.get<any, ApiResponse>(`/schools/${id}/jobs`, { params }),
    getEmploymentReport: (id: string) => api.get<any, ApiResponse>(`/schools/${id}/employment-report`),
    getGraduates: (id: string, params?: any) => api.get<any, ApiResponse>(`/schools/${id}/graduates`, { params }),
  },
  auth: {
    login: (username: string, password: string) => api.post<any, ApiResponse>('/auth/login', { username, password }),
  },
  stats: {
    getSummary: (params?: any) => api.get<any, ApiResponse>('/stats/summary', { params }),
  },
};

export default api;
