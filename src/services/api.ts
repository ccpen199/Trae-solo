import request from '@/utils/request';
import type {
  AuthRequest,
  AuthResponse,
  AccountBalance,
  ConsumptionRecord,
  AccountStatistics,
  MedicalRecord,
  ChronicDisease,
  Hospital,
  Department,
  Doctor,
  TimeSlot,
  Appointment,
  SettlementOrder,
  PaymentRequest,
  PaymentResponse,
  Notification,
  RemoteRecordStatus,
  PaginationParams,
  PaginationResponse,
  ApiResponse,
} from '@shared/types';

export const authApi = {
  login: (data: AuthRequest): Promise<ApiResponse<AuthResponse>> =>
    request.post('/auth/login', data),
  
  logout: (): Promise<ApiResponse<void>> =>
    request.post('/auth/logout'),
  
  verify: (): Promise<ApiResponse<boolean>> =>
    request.get('/auth/verify'),
};

export const accountApi = {
  getBalance: (): Promise<ApiResponse<AccountBalance>> =>
    request.get('/account/balance'),
  
  getRecords: (params: PaginationParams & { type?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<PaginationResponse<ConsumptionRecord>>> =>
    request.get('/account/records', { params }),
  
  getRecordDetail: (id: string): Promise<ApiResponse<ConsumptionRecord>> =>
    request.get(`/account/records/${id}`),
  
  getStatistics: (): Promise<ApiResponse<AccountStatistics>> =>
    request.get('/account/statistics'),
};

export const medicalApi = {
  getRecords: (params: PaginationParams & { year?: number }): Promise<ApiResponse<PaginationResponse<MedicalRecord>>> =>
    request.get('/medical/records', { params }),
  
  getRecordDetail: (id: string): Promise<ApiResponse<MedicalRecord>> =>
    request.get(`/medical/records/${id}`),
};

export const chronicApi = {
  getList: (): Promise<ApiResponse<ChronicDisease[]>> =>
    request.get('/chronic/list'),
  
  apply: (data: { diseaseType: string; materials: string[] }): Promise<ApiResponse<string>> =>
    request.post('/chronic/apply', data),
};

export const registrationApi = {
  getHospitals: (params?: { area?: string; level?: string; isInsurancePoint?: boolean }): Promise<ApiResponse<Hospital[]>> =>
    request.get('/registration/hospitals', { params }),
  
  getHospital: (id: string): Promise<ApiResponse<Hospital>> =>
    request.get(`/registration/hospitals/${id}`),
  
  getDepartments: (hospitalId: string): Promise<ApiResponse<Department[]>> =>
    request.get(`/registration/hospitals/${hospitalId}/departments`),
  
  getDoctors: (departmentId: string, date?: string): Promise<ApiResponse<Doctor[]>> =>
    request.get(`/registration/departments/${departmentId}/doctors`, { params: { date } }),
  
  getTimeSlots: (doctorId: string, date: string): Promise<ApiResponse<TimeSlot[]>> =>
    request.get(`/registration/doctors/${doctorId}/slots`, { params: { date } }),
  
  createAppointment: (data: {
    hospitalId: string;
    departmentId: string;
    doctorId: string;
    date: string;
    timeSlotId: string;
  }): Promise<ApiResponse<Appointment>> =>
    request.post('/registration/appointment', data),
  
  getAppointments: (): Promise<ApiResponse<Appointment[]>> =>
    request.get('/registration/appointments'),
};

export const paymentApi = {
  getOrders: (params?: { status?: string }): Promise<ApiResponse<SettlementOrder[]>> =>
    request.get('/payment/orders', { params }),
  
  getOrderDetail: (id: string): Promise<ApiResponse<SettlementOrder>> =>
    request.get(`/payment/orders/${id}`),
  
  pay: (data: PaymentRequest): Promise<ApiResponse<PaymentResponse>> =>
    request.post('/payment/pay', data),
  
  getReceipt: (id: string): Promise<ApiResponse<{ url: string }>> =>
    request.get(`/payment/orders/${id}/receipt`),
};

export const notificationApi = {
  getList: (params?: { type?: string; level?: string }): Promise<ApiResponse<Notification[]>> =>
    request.get('/notifications', { params }),
  
  markAsRead: (id: string): Promise<ApiResponse<void>> =>
    request.patch(`/notifications/${id}/read`),
  
  retry: (id: string): Promise<ApiResponse<void>> =>
    request.post(`/notifications/${id}/retry`),
  
  getRemoteRecordStatus: (): Promise<ApiResponse<RemoteRecordStatus[]>> =>
    request.get('/remote-record/status'),
  
  retryRemoteRecord: (id: string): Promise<ApiResponse<void>> =>
    request.post('/remote-record/retry', { id }),
};

export const navigationApi = {
  searchPOI: (keyword: string): Promise<ApiResponse<Hospital[]>> =>
    request.get('/navigation/poi', { params: { keyword } }),
  
  getNearby: (longitude: number, latitude: number, radius?: number): Promise<ApiResponse<Hospital[]>> =>
    request.get('/navigation/nearby', { params: { longitude, latitude, radius } }),
};
