export interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  idCard: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "operator" | "auditor" | "courier";

export interface Waybill {
  id: string;
  waybillNo: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  realNameStatus: RealNameStatus;
  status: WaybillStatus;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export type RealNameStatus = "pending" | "verified" | "rejected";

export type WaybillStatus =
  | "created"
  | "picked"
  | "in_transit"
  | "delivering"
  | "delivered"
  | "exception";

export interface ExceptionRecord {
  id: string;
  waybillId: string;
  waybillNo: string;
  type: ExceptionType;
  description: string;
  handler: string;
  status: ExceptionStatus;
  createdAt: string;
  resolvedAt?: string;
}

export type ExceptionType =
  | "address_unknown"
  | "recipient_unreachable"
  | "damaged"
  | "lost"
  | "refused"
  | "other";

export type ExceptionStatus = "pending" | "processing" | "resolved";

export interface RegulatoryOrder {
  id: string;
  orderNo: string;
  type: RegulatoryType;
  targetId: string;
  targetType: "waybill" | "user" | "exception";
  content: string;
  issuer: string;
  status: RegulatoryStatus;
  createdAt: string;
  deadline?: string;
}

export type RegulatoryType = "inspection" | "rectification" | "review" | "warning";

export type RegulatoryStatus = "issued" | "in_progress" | "completed" | "overdue";

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
