export type UserRole = 'insured' | 'employed' | 'retired' | 'agent'

export interface User {
  id: string
  name: string
  idCard: string
  role: UserRole
  region: string
  authLevel: 1 | 2
  avatar: string
}

export interface AuthResult {
  success: boolean
  token: string
  user: User
  riskLevel: 'low' | 'medium' | 'high'
}

export type InsuranceType = 'pension' | 'medical' | 'unemployment' | 'workInjury' | 'maternity'

export interface SocialInsuranceRecord {
  type: InsuranceType
  status: 'active' | 'suspended' | 'closed'
  months: number
  baseAmount: number
  personalAmount: number
  companyAmount: number
  monthlyDetails: MonthlyDetail[]
}

export interface MonthlyDetail {
  month: string
  personalPay: number
  companyPay: number
  base: number
}

export interface TransferApplication {
  id: string
  fromProvince: string
  toProvince: string
  transferType: 'pension' | 'medical'
  status: 'pending' | 'reviewing' | 'approved' | 'transferring' | 'completed' | 'rejected'
  steps: TransferStep[]
  createdAt: string
}

export interface TransferStep {
  name: string
  status: 'done' | 'current' | 'pending'
  date?: string
  note?: string
}

export interface UnemploymentRegistration {
  id: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  reason: string
  lastEmployer: string
  severanceDate: string
  claimAmount?: number
  claimMonths?: number
}

export interface PensionEstimate {
  monthlyPension: number
  replacementRate: number
  totalContribution: number
  projectedPension: YearlyProjection[]
}

export interface YearlyProjection {
  year: number
  monthlyAmount: number
  cumulative: number
}

export interface DailyCount {
  date: string
  count: number
}

export interface OverdueItem {
  id: string
  service: string
  applicant: string
  days: number
  level: 'warning' | 'critical'
}

export interface ProvinceData {
  province: string
  count: number
  growth: number
}

export interface ServiceRanking {
  name: string
  calls: number
  completionRate: number
}

export interface DashboardData {
  totalCalls: number
  callsTrend: DailyCount[]
  completionRate: number
  completionTrend: DailyCount[]
  overdueWarnings: OverdueItem[]
  provinceHotspots: ProvinceData[]
  topServices: ServiceRanking[]
}

export interface AuditLogEntry {
  id: string
  operatorId: string
  operatorName: string
  action: string
  category: 'query' | 'transfer' | 'claim' | 'certify' | 'review' | 'system'
  target: string
  timestamp: string
  ip: string
  result: 'success' | 'failure'
}

export interface Notification {
  id: string
  title: string
  content: string
  time: string
  read: boolean
  type: 'info' | 'warning' | 'success' | 'error'
}

export interface TodoItem {
  id: string
  title: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'done'
}

export interface CertificationRecord {
  id: string
  type: 'face' | 'card'
  status: 'success' | 'failed' | 'pending'
  time: string
  location: string
}

export interface EVoucherRecord {
  id: string
  type: 'medical' | 'transit' | 'culture'
  amount?: number
  location: string
  time: string
  status: 'used' | 'pending'
}

export interface MediationCase {
  id: string
  title: string
  status: 'pending' | 'mediating' | 'settled' | 'failed'
  counterparty: string
  createdAt: string
  messages: MediationMessage[]
}

export interface MediationMessage {
  id: string
  sender: 'applicant' | 'counterparty' | 'mediator'
  content: string
  time: string
}

export interface QualificationCert {
  id: string
  name: string
  level: string
  issueDate: string
  issuer: string
  valid: boolean
  certNo: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  insured: '参保人',
  employed: '就业者',
  retired: '退休人员',
  agent: '基层经办人员',
}

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  pension: '养老保险',
  medical: '医疗保险',
  unemployment: '失业保险',
  workInjury: '工伤保险',
  maternity: '生育保险',
}

export const INSURANCE_COLORS: Record<InsuranceType, string> = {
  pension: '#1B3A5C',
  medical: '#3498DB',
  unemployment: '#F39C12',
  workInjury: '#E74C3C',
  maternity: '#2ECC71',
}
