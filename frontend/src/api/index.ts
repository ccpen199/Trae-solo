import axios from 'axios';

const API_BASE_URL = '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getMe: () => api.get('/api/auth/me'),
};

export const serviceItemApi = {
  getAll: () => api.get('/api/service-items'),
  getByCode: (code: string) => api.get(`/api/service-items/${code}`),
  getMaterials: (code: string) => api.get(`/api/service-items/${code}/materials`),
};

export const caseApi = {
  create: (serviceItemId: number) =>
    api.post('/api/cases', { service_item_id: serviceItemId }),
  getMy: (status?: string) =>
    api.get('/api/cases', { params: status ? { status } : {} }),
  getDetail: (id: number) => api.get(`/api/cases/${id}`),
  submitMaterial: (caseId: number, formData: FormData) =>
    api.post(`/api/cases/${caseId}/submit-materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const reservationApi = {
  getTimeSlots: (serviceItemId: number, date?: string) =>
    api.get('/api/reservations/time-slots', {
      params: { service_item_id: serviceItemId, date },
    }),
  create: (caseId: number, timeSlotId: number) =>
    api.post('/api/reservations', { case_id: caseId, time_slot_id: timeSlotId }),
  getMy: (status?: string) =>
    api.get('/api/reservations/my', { params: status ? { status } : {} }),
  cancel: (reservationId: number) =>
    api.post(`/api/reservations/${reservationId}/cancel`),
};

export const auditApi = {
  getPending: () => api.get('/api/audits/pending'),
  getMy: () => api.get('/api/audits/my'),
  review: (data: {
    case_id: number;
    material_id?: number;
    audit_result: string;
    audit_opinion?: string;
    correction_suggestion?: string;
  }) => api.post('/api/audits/review', data),
};

export const windowApi = {
  getWaitingQueue: () => api.get('/api/window/queue/waiting'),
  getMyCases: () => api.get('/api/window/my-cases'),
  checkIn: (caseId: number) =>
    api.post('/api/window/check-in', null, { params: { case_id: caseId } }),
  callQueue: (queueId: number, windowNumber: number) =>
    api.post('/api/window/call', null, {
      params: { queue_id: queueId, window_number: windowNumber },
    }),
  complete: (caseId: number, result: string, remark?: string) =>
    api.post('/api/window/complete', { case_id: caseId, result, remark }),
};

export const evaluationApi = {
  submit: (data: {
    case_id: number;
    overall_score: number;
    attitude_score?: number;
    efficiency_score?: number;
    environment_score?: number;
    comment?: string;
    is_anonymous?: boolean;
  }) => api.post('/api/evaluations', data),
  getMy: () => api.get('/api/evaluations/my'),
  getStats: (startDate?: string, endDate?: string) =>
    api.get('/api/evaluations/stats', { params: { start_date: startDate, end_date: endDate } }),
  getDashboard: () => api.get('/api/evaluations/dashboard'),
  getRanking: () => api.get('/api/evaluations/ranking'),
};

export const adminApi = {
  monitorCases: (params?: {
    status?: string;
    show_stagnant_only?: boolean;
    stagnant_hours?: number;
  }) => api.get('/api/admin/cases/monitor', { params }),
  getCaseTrace: (caseId: number) => api.get(`/api/admin/cases/${caseId}/trace`),
  getReport: (period: string) =>
    api.get('/api/admin/reports/overview', { params: { period } }),
  getActionLogs: (params?: {
    action_type?: string;
    operator_role?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/api/admin/logs/actions', { params }),
  getUserStats: () => api.get('/api/admin/stats/users'),
};
