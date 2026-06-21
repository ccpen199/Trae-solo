export type CityCode = 'BJ' | 'SH' | 'GZ' | 'SZ' | 'HZ' | 'TJ';

export const CITY_NAMES: Record<CityCode, string> = {
  BJ: '北京',
  SH: '上海',
  GZ: '广州',
  SZ: '深圳',
  HZ: '杭州',
  TJ: '天津',
};

export const CITIES: CityCode[] = ['BJ', 'SH', 'GZ', 'SZ', 'HZ', 'TJ'];

export type InsuranceType =
  | 'PENSION'
  | 'MEDICAL'
  | 'UNEMPLOYMENT'
  | 'INJURY'
  | 'MATERNITY'
  | 'HOUSING_FUND';

export const INSURANCE_NAMES: Record<InsuranceType, string> = {
  PENSION: '养老保险',
  MEDICAL: '医疗保险',
  UNEMPLOYMENT: '失业保险',
  INJURY: '工伤保险',
  MATERNITY: '生育保险',
  HOUSING_FUND: '住房公积金',
};

export type UserRole =
  | 'PERSONAL'
  | 'ENTERPRISE_HR'
  | 'FINANCE'
  | 'CS_AGENT'
  | 'ADMIN';

export interface UserInfo {
  id: string;
  phone: string;
  nickname?: string;
  avatar?: string;
  realName?: string;
  idNumber?: string;
  role: UserRole;
  realNameVerified: boolean;
  enterpriseVerified?: boolean;
  enterpriseName?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface CityPolicy {
  code: CityCode;
  name: string;
  socialAvgSalary: number;
  minBase: number;
  maxBase: number;
  baseRangeMinPercent: number;
  baseRangeMaxPercent: number;
  highlights: string[];
}

export interface LegalBasis {
  title: string;
  docNo: string;
  effectiveDate: string;
  article: string;
  url: string;
}

export interface RateItem {
  type: InsuranceType;
  name: string;
  personalRate: number;
  companyRate: number;
  fixedAmount?: number;
  legalBasis: LegalBasis;
}

export interface CityRatePlan {
  cityCode: CityCode;
  cityName: string;
  effectiveDate: string;
  items: RateItem[];
}

export interface CalculatorRequest {
  cityCode: CityCode;
  baseAmount: number;
  selectedItems: InsuranceType[];
  housingFundPercent?: number;
  isCompanyPay?: boolean;
}

export interface CalculatorResultItem {
  type: InsuranceType;
  name: string;
  base: number;
  personalRate: number;
  companyRate: number;
  personalAmount: number;
  companyAmount: number;
  totalAmount: number;
  legalBasis: LegalBasis;
}

export interface CalculatorResult {
  cityCode: CityCode;
  cityName: string;
  baseAmount: number;
  items: CalculatorResultItem[];
  personalTotal: number;
  companyTotal: number;
  grandTotal: number;
}

export interface CompareRequest {
  baseAmount: number;
  selectedItems: InsuranceType[];
  housingFundPercent?: number;
  cities: CityCode[];
}

export interface CompareResult {
  results: Partial<Record<CityCode, CalculatorResult>>;
  summary: {
    cheapestCity: CityCode;
    mostExpensiveCity: CityCode;
    maxDiffPersonal: number;
    maxDiffCompany: number;
  };
}

export type AuthStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AuthProgress {
  userId: string;
  idCardVerified: boolean;
  faceVerified: boolean;
  contractVerified: boolean;
  overallStatus: AuthStatus;
  rejectReason?: string;
  submitTime: string;
  verifyTime?: string;
  idCardInfo?: {
    name: string;
    idNumber: string;
    gender: string;
    ethnicity: string;
    birthDate: string;
    address: string;
    issuingAuthority: string;
    validFrom: string;
    validTo: string;
  };
}

export type TransactionType =
  | 'SUPPLEMENTARY_PAY'
  | 'BASE_ADJUSTMENT'
  | 'HOSPITAL_CHANGE'
  | 'TRANSFER'
  | 'INFO_MODIFY';

export type TransactionStatus =
  | 'SUBMITTED'
  | 'AI_REVIEWING'
  | 'AI_REJECTED'
  | 'MANUAL_REVIEWING'
  | 'MANUAL_REJECTED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED';

export const TRANSACTION_NAMES: Record<TransactionType, string> = {
  SUPPLEMENTARY_PAY: '社保补缴',
  BASE_ADJUSTMENT: '基数调整',
  HOSPITAL_CHANGE: '定点医院变更',
  TRANSFER: '社保转移接续',
  INFO_MODIFY: '个人信息修改',
};

export const TRANSACTION_STATUS_NAMES: Record<TransactionStatus, string> = {
  SUBMITTED: '已提交',
  AI_REVIEWING: 'AI审核中',
  AI_REJECTED: 'AI审核未通过',
  MANUAL_REVIEWING: '人工审核中',
  MANUAL_REJECTED: '人工审核未通过',
  PROCESSING: '社保局处理中',
  SUCCESS: '办理成功',
  FAILED: '办理失败',
};

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  SUBMITTED: 'default',
  AI_REVIEWING: 'processing',
  AI_REJECTED: 'warning',
  MANUAL_REVIEWING: 'processing',
  MANUAL_REJECTED: 'error',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'error',
};

export interface Hospital {
  id: string;
  cityCode: CityCode;
  name: string;
  level: '三甲' | '三乙' | '二甲' | '二乙' | '一甲' | '社区';
  address: string;
  isDesignated: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  status: TransactionStatus;
  cityCode: CityCode;
  requestData: any;
  resultData?: any;
  ipAddress: string;
  submittedAt: string;
  updatedAt: string;
  completedAt?: string;
  timeline: Array<{
    status: TransactionStatus;
    time: string;
    operator: string;
    comment?: string;
  }>;
}

export type CertificateType =
  | 'INSURANCE_APPLY'
  | 'SUPPLEMENTARY_PAY'
  | 'BASE_ADJUSTMENT'
  | 'HOSPITAL_CHANGE'
  | 'TRANSFER'
  | 'PAYMENT';

export const CERTIFICATE_NAMES: Record<CertificateType, string> = {
  INSURANCE_APPLY: '参保申请凭证',
  SUPPLEMENTARY_PAY: '补缴申请凭证',
  BASE_ADJUSTMENT: '基数调整凭证',
  HOSPITAL_CHANGE: '医院变更凭证',
  TRANSFER: '转移接续凭证',
  PAYMENT: '缴费凭证',
};

export interface Certificate {
  id: string;
  certificateNo: string;
  type: CertificateType;
  userId: string;
  transactionId?: string;
  title: string;
  content: Record<string, any>;
  timestamp: string;
  ipAddress: string;
  operatorName: string;
  hash: string;
  blockchainTxId?: string;
  pdfUrl: string;
  qrCodeUrl: string;
  verifyUrl: string;
  createdAt: string;
}

export interface PolicyDocument {
  id: string;
  cityCode: CityCode | 'NATIONAL';
  cityName: string;
  title: string;
  docNo: string;
  issuingAuthority: string;
  issueDate: string;
  effectiveDate: string;
  status: 'EFFECTIVE' | 'EXPIRED';
  category: string;
  applicableGroups: string[];
  content: string;
  tags: string[];
  relatedDocIds: string[];
  sourceUrl: string;
}

export type TicketIntent =
  | 'PAYMENT_INTERRUPT'
  | 'TRANSFER'
  | 'PENSION_CALCULATE'
  | 'REIMBURSEMENT'
  | 'BASE_QUESTION'
  | 'POLICY_CONSULT'
  | 'REFUND'
  | 'OTHER';

export const INTENT_NAMES: Record<TicketIntent, string> = {
  PAYMENT_INTERRUPT: '社保断缴问题',
  TRANSFER: '社保转移接续',
  PENSION_CALCULATE: '退休金计算',
  REIMBURSEMENT: '医保报销问题',
  BASE_QUESTION: '缴费基数问题',
  POLICY_CONSULT: '政策咨询',
  REFUND: '退费申请',
  OTHER: '其他问题',
};

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus =
  | 'NEW'
  | 'AI_PROCESSING'
  | 'AI_RESOLVED'
  | 'PENDING_AGENT'
  | 'ASSIGNED'
  | 'PROCESSING'
  | 'PENDING_USER'
  | 'RESOLVED'
  | 'CLOSED';

export const TICKET_STATUS_NAMES: Record<TicketStatus, string> = {
  NEW: '新工单',
  AI_PROCESSING: 'AI处理中',
  AI_RESOLVED: 'AI已解决',
  PENDING_AGENT: '待人工分配',
  ASSIGNED: '已分配坐席',
  PROCESSING: '处理中',
  PENDING_USER: '待用户回复',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

export interface ChatMessage {
  id: string;
  role: 'USER' | 'AI' | 'AGENT' | 'SYSTEM';
  content: string;
  timestamp: string;
  relatedPolicyIds?: string[];
}

export interface Ticket {
  id: string;
  ticketNo: string;
  userId: string;
  subject: string;
  intent: TicketIntent;
  confidence: number;
  priority: TicketPriority;
  status: TicketStatus;
  cityCode?: CityCode;
  agentName?: string;
  satisfaction?: 1 | 2 | 3 | 4 | 5;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TaxDeduction {
  type:
    | 'CHILD_EDUCATION'
    | 'CONTINUING_EDUCATION'
    | 'HOUSING_LOAN'
    | 'HOUSING_RENT'
    | 'ELDERLY_SUPPORT'
    | 'INFANT_CARE';
  name: string;
  monthlyAmount: number;
  effectiveFrom: string;
}

export interface Employee {
  id: string;
  employeeNo: string;
  name: string;
  idNumber: string;
  phone: string;
  department: string;
  position: string;
  cityCode: CityCode;
  insuranceBase: number;
  housingFundBase: number;
  housingFundPercent: number;
  selectedItems: InsuranceType[];
  status: 'ONBOARD' | 'INSURED' | 'SUSPENDED' | 'OFFBOARD';
  entryDate: string;
  taxDeductions: TaxDeduction[];
}

export interface SalaryItem {
  employeeId: string;
  employeeNo: string;
  name: string;
  department: string;
  baseSalary: number;
  bonus: number;
  allowance: number;
  totalPay: number;
  personalInsurance: number;
  personalHousingFund: number;
  taxDeductionTotal: number;
  taxableIncome: number;
  individualTax: number;
  netSalary: number;
}

export interface PayrollBatch {
  id: string;
  batchNo: string;
  month: string;
  items: SalaryItem[];
  totalCount: number;
  totalAmount: number;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'BANK_PROCESSING'
    | 'PARTIAL_SUCCESS'
    | 'SUCCESS'
    | 'FAILED';
  bankReceiptUrl?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  activePlans: number;
  monthlyAmount: number;
  pendingTransactions: number;
  pendingTickets: number;
  currentCity: CityCode;
  recentTransactions: Transaction[];
  policyUpdates: Array<{
    id: string;
    cityCode: CityCode;
    title: string;
    effectiveDate: string;
  }>;
}
