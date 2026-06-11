export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  requestId: string;
}

export interface PageParams {
  pageNum: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export type InsuranceType = 'pension' | 'medical' | 'unemployment' | 'injury' | 'maternity';
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';
export type VisitType = 'outpatient' | 'inpatient' | 'pharmacy';
export type UserRole = 'personal' | 'enterprise' | 'admin';
export type AuthStatus = 'unverified' | 'pending' | 'verified' | 'failed';
export type SupervisionStatus = 'normal' | 'warning' | 'overdue' | 'completed';
export type PolicyStatus = 'draft' | 'published' | 'expired';
export type TagCategory = 'crowd' | 'scene' | 'timeliness';

export interface User {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  authStatus: AuthStatus;
  email?: string;
  address?: string;
}

export interface EnterpriseUser {
  id: string;
  companyName: string;
  creditCode: string;
  legalPerson: string;
  legalPersonIdCard: string;
  contactPhone: string;
  authStatus: AuthStatus;
  employeeCount: number;
  industry: string;
}

export interface InsuranceRecord {
  id: string;
  insuranceType: InsuranceType;
  paymentMonth: string;
  paymentBase: number;
  personalPayment: number;
  companyPayment: number;
  paymentStatus: PaymentStatus;
  companyName: string;
}

export interface InsuranceSummary {
  type: InsuranceType;
  typeName: string;
  totalMonths: number;
  personalBalance: number;
  companyBalance: number;
  totalBalance: number;
  lastPaymentMonth: string;
  status: 'normal' | 'suspended';
}

export interface TransferNode {
  name: string;
  completed: boolean;
  completedAt?: string;
  handler?: string;
  handlerDept?: string;
  remark?: string;
  promiseTime?: string;
}

export interface SupervisionRecord {
  id: string;
  triggeredAt: string;
  reason: string;
  handledBy: string;
  handleDept: string;
  result: string;
  status: 'pending' | 'processing' | 'resolved';
}

export interface ReviewRecord {
  id: string;
  reviewedAt: string;
  reviewedBy: string;
  reviewResult: 'pass' | 'recheck';
  remark: string;
}

export interface TransferProgress {
  id: string;
  transferNo: string;
  insuranceType: InsuranceType;
  fromCity: string;
  toCity: string;
  applyDate: string;
  status: 'reviewing' | 'transferring' | 'completed' | 'failed';
  currentNode: string;
  estimatedDays: number;
  completedDays: number;
  remark?: string;
  isOverdue?: boolean;
  overdueDays?: number;
  nodes?: TransferNode[];
  supervisionRecords?: SupervisionRecord[];
  reviewRecords?: ReviewRecord[];
}

export interface HousingFundAccount {
  accountNo: string;
  balance: number;
  monthlyDeposit: number;
  personalDeposit: number;
  companyDeposit: number;
  depositBase: number;
  depositRatio: number;
  totalMonths: number;
  lastDepositMonth: string;
  status: 'normal' | 'sealed' | 'withdrawn';
}

export interface HousingFundDepositRecord {
  id: string;
  month: string;
  depositBase: number;
  personalDeposit: number;
  companyDeposit: number;
  totalDeposit: number;
  status: 'paid' | 'unpaid';
  companyName: string;
}

export interface HousingFundLoanInfo {
  loanNo: string;
  loanAmount: number;
  paidPrincipal: number;
  remainingPrincipal: number;
  interestRate: number;
  loanTerm: number;
  remainingMonths: number;
  monthlyPayment: number;
  startDate: string;
  endDate: string;
  status: 'normal' | 'paid_off' | 'overdue';
}

export interface HousingFundRepaymentPlan {
  id: string;
  period: number;
  dueDate: string;
  principal: number;
  interest: number;
  monthlyPayment: number;
  remainingPrincipal: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface HousingFundWithdrawRecord {
  id: string;
  withdrawNo: string;
  withdrawType: string;
  withdrawAmount: number;
  withdrawTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
}

export interface FeeDetailItem {
  name: string;
  category: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  reimbursement: number;
  personal: number;
  isReimbursable: boolean;
}

export interface MedicalRecord {
  id: string;
  hospitalName: string;
  hospitalLevel: string;
  visitDate: string;
  visitType: VisitType;
  totalAmount: number;
  reimbursementAmount: number;
  personalPayment: number;
  reimbursementRatio: number;
  diagnosis: string;
  department: string;
  doctorName?: string;
  feeDetails?: FeeDetailItem[];
}

export interface Hospital {
  id: string;
  name: string;
  level: string;
  address: string;
  phone: string;
  type: 'general' | 'specialized' | 'community';
  isDesignated: boolean;
  distance?: number;
  designatedType?: string;
  reimbursementScope?: string;
  departments?: string[];
}

export interface Drug {
  id: string;
  name: string;
  spec: string;
  manufacturer: string;
  category: string;
  isReimbursable: boolean;
  reimbursementRatio: number;
  price: number;
  unit: string;
}

export interface ExamInfo {
  id: string;
  name: string;
  examType: string;
  registerStartTime: string;
  registerEndTime: string;
  examDate: string;
  examFee: number;
  status: 'not_started' | 'registering' | 'closed' | 'examining' | 'finished';
  totalQuestions?: number;
  duration?: number;
}

export interface ExamRegistration {
  id: string;
  examId: string;
  examName: string;
  registrationNo: string;
  applicantName: string;
  idCard: string;
  registerDate: string;
  status: 'pending' | 'approved' | 'rejected';
  examRoom?: string;
  seatNo?: string;
  ticketUrl?: string;
  score?: number;
}

export interface ECardInfo {
  cardNo: string;
  name: string;
  idCard: string;
  issueDate: string;
  validDate: string;
  status: 'active' | 'inactive' | 'lost';
  balance: number;
  lastUsedTime?: string;
  lastUsedPlace?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  type: 'medical' | 'pharmacy' | 'other';
  merchantName: string;
  paymentTime: string;
  paymentMethod: 'nfc' | 'qrcode';
  status: 'success' | 'failed';
}

export interface EmployeeInsurance {
  id: string;
  employeeName: string;
  idCard: string;
  insuranceTypes: InsuranceType[];
  paymentBase: number;
  startDate: string;
  endDate?: string;
  status: 'normal' | 'suspended' | 'terminated';
  department: string;
  position: string;
}

export interface BatchImportResult {
  successCount: number;
  failCount: number;
  totalCount: number;
  failDetails: {
    rowIndex: number;
    employeeName: string;
    errorMessage: string;
  }[];
}

export interface InsuranceChange {
  id: string;
  employeeName: string;
  idCard: string;
  type: 'add' | 'remove';
  insuranceTypes: string[];
  operationDate: string;
  effectiveMonth: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  operator: string;
  remark?: string;
}

export interface OperationLog {
  id: string;
  time: string;
  operator: string;
  type: string;
  content: string;
}

export interface UnemploymentApplication {
  id: string;
  applicationNo: string;
  applicantName: string;
  idCard: string;
  companyName: string;
  applyDate: string;
  lastWorkDate: string;
  reason: string;
  status: 'pending_review' | 'reviewing' | 'approved' | 'rejected';
  reviewComment?: string;
  reviewDate?: string;
  reviewer?: string;
  monthlyBenefit: number;
  benefitMonths: number;
}

export interface LaborContract {
  id: string;
  contractNo: string;
  employeeName: string;
  idCard: string;
  contractType: 'fixed_term' | 'open_ended' | 'project_based';
  startDate: string;
  endDate?: string;
  position: string;
  salary: number;
  status: 'pending_sign' | 'signed' | 'expired' | 'terminated';
  signDate?: string;
  storageHash: string;
  createTime: string;
}

export interface SupervisionOrder {
  id: string;
  businessType: string;
  businessNo: string;
  applicantName: string;
  applicantType: 'personal' | 'enterprise';
  receiveDate: string;
  deadlineDate: string;
  remainingDays: number;
  status: SupervisionStatus;
  currentNode: string;
  handler: string;
  handlerDept: string;
  slaDays: number;
  priority: 'low' | 'medium' | 'high';
}

export interface SupervisionStatistics {
  totalCount: number;
  normalCount: number;
  warningCount: number;
  overdueCount: number;
  completedCount: number;
  avgHandlingDays: number;
  onTimeRate: number;
  trend: {
    date: string;
    newCount: number;
    completedCount: number;
  }[];
  businessTypeDistribution: {
    type: string;
    count: number;
  }[];
}

export interface PolicyDocument {
  id: string;
  title: string;
  documentNo: string;
  issuingAuthority: string;
  publishDate: string;
  effectiveDate: string;
  expiryDate?: string;
  validUntil?: string;
  type?: 'policy' | 'notice' | 'interpretation' | string;
  tags: PolicyTag[];
  summary: string;
  content: string;
  status: PolicyStatus;
  viewCount: number;
  attachmentUrl?: string;
  applicableGroups?: string[];
  applicableScenarios?: string[];
  handlingMethods?: { channel: string; description: string; url?: string }[];
}

export interface GuideItem {
  id: string;
  title: string;
  desc: string;
  path?: string;
  category: string;
  materials: string[];
  flow: string[];
  time: string;
  dept: string;
  targetGroups: string[];
  scenarios: string[];
  timeliness: 'immediate' | 'short' | 'medium' | 'long';
  timelinessDesc: string;
  conditions: string[];
  onlineEntry?: string;
  offlineLocations?: { name: string; address: string; phone?: string }[];
}

export interface PolicyTag {
  id: string;
  name: string;
  category: TagCategory;
  color: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'business' | 'warning' | 'policy';
  isRead: boolean;
  createTime: string;
  relatedBusinessId?: string;
  relatedBusinessType?: string;
}

export type AuthMethod = 'face' | 'fingerprint' | 'idcard' | 'password';
export type VerifyStatus = 'pending' | 'verifying' | 'success' | 'failed';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type AuthChannel = 'app' | 'web' | 'mini_program' | 'terminal';

export interface FaceAuthRecord {
  id: string;
  userId: string;
  userName: string;
  idCard: string;
  authTime: string;
  authMethod: AuthMethod;
  status: VerifyStatus;
  similarity?: number;
  duration: number;
  channel: AuthChannel;
  remark?: string;
}

export interface AuthReviewRecord {
  id: string;
  applicationNo: string;
  applicantName: string;
  idCard: string;
  applyTime: string;
  authType: string;
  status: ReviewStatus;
  channel: AuthChannel;
  reviewer?: string;
  reviewTime?: string;
  reviewComment?: string;
}

export interface AuthStatistics {
  todayCount: number;
  passRate: number;
  avgDuration: number;
  pendingCount: number;
  trend: {
    date: string;
    count: number;
    successCount: number;
  }[];
  methodDistribution: {
    method: string;
    count: number;
  }[];
  channelDistribution: {
    channel: string;
    count: number;
  }[];
  passRateTrend: {
    date: string;
    rate: number;
  }[];
}

export interface PoliceDbStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'maintenance';
  lastSyncTime: string;
  responseTime: number;
  todayQueryCount: number;
}
