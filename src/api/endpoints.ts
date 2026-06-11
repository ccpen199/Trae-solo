import { get, post, put, del } from './client';
import type {
  User,
  Student,
  AttendanceRecord,
  FundingRecord,
  AlertRecord,
  OperationLog,
  AttendanceStats,
  FundingStats,
  GeoFenceConfig,
  LoginRequest,
  LoginResponse,
  CheckInRequest,
  AlertProcessRequest,
  PageResponse,
  StudentQueryParams,
  AttendanceQueryParams,
  FundingQueryParams,
  AlertQueryParams,
  LogQueryParams,
} from '@shared/types';

export const authApi = {
  login: (data: LoginRequest) => post<LoginResponse>('/auth/login', data),
  logout: () => post<void>('/auth/logout'),
  getProfile: () => get<User>('/auth/profile'),
  changePassword: (data: { oldPassword: string; newPassword: string }) => put<void>('/auth/password', data),
};

export const studentApi = {
  getList: (params: StudentQueryParams) => get<PageResponse<Student>>('/students', params),
  getDetail: (id: number) => get<Student>(`/students/${id}`),
  create: (data: Partial<Student>) => post<Student>('/students', data),
  update: (id: number, data: Partial<Student>) => put<Student>(`/students/${id}`, data),
  delete: (id: number) => del<void>(`/students/${id}`),
  uploadFace: (id: number, faceData: string) => post<void>(`/students/${id}/face`, { faceData }),
};

export const attendanceApi = {
  getList: (params: AttendanceQueryParams) => get<PageResponse<AttendanceRecord>>('/attendance', params),
  checkIn: (data: CheckInRequest) => post<AttendanceRecord>('/attendance/checkin', data),
  getStatistics: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) => 
    get<AttendanceStats[]>('/attendance/statistics', params),
};

export const fundingApi = {
  getList: (params: FundingQueryParams) => get<PageResponse<FundingRecord>>('/funding', params),
  compareLists: (schoolId?: number) => post<{ matched: Student[]; unmatched: Student[]; differences: string[] }>('/funding/compare', { schoolId }),
  getDistribution: (params: FundingQueryParams) => get<PageResponse<FundingRecord>>('/funding/distribution', params),
  updateDistributionStatus: (id: number, status: string) => put<FundingRecord>(`/funding/distribution/${id}`, { status }),
  generateVoucher: (id: number) => get<{ voucherCode: string; qrCode: string; downloadUrl: string }>(`/funding/voucher/${id}`),
};

export const alertApi = {
  getList: (params: AlertQueryParams) => get<PageResponse<AlertRecord>>('/alerts', params),
  processAlert: (id: number, data: AlertProcessRequest) => put<AlertRecord>(`/alerts/${id}/process`, data),
};

export const statisticsApi = {
  getAttendanceStats: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) => 
    get<AttendanceStats[]>('/statistics/attendance', params),
  getFundingStats: (params?: { schoolId?: number }) => get<FundingStats[]>('/statistics/funding', params),
  getOverview: () => get<{
    totalStudents: number;
    todayAttendanceRate: number;
    todayCheckedIn: number;
    totalFundingAmount: number;
    pendingAlerts: number;
    pendingFunding: number;
  }>('/statistics/attendance'),
};

export const geofenceApi = {
  getConfig: (schoolId?: number) => get<GeoFenceConfig>('/geofence', { schoolId }),
  updateConfig: (data: GeoFenceConfig) => put<GeoFenceConfig>('/geofence', data),
};

export const logsApi = {
  getList: (params: LogQueryParams) => get<PageResponse<OperationLog>>('/logs', params),
};
