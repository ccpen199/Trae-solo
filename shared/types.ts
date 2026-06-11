export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserRole = 'school_admin' | 'city_admin';
export type UserStatus = 'active' | 'disabled';
export type StudentStatus = 'active' | 'graduated' | 'suspended';
export type AttendanceStatus = 'normal' | 'late' | 'absent' | 'exception';
export type CheckInType = 'face' | 'manual';
export type FundingStatus = 'pending' | 'approved' | 'distributed' | 'received';
export type AlertType = 'abnormal_leave' | 'absent' | 'funding_exception';
export type AlertLevel = 'low' | 'medium' | 'high';
export type AlertStatus = 'pending' | 'processing' | 'resolved';
export type Gender = 'male' | 'female';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  schoolId?: number;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string;
  geoFence?: GeoFenceConfig;
  createdAt: string;
}

export interface GeoFenceConfig {
  id?: number;
  schoolId: number;
  centerLat: number;
  centerLng: number;
  radius: number;
  polygon?: Array<{ lat: number; lng: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  id: number;
  studentNo: string;
  name: string;
  gender: Gender;
  grade: string;
  className: string;
  schoolId: number;
  idCard: string;
  phone?: string;
  faceData?: string;
  isPoverty: boolean;
  isFundingEligible: boolean;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  schoolName?: string;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  schoolId: number;
  checkInTime: string;
  checkInType: CheckInType;
  locationLat: number;
  locationLng: number;
  locationAccuracy: number;
  isInFence: boolean;
  faceMatchScore: number;
  status: AttendanceStatus;
  remark?: string;
  className?: string;
}

export interface FundingRecord {
  id: number;
  studentId: number;
  studentName: string;
  schoolId: number;
  schoolName?: string;
  fundingType: string;
  amount: number;
  batchNo: string;
  status: FundingStatus;
  applyTime: string;
  approveTime?: string;
  distributeTime?: string;
  receiveTime?: string;
  voucherCode?: string;
  className?: string;
}

export interface AlertRecord {
  id: number;
  schoolId: number;
  type: AlertType;
  level: AlertLevel;
  studentId?: number;
  studentName?: string;
  title: string;
  description: string;
  status: AlertStatus;
  handlerId?: number;
  handlerName?: string;
  handleTime?: string;
  handleRemark?: string;
  createdAt: string;
  schoolName?: string;
}

export interface OperationLog {
  id: number;
  userId: number;
  userName: string;
  operation: string;
  module: string;
  ip: string;
  userAgent: string;
  detail?: string;
  createdAt: string;
}

export interface AttendanceStats {
  date: string;
  schoolId: number;
  schoolName?: string;
  totalStudents: number;
  checkedIn: number;
  absent: number;
  late: number;
  exception: number;
  attendanceRate: number;
}

export interface FundingStats {
  schoolId: number;
  schoolName?: string;
  totalStudents: number;
  eligibleStudents: number;
  totalAmount: number;
  distributedAmount: number;
  receivedAmount: number;
  pendingCount: number;
  approvedCount: number;
  distributedCount: number;
  receivedCount: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CheckInRequest {
  studentId: number;
  locationLat: number;
  locationLng: number;
  locationAccuracy: number;
  faceImage?: string;
  faceMatchScore?: number;
}

export interface AlertProcessRequest {
  status: AlertStatus;
  remark: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface StudentQueryParams extends PaginationParams {
  schoolId?: number;
  grade?: string;
  className?: string;
  isPoverty?: boolean;
  status?: StudentStatus;
}

export interface AttendanceQueryParams extends PaginationParams {
  schoolId?: number;
  studentId?: number;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  className?: string;
}

export interface FundingQueryParams extends PaginationParams {
  schoolId?: number;
  studentId?: number;
  status?: FundingStatus;
  batchNo?: string;
}

export interface AlertQueryParams extends PaginationParams {
  schoolId?: number;
  type?: AlertType;
  level?: AlertLevel;
  status?: AlertStatus;
}

export interface LogQueryParams extends PaginationParams {
  userId?: number;
  module?: string;
  startDate?: string;
  endDate?: string;
}
