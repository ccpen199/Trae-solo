import axios, { type AxiosInstance } from 'axios';
import type { ApiResponse } from '../../shared/types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
}) as unknown as {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
  interceptors: {
    request: any;
    response: any;
  };
};

apiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: any) => {
    if (response.data && response.data.code === 200) {
      return response.data.data;
    }
    return Promise.reject(response.data || new Error('请求失败'));
  },
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const api = {
  auth: {
    login: (phone: string, password: string) =>
      apiClient.post('/auth/login', { phone, password }),
    faceVerify: (faceImage: string) =>
      apiClient.post('/auth/face-verify', { faceImage }),
    getCurrentUser: () => apiClient.get('/auth/user'),
  },
  identity: {
    getCertificates: () => apiClient.get('/identity/certificates'),
    getCertificateByType: (type: string) =>
      apiClient.get(`/identity/certificates/${type}`),
    verifyCertificate: (id: string) =>
      apiClient.post(`/identity/certificates/${id}/verify`),
  },
  transportation: {
    generateBRTQR: () => apiClient.post('/transportation/brt/qrcode'),
    getNearbyParking: (lat: number, lng: number, radius?: number) =>
      apiClient.get('/transportation/parking/nearby', {
        params: { lat, lng, radius },
      }),
    getViolations: (plateNumber?: string) =>
      apiClient.get('/transportation/violations', {
        params: { plateNumber },
      }),
    payViolation: (id: string) =>
      apiClient.post(`/transportation/violations/${id}/pay`),
    getBusRealTime: (routeId: string) =>
      apiClient.get(`/transportation/bus/${routeId}/realtime`),
  },
  medical: {
    getHospitals: () => apiClient.get('/medical/hospitals'),
    getDepartments: (hospitalId: string) =>
      apiClient.get(`/medical/hospitals/${hospitalId}/departments`),
    getWaitTimes: () => apiClient.get('/medical/wait-times'),
    createAppointment: (data: any) =>
      apiClient.post('/medical/appointment', data),
    getAppointments: () => apiClient.get('/medical/appointments'),
    payBill: (orderId: string, amount: number) =>
      apiClient.post('/medical/pay', { orderId, amount }),
  },
  education: {
    getSchools: (type?: string, district?: string) =>
      apiClient.get('/education/schools', { params: { type, district } }),
    getSchoolByAddress: (address: string) =>
      apiClient.get('/education/school-by-address', { params: { address } }),
    submitEnrollment: (data: any) =>
      apiClient.post('/education/enrollment', data),
    getEnrollmentStatus: (applicationId: string) =>
      apiClient.get(`/education/enrollment/${applicationId}`),
    getEnrollments: () => apiClient.get('/education/enrollments'),
    getEnrollmentGuidelines: () =>
      apiClient.get('/education/enrollment-guidelines'),
  },
  urban: {
    classifyTicket: (content: string) =>
      apiClient.post('/urban/classify', { content }),
    submitComplaint: (data: any) =>
      apiClient.post('/urban/complaint', data),
    getTickets: (status?: string, category?: string) =>
      apiClient.get('/urban/tickets', { params: { status, category } }),
    getTicketDetail: (id: string) =>
      apiClient.get(`/urban/tickets/${id}`),
    rateTicket: (id: string, score: number, comment?: string) =>
      apiClient.post(`/urban/tickets/${id}/rate`, { score, comment }),
    getVitalSigns: () => apiClient.get('/urban/vital-signs'),
    getVitalSignsHistory: (hours?: number) =>
      apiClient.get('/urban/vital-signs/history', { params: { hours } }),
  },
  government: {
    getPolicies: (category?: string, page?: number, pageSize?: number) =>
      apiClient.get('/government/policies', {
        params: { category, page, pageSize },
      }),
    getPolicyDetail: (id: string) =>
      apiClient.get(`/government/policies/${id}`),
    getPolicyInterpretation: (id: string) =>
      apiClient.get(`/government/policies/${id}/interpret`),
    getServices: () => apiClient.get('/government/services'),
    submitApplication: (serviceId: string, data: any) =>
      apiClient.post(`/government/services/${serviceId}/apply`, data),
    getAtomicServices: (category?: string) =>
      apiClient.get('/government/atomic-services', { params: { category } }),
    getAtomicServiceDetail: (id: string) =>
      apiClient.get(`/government/atomic-services/${id}`),
    createFlow: (data: any) =>
      apiClient.post('/government/flows', data),
    getFlows: () => apiClient.get('/government/flows'),
    executeFlow: (id: string, params?: any) =>
      apiClient.post(`/government/flows/${id}/execute`, params),
  },
};
