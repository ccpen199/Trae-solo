import request from './request';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  User,
  InsuranceInfo,
  PaymentOrder,
  CreateOrderRequest,
  PayOrderRequest,
  FamilyMutualAid,
  BindFamilyRequest,
  AuthorizeFamilyRequest,
  PensionPayment,
  PensionEstimateRequest,
  PaymentWarning,
  HandleWarningRequest,
  AuditRule,
  CreateAuditRuleRequest,
  UpdateAuditRuleRequest,
  DatashareCompareResult,
  InsuranceHistoryItem,
} from '@/types';

export const auth = {
  login: (data: LoginRequest) =>
    request.post<unknown, ApiResponse<LoginResponse>>('/auth/login', data),
  
  getProfile: () =>
    request.get<unknown, ApiResponse<User>>('/auth/profile'),
};

export const user = {
  getProfile: auth.getProfile,
};

export const insurance = {
  getList: () =>
    request.get<unknown, ApiResponse<InsuranceInfo[]>>('/insurance'),
  
  getHistory: (id: number) =>
    request.get<unknown, ApiResponse<InsuranceHistoryItem[]>>(`/insurance/${id}/history`),
};

export const payment = {
  getOrders: () =>
    request.get<unknown, ApiResponse<PaymentOrder[]>>('/payment/orders'),
  
  createOrder: (data: CreateOrderRequest) =>
    request.post<unknown, ApiResponse<PaymentOrder>>('/payment/create-order', data),
  
  payOrder: (id: number, data: PayOrderRequest) =>
    request.post<unknown, ApiResponse<PaymentOrder>>(`/payment/${id}/pay`, data),
  
  getOrderStatus: (id: number) =>
    request.get<unknown, ApiResponse<PaymentOrder>>(`/payment/${id}/status`),
};

export const family = {
  getMembers: () =>
    request.get<unknown, ApiResponse<FamilyMutualAid[]>>('/family/members'),
  
  bind: (data: BindFamilyRequest) =>
    request.post<unknown, ApiResponse<FamilyMutualAid>>('/family/bind', data),

  bindMember: (data: BindFamilyRequest) =>
    request.post<unknown, ApiResponse<FamilyMutualAid>>('/family/bind', data),
  
  authorize: (id: number, data: AuthorizeFamilyRequest) =>
    request.post<unknown, ApiResponse<FamilyMutualAid>>(`/family/${id}/authorize`, data),

  adjustAuthAmount: (id: number, data: AuthorizeFamilyRequest) =>
    request.post<unknown, ApiResponse<FamilyMutualAid>>(`/family/${id}/authorize`, data),

  verifyMember: (id: number) =>
    request.post<unknown, ApiResponse<FamilyMutualAid>>('/family/verify-police', { memberId: id }),

  unbindMember: (id: number) =>
    request.post<unknown, ApiResponse<{ message: string }>>(`/family/${id}/unbind`),

  getUsageRecords: () =>
    request.get<unknown, ApiResponse<unknown[]>>('/family/usage-records'),
};

export const benefit = {
  getPension: () =>
    request.get<unknown, ApiResponse<PensionPayment[]>>('/benefit/pension'),
  
  getMedical: () =>
    request.get<unknown, ApiResponse<unknown[]>>('/benefit/medical'),
};

export const calculator = {
  pensionEstimate: (data: PensionEstimateRequest) =>
    request.post<unknown, ApiResponse<{ estimateAmount: number; details: Record<string, number> }>>('/calculator/pension-estimate', data),
};

export const admin = {
  getWarnings: () =>
    request.get<unknown, ApiResponse<PaymentWarning[]>>('/admin/warnings'),
  
  handleWarning: (id: number, data: HandleWarningRequest) =>
    request.post<unknown, ApiResponse<PaymentWarning>>(`/admin/warnings/${id}/handle`, data),
  
  getAuditRules: () =>
    request.get<unknown, ApiResponse<AuditRule[]>>('/admin/audit-rules'),
  
  createAuditRule: (data: CreateAuditRuleRequest) =>
    request.post<unknown, ApiResponse<AuditRule>>('/admin/audit-rules', data),
  
  updateAuditRule: (id: number, data: UpdateAuditRuleRequest) =>
    request.put<unknown, ApiResponse<AuditRule>>(`/admin/audit-rules/${id}`, data),
  
  datashareCompare: () =>
    request.get<unknown, ApiResponse<DatashareCompareResult[]>>('/admin/datashare/compare'),
};

export const warning = {
  getList: admin.getWarnings,
  handle: admin.handleWarning,
};

export default {
  auth,
  user,
  insurance,
  payment,
  family,
  benefit,
  calculator,
  admin,
  warning,
};
