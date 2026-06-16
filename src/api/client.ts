import axios from 'axios';
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
    const errorInfo = response.data || { message: '请求失败' };
    return Promise.reject({
      ...errorInfo,
      message: errorInfo.message || '请求失败',
      code: errorInfo.code || response.status,
      error: errorInfo.data?.error,
    });
  },
  (error: any) => {
    const responseData = error.response?.data;
    const status = error.response?.status;
    const config = error.config;

    const isLoginRequest = config?.url?.includes('/auth/login') || 
                          config?.url?.includes('/auth/login-sms') ||
                          config?.url?.includes('/auth/login-face') ||
                          config?.url?.includes('/auth/face-verify') ||
                          config?.url?.includes('/auth/send-sms');

    if (status === 401 && !isLoginRequest && localStorage.getItem('token') !== 'demo-session') {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      message: responseData?.message || error.message || '网络请求失败',
      code: responseData?.code || status || 'NETWORK_ERROR',
      error: responseData?.data?.error,
      data: responseData?.data,
    });
  }
);

export default apiClient;

export const api = {
  auth: {
    login: (phone: string, password: string) =>
      apiClient.post('/auth/login', { phone, password }),
    loginBySms: (phone: string, code: string) =>
      apiClient.post('/auth/login-sms', { phone, code }),
    loginByFace: (faceImage: string) =>
      apiClient.post('/auth/login-face', { faceImage }),
    sendSmsCode: (phone: string) =>
      apiClient.post('/auth/send-sms', { phone }),
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
    getBRTTravelRecords: (page?: number, pageSize?: number) =>
      apiClient.get('/transportation/brt/records', {
        params: { page, pageSize },
      }),
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
    getDoctors: (hospitalId: string, departmentId: string) =>
      apiClient.get(`/medical/hospitals/${hospitalId}/departments/${departmentId}/doctors`),
    getWaitTimes: () => apiClient.get('/medical/wait-times'),
    createAppointment: (data: any) =>
      apiClient.post('/medical/appointment', data),
    getAppointments: () => apiClient.get('/medical/appointments'),
    getAppointmentDetail: (id: string) =>
      apiClient.get(`/medical/appointments/${id}`),
    cancelAppointment: (id: string) =>
      apiClient.post(`/medical/appointments/${id}/cancel`),
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
    getDispatchRules: () => apiClient.get('/urban/dispatch-rules'),
    createDispatchRule: (data: any) =>
      apiClient.post('/urban/dispatch-rules', data),
    updateDispatchRule: (id: string, data: any) =>
      apiClient.put(`/urban/dispatch-rules/${id}`, data),
    toggleDispatchRule: (id: string, isEnabled: boolean) =>
      apiClient.post(`/urban/dispatch-rules/${id}/toggle`, { isEnabled }),
    deleteDispatchRule: (id: string) =>
      apiClient.delete(`/urban/dispatch-rules/${id}`),
    getDepartmentStats: () => apiClient.get('/urban/department-stats'),
    getDepartmentReceipts: (department?: string) =>
      apiClient.get('/urban/department-receipts', { params: { department } }),
    getTransportationDashboard: () => apiClient.get('/urban/dashboard/transportation'),
    getMedicalDashboard: () => apiClient.get('/urban/dashboard/medical'),
    getUtilitiesDashboard: () => apiClient.get('/urban/dashboard/utilities'),
    getGovernmentDashboard: () => apiClient.get('/urban/dashboard/government'),
  },
  government: {
    getPolicies: async (category?: string, keyword?: string, page?: number, pageSize?: number) => {
      const data: any = await apiClient.get('/government/policies', {
        params: { category, keyword, page, pageSize },
      });
      return Array.isArray(data) ? data : data?.policies ?? [];
    },
    getPolicyDetail: (id: string) =>
      apiClient.get(`/government/policies/${id}`),
    getPolicyInterpretation: (id: string) =>
      apiClient.get(`/government/policies/${id}/interpret`),
    getRelatedPolicies: (id: string) =>
      apiClient.get(`/government/policies/${id}/related`),
    getPolicyPushRecords: () =>
      apiClient.get('/government/policies/push-records'),
    markPolicyAsRead: (id: string) =>
      apiClient.post(`/government/policies/${id}/read`),
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
    getFlowReleaseRecords: (flowId: string) =>
      apiClient.get(`/government/flows/${flowId}/releases`),
    rollbackFlow: (flowId: string, version: string) =>
      apiClient.post(`/government/flows/${flowId}/rollback`, { version }),
    compareFlowVersions: (flowId: string, version1: string, version2: string) =>
      apiClient.get(`/government/flows/${flowId}/compare`, { params: { version1, version2 } }),
    getServiceStats: (serviceId: string) =>
      apiClient.get(`/government/atomic-services/${serviceId}/stats`),
    getServiceCallRecords: (serviceId: string) =>
      apiClient.get(`/government/atomic-services/${serviceId}/calls`),
    getServiceDependencies: (serviceId: string) =>
      apiClient.get(`/government/atomic-services/${serviceId}/dependencies`),
    getNodeProperties: (nodeId: string, serviceId?: string) =>
      apiClient.get(`/government/designer/nodes/${nodeId}/properties`, { params: { serviceId } }),
    publishFlow: (flowId: string, data: { changeLog: string }) =>
      apiClient.post(`/government/flows/${flowId}/publish`, data),
  },
};
