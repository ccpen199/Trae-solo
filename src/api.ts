import { useAuthStore } from './store';

const API_BASE = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, error: '网络请求失败' };
  }
}

export const api = {
  auth: {
    register: (data: { idCard: string; name: string; phone: string; password: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { idCard: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    profile: () => request('/auth/profile'),
    faceVerify: (faceImage: string) =>
      request('/auth/face-verify', { method: 'POST', body: JSON.stringify({ faceImage }) }),
    bankVerify: (data: { bankCardNumber: string; bankName: string }) =>
      request('/auth/bank-verify', { method: 'POST', body: JSON.stringify(data) }),
    officerLogin: (data: { username: string; password: string }) =>
      request('/auth/officer/login', { method: 'POST', body: JSON.stringify(data) }),
  },
  
  declaration: {
    list: () => request('/declaration/list'),
    get: (id: number) => request(`/declaration/${id}`),
    create: (taxYear?: number) =>
      request('/declaration/create', { method: 'POST', body: JSON.stringify({ taxYear }) }),
    addDeduction: (id: number, data: any) =>
      request(`/declaration/${id}/deduction`, { method: 'POST', body: JSON.stringify(data) }),
    calculate: (id: number) =>
      request(`/declaration/${id}/calculate`, { method: 'POST' }),
    submit: (id: number) =>
      request(`/declaration/${id}/submit`, { method: 'POST' }),
    refundStatus: (id: number) => request(`/declaration/${id}/refund-status`),
  },
  
  appeal: {
    list: () => request('/appeal/list'),
    get: (id: number) => request(`/appeal/${id}`),
    create: (data: any) =>
      request('/appeal/create', { method: 'POST', body: JSON.stringify(data) }),
    withdraw: (id: number) =>
      request(`/appeal/${id}/withdraw`, { method: 'POST' }),
  },
  
  admin: {
    dashboard: () => request('/admin/dashboard'),
    appeals: (status?: string) =>
      request(`/admin/appeals${status ? `?status=${status}` : ''}`),
    processAppeal: (id: number, data: any) =>
      request(`/admin/appeals/${id}/process`, { method: 'POST', body: JSON.stringify(data) }),
    declarations: (status?: string, year?: number) => {
      let url = '/admin/declarations';
      const params = [];
      if (status) params.push(`status=${status}`);
      if (year) params.push(`year=${year}`);
      if (params.length) url += '?' + params.join('&');
      return request(url);
    },
    approveDeclaration: (id: number) =>
      request(`/admin/declarations/${id}/approve`, { method: 'POST' }),
    policyImpact: (deductionType?: string, newAmount?: number) => {
      let url = '/admin/policy/impact-analysis';
      const params = [];
      if (deductionType) params.push(`deductionType=${deductionType}`);
      if (newAmount) params.push(`newAmount=${newAmount}`);
      if (params.length) url += '?' + params.join('&');
      return request(url);
    },
    faq: (category?: string) =>
      request(`/admin/faq${category ? `?category=${category}` : ''}`),
    createFaq: (data: any) =>
      request('/admin/faq', { method: 'POST', body: JSON.stringify(data) }),
    logs: (operation?: string, userId?: number) => {
      let url = '/admin/logs';
      const params = [];
      if (operation) params.push(`operation=${operation}`);
      if (userId) params.push(`userId=${userId}`);
      if (params.length) url += '?' + params.join('&');
      return request(url);
    },
    verifyBlockchain: () => request('/admin/blockchain/verify'),
    users: () => request('/admin/users'),
  },
  
  faq: {
    list: (category?: string) =>
      request(`/admin/faq${category ? `?category=${category}` : ''}`),
  },
};
