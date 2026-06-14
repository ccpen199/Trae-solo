import type {
  User as SharedUser,
  InsuranceInfo as SharedInsuranceInfo,
  PaymentOrder as SharedPaymentOrder,
  FamilyMutualAid as SharedFamilyMutualAid,
  PensionPayment as SharedPensionPayment,
  PaymentWarning as SharedPaymentWarning,
  AuditRule as SharedAuditRule,
} from '@shared/types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  code: number;
}

export interface LoginRequest {
  idCard: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateOrderRequest {
  insuranceType: string;
  payYear: number;
  payGrade: number;
}

export interface PayOrderRequest {
  channel: 'wechat' | 'alipay' | 'dc_epay' | 'bank';
}

export interface BindFamilyRequest {
  idCard: string;
  name: string;
  relationship: 'parent' | 'child' | 'spouse';
}

export interface AuthorizeFamilyRequest {
  authAmount: number;
}

export interface PensionEstimateRequest {
  currentAge: number;
  retirementAge: number;
  payGrade: number;
  totalMonths: number;
  averageSalary: number;
}

export interface HandleWarningRequest {
  status: 'processing' | 'resolved' | 'ignored';
  handleNote: string;
}

export interface CreateAuditRuleRequest {
  ruleName: string;
  ruleCode: string;
  ruleCondition: string;
  riskLevel: 'low' | 'medium' | 'high';
  threshold: number;
  enabled: boolean;
}

export interface UpdateAuditRuleRequest extends Partial<CreateAuditRuleRequest> {}

export interface InsuranceHistoryItem {
  id: number;
  insuranceType: string;
  payMonth: string;
  amount: number;
  status: 'paid' | 'unpaid';
  createdAt: string;
}

export interface DatashareCompareResult {
  source: string;
  localData: Record<string, unknown>;
  externalData: Record<string, unknown>;
  matchStatus: 'match' | 'mismatch' | 'missing';
  mismatchedFields: string[];
}

export type User = SharedUser;
export type InsuranceInfo = SharedInsuranceInfo;
export type PaymentOrder = SharedPaymentOrder;
export type FamilyMutualAid = SharedFamilyMutualAid;
export type PensionPayment = SharedPensionPayment;
export type PaymentWarning = SharedPaymentWarning;
export type AuditRule = SharedAuditRule;

export type UserRole = 'resident' | 'flexible' | 'admin_tax' | 'admin_ops';

export type InsuranceType = 'pension' | 'medical' | 'flexible_pension' | 'flexible_medical';

export type PaymentChannel = 'wechat' | 'alipay' | 'dc_epay' | 'bank';

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path: string;
  roles: UserRole[];
}
