import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
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

export const packageApi = {
  getAll: (category?: string) => 
    apiClient.get('/packages', { params: { category } }),
  getById: (id: string) => 
    apiClient.get(`/packages/${id}`),
  checkAvailability: (id: string, date: string) => 
    apiClient.get(`/packages/${id}/availability`, { params: { date } }),
  getAvailableSlots: (id: string) => 
    apiClient.get(`/packages/${id}/available-slots`),
};

export const reservationApi = {
  create: (data: {
    patientId?: string;
    packageId: string;
    reservationDate: string;
    reservationTime: string;
    patientName?: string;
    patientPhone?: string;
    patientIdCard?: string;
    patientGender?: string;
    patientAge?: number;
    patientEmail?: string;
  }) => apiClient.post('/reservations', data),
  
  getByCode: (code: string) => 
    apiClient.get(`/reservations/code/${code}`),
  
  getMyReservations: (status?: string) => 
    apiClient.get('/reservations', { params: { status } }),
  
  getById: (id: string) => 
    apiClient.get(`/reservations/${id}`),
  
  checkIn: (id: string) => 
    apiClient.post(`/reservations/${id}/checkin`),
  
  cancel: (id: string) => 
    apiClient.post(`/reservations/${id}/cancel`),
};

export const reportApi = {
  getAll: () => 
    apiClient.get('/reports'),
  
  getById: (id: string) => 
    apiClient.get(`/reports/${id}`),
};

export const authApi = {
  login: (username: string, password: string) => 
    apiClient.post('/auth/login', { username, password }),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  getCurrentUser: () => 
    apiClient.get('/auth/current'),
  
  changePassword: (oldPassword: string, newPassword: string) => 
    apiClient.post('/auth/change-password', { oldPassword, newPassword }),
};

export const notificationApi = {
  getMyNotifications: () => 
    apiClient.get('/notifications'),
  
  markAsRead: (id: string) => 
    apiClient.post(`/notifications/${id}/read`),
};

export const departmentsApi = {
  getAll: () => 
    apiClient.get('/departments'),
  
  getById: (id: string) => 
    apiClient.get(`/departments/${id}`),
};

export const examinationsApi = {
  getQueue: (departmentId: string) => 
    apiClient.get(`/examinations/queues/${departmentId}`),
  
  callPatient: (departmentId: string) => 
    apiClient.post(`/examinations/queues/${departmentId}/call`),
  
  submitResults: (data: {
    reservationId: string;
    packageItemId: string;
    results: any;
    isAbnormal?: boolean;
    notes?: string;
  }) => apiClient.post('/examinations/results', data),
  
  getByReservation: (reservationId: string) => 
    apiClient.get(`/examinations/reservations/${reservationId}`),
};
