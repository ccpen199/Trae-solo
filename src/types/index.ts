export interface ApiResponse<T> {
  code: string
  message: string
  data: T
  requestId: string
  timestamp: number
}

export type InsuranceType = 'pension' | 'medical' | 'unemployment' | 'injury' | 'maternity' | 'housing'

export interface SocialInsuranceAccount {
  insuranceType: InsuranceType
  personalMonthly: number
  companyMonthly: number
  totalMonths: number
  accountBalance: number
  status: 'active' | 'suspended' | 'transfering'
}

export interface MonthlyRecord {
  month: string
  base: number
  personalAmount: number
  companyAmount: number
  status: 'paid' | 'unpaid' | 'adjusting'
}

export interface TransferStep {
  name: string
  status: 'done' | 'current' | 'pending' | 'timeout'
  completedAt?: string
  description: string
}

export interface TransferProgress {
  transferId: string
  fromProvince: string
  toProvince: string
  status: 'pending' | 'processing' | 'timeout' | 'completed'
  steps: TransferStep[]
  createdAt: string
  deadline: string
}

export interface DrugItem {
  name: string
  category: '甲类' | '乙类' | '丙类'
  price: number
  isCovered: boolean
}

export interface MedicalRecord {
  recordId: string
  hospitalName: string
  department: string
  visitDate: string
  diagnosis: string
  totalCost: number
  reimbursement: number
  reimbursementRatio: number
  drugs: DrugItem[]
}

export interface DesignatedHospital {
  id: string
  name: string
  level: '三级甲等' | '三级乙等' | '二级甲等' | '二级乙等' | '一级'
  address: string
  isContracted: boolean
}

export interface ExamInfo {
  examId: string
  name: string
  registrationStart: string
  registrationEnd: string
  examDate: string
  status: 'open' | 'closed' | 'upcoming'
  registeredCount: number
  category: string
}

export interface EmployeeDeclaration {
  employeeId: string
  name: string
  idNumber: string
  operation: 'add' | 'remove'
  insuranceTypes: string[]
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  submittedAt?: string
}

export interface UnemploymentApplication {
  applicationId: string
  employeeName: string
  idNumber: string
  reason: string
  applicationDate: string
  status: 'draft' | 'submitted' | 'pre-reviewing' | 'approved' | 'rejected'
  requiredDocs: string[]
  submittedDocs: string[]
}

export interface EContract {
  contractId: string
  title: string
  parties: string[]
  signDate: string
  status: 'draft' | 'signed' | 'notarized' | 'expired'
  blockchainHash: string
  templateName: string
}

export interface PolicyTag {
  name: string
  category: '人群' | '场景' | '时效'
  confidence: number
}

export interface PolicyDocument {
  policyId: string
  title: string
  publishDate: string
  effectiveDate: string
  expiryDate?: string
  tags: PolicyTag[]
  summary: string
}

export interface TimeoutWarning {
  warningId: string
  businessType: string
  applicantName: string
  submittedAt: string
  deadline: string
  remainingDays: number
  level: 'red' | 'orange' | 'yellow'
  handler: string
  status: 'active' | 'supervised' | 'resolved'
}

export interface IdentityAudit {
  auditId: string
  userName: string
  idNumber: string
  authMethod: 'face' | 'fingerprint' | 'voice'
  authTime: string
  status: 'passed' | 'failed' | 'suspicious'
  matchScore: number
}

export interface Notification {
  id: string
  title: string
  date: string
  type: 'policy' | 'service' | 'system'
  content: string
}

export interface DashboardMetric {
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
}
