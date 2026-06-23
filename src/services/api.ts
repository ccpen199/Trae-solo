import axios from 'axios';
import {
  City,
  StandardPackage,
  GarbageCategory,
  GarbageItem,
  RecognitionResult,
  SearchResult,
  FeedbackRequest,
  StreetAccuracy,
  MisjudgmentItem,
  TrendDataPoint,
  AdminLoginRequest,
  AdminLoginResponse,
  PdfDocument
} from '../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: AdminLoginRequest) =>
    api.post<AdminLoginResponse>('/auth/login', data).then(r => r.data)
};

export const standardsApi = {
  getCities: () =>
    api.get<{ cities: City[] }>('/standards/cities').then(r => r.data),
  
  getStandardPackage: (cityId: string) =>
    api.get<StandardPackage>(`/standards/${cityId}`).then(r => r.data),
  
  getCategories: (cityId: string) =>
    api.get<{ categories: GarbageCategory[] }>(`/standards/${cityId}/categories`).then(r => r.data),
  
  getCategoryItems: (categoryId: string) =>
    api.get<{ items: GarbageItem[] }>(`/standards/categories/${categoryId}/items`).then(r => r.data),
  
  createCategory: (cityId: string, data: Omit<GarbageCategory, 'id' | 'cityId' | 'updateTimestamp'>) =>
    api.post<{ success: boolean; category: GarbageCategory }>(`/standards/${cityId}/categories`, data).then(r => r.data),
  
  updateCategory: (id: string, data: Partial<Omit<GarbageCategory, 'id' | 'cityId' | 'updateTimestamp'>>) =>
    api.put<{ success: boolean; category: GarbageCategory }>(`/standards/categories/${id}`, data).then(r => r.data),
  
  deleteCategory: (id: string) =>
    api.delete<{ success: boolean }>(`/standards/categories/${id}`).then(r => r.data),
  
  createItem: (cityId: string, data: { name: string; aliases: string[]; categoryId: string; requirements: string; misconceptions?: string }) =>
    api.post<{ success: boolean; item: GarbageItem }>(`/standards/${cityId}/items`, data).then(r => r.data),
  
  updateItem: (id: string, data: Partial<{ name: string; aliases: string[]; categoryId: string; requirements: string; misconceptions: string }>) =>
    api.put<{ success: boolean; item: GarbageItem }>(`/standards/items/${id}`, data).then(r => r.data),
  
  deleteItem: (id: string) =>
    api.delete<{ success: boolean }>(`/standards/items/${id}`).then(r => r.data)
};

export const recognitionApi = {
  recognizeImage: (imageBase64: string, cityId: string) =>
    api.post<RecognitionResult>('/recognition/image', { imageBase64, cityId }).then(r => r.data)
};

export const searchApi = {
  search: (q: string, cityId: string, limit?: number) =>
    api.get<{ results: SearchResult[] }>('/search', { params: { q, cityId, limit } }).then(r => r.data),
  
  getHotSearches: (cityId: string, limit?: number) =>
    api.get<{ hotItems: GarbageItem[] }>('/search/hot', { params: { cityId, limit } }).then(r => r.data)
};

export const feedbackApi = {
  submit: (data: FeedbackRequest) =>
    api.post<{ id: string; success: boolean }>('/feedback', data).then(r => r.data),
  
  getList: (cityId: string, limit?: number, offset?: number) =>
    api.get<{ list: any[]; total: number }>('/feedback', { params: { cityId, limit, offset } }).then(r => r.data)
};

export const statisticsApi = {
  getAccuracy: (cityId: string) =>
    api.get<{ data: StreetAccuracy[] }>('/statistics/accuracy', { params: { cityId } }).then(r => r.data),
  
  getMisjudgments: (cityId: string, limit?: number) =>
    api.get<{ data: MisjudgmentItem[] }>('/statistics/misjudgments', { params: { cityId, limit } }).then(r => r.data),
  
  getTrend: (cityId: string, days?: number) =>
    api.get<{ data: TrendDataPoint[] }>('/statistics/trend', { params: { cityId, days } }).then(r => r.data),
  
  getOverview: (cityId: string) =>
    api.get<{ stats: {
      totalItems: number;
      totalCategories: number;
      totalFeedback: number;
      avgAccuracy: number;
      totalStreets: number;
      totalQueries: number;
    } }>('/statistics/overview', { params: { cityId } }).then(r => r.data)
};

export const pdfApi = {
  getList: (cityId: string) =>
    api.get<{ docs: PdfDocument[] }>('/pdf', { params: { cityId } }).then(r => r.data),
  
  getById: (id: string) =>
    api.get<{ doc: PdfDocument }>(`/pdf/${id}`).then(r => r.data),
  
  upload: (file: File, cityId: string, version?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cityId', cityId);
    if (version) formData.append('version', version);
    return api.post<{ success: boolean; doc: PdfDocument }>('/pdf/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  },
  
  linkItems: (pdfId: string, itemIds: string[]) =>
    api.post<{ success: boolean }>(`/pdf/link/${pdfId}`, { itemIds }).then(r => r.data),
  
  unlinkItem: (pdfId: string, itemId: string) =>
    api.post<{ success: boolean }>(`/pdf/unlink/${pdfId}`, { itemId }).then(r => r.data),
  
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/pdf/${id}`).then(r => r.data),
  
  searchInPdf: (id: string, keyword: string) =>
    api.get<{ results: Array<{ line: string; lineNumber: number }> }>(`/pdf/search/${id}`, { params: { keyword } }).then(r => r.data)
};

export default api;
