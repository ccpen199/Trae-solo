export type UserRole = 'citizen' | 'enterprise' | 'department_admin' | 'platform_admin' | 'department_staff' | 'platform_operate'

export type Gender = 'male' | 'female' | 'other'

export type AuthType = 'password' | 'sms' | 'face' | 'ca'

export interface User {
  id: string
  username: string
  realName: string
  idCard: string
  phone: string
  email?: string
  avatar?: string
  gender: Gender
  birthDate: string
  address: string
  role: UserRole
  enterpriseId?: string
  enterpriseName?: string
  departmentId?: string
  departmentName?: string
  verified: boolean
  isActive: boolean
  lastLoginTime: string
  lastLoginIp: string
  createTime: string
  updateTime: string
}

export interface LoginForm {
  username?: string
  password?: string
  phone?: string
  smsCode?: string
  authType: AuthType
  remember?: boolean
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: User
}

export type ServiceCategory =
  | 'social_security'
  | 'medical_insurance'
  | 'education'
  | 'housing_fund'
  | 'traffic'
  | 'culture_tourism'
  | 'civil_affairs'
  | 'taxation'
  | 'industry_commerce'
  | 'public_security'
  | 'justice'
  | 'health'

export interface Department {
  id: string
  name: string
  shortName: string
  category: ServiceCategory
  icon: string
  color: string
  description: string
  serviceCount: number
  address: string
  phone: string
  workHours: string
  leader?: string
}

export type ServiceStatus = 'active' | 'suspended' | 'offline'

export type ServiceLevel = 'national' | 'provincial' | 'municipal' | 'district'

export interface ServiceMaterial {
  id: string
  name: string
  required: boolean
  format: string
  description: string
  templateUrl?: string
  exampleUrl?: string
}

export interface ServiceStep {
  step: number
  title: string
  description: string
  duration: string
}

export interface ServiceItem {
  id: string
  departmentId: string
  departmentName: string
  name: string
  shortName: string
  category: ServiceCategory
  status: ServiceStatus
  level: ServiceLevel
  icon: string
  description: string
  workDays: string
  chargeStandard: string
  hotLevel: number
  viewCount: number
  applyCount: number
  satisfaction: number
  materials: ServiceMaterial[]
  steps: ServiceStep[]
  conditions: string[]
  notices: string[]
  onlineApply: boolean
  appointment: boolean
  handleMethod: 'online' | 'offline' | 'both'
  promiseDays: number
  isInstant: boolean
  serviceType: 'personal' | 'enterprise' | 'convenience'
  createTime: string
  updateTime: string
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'reviewing'
  | 'supplement'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'

export interface ApplicationTimeline {
  id: string
  status: ApplicationStatus
  title: string
  description: string
  operator: string
  operatorRole: string
  time: string
  attachments?: string[]
}

export interface ApplicationFormField {
  key: string
  label: string
  value: string | number | boolean | string[]
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file'
}

export interface ApplicationMaterial {
  id: string
  name: string
  required: boolean
  url?: string
  status: 'uploaded' | 'pending' | 'approved' | 'rejected'
  remark?: string
}

export interface Application {
  id: string
  applyNo: string
  serviceId: string
  serviceName: string
  departmentId: string
  departmentName: string
  userId: string
  userName: string
  idCard: string
  phone: string
  status: ApplicationStatus
  currentStep: number
  totalSteps: number
  formData: ApplicationFormField[]
  materials: ApplicationMaterial[]
  timeline: ApplicationTimeline[]
  supplementNotice?: string
  rejectReason?: string
  resultUrl?: string
  resultNotice?: string
  submitTime: string
  acceptTime?: string
  completeTime?: string
  deadline: string
  isOverdue: boolean
  rating?: number
  comment?: string
}

export type TicketType = 'complaint' | 'suggestion' | 'consultation' | 'help' | 'praise'

export type TicketStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'processing'
  | 'replied'
  | 'evaluating'
  | 'rectifying'
  | 'reviewing'
  | 'completed'
  | 'closed'
  | 'archived'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ReplyMethod = 'phone' | 'sms' | 'message'

export interface TicketReply {
  id: string
  content: string
  operator: string
  operatorRole: string
  attachments?: string[]
  time: string
}

export interface TicketTimeline {
  id: string
  status: TicketStatus
  title: string
  description: string
  operator?: string
  operatorRole?: string
  time: string
  attachments?: string[]
}

export interface RectificationRecord {
  id: string
  ticketId: string
  status: 'pending' | 'processing' | 'completed' | 'verified' | 'failed'
  triggerReason: string
  responsibleDept: string
  responsiblePerson: string
  plan?: string
  progress?: string
  result?: string
  deadline: string
  createTime: string
  completeTime?: string
  verifyTime?: string
  userSatisfied?: boolean
}

export interface ReviewRecord {
  id: string
  ticketId: string
  reason: string
  applicant: string
  applicantId: string
  status: 'pending' | 'reviewing' | 'completed'
  result?: 'upheld' | 'reprocess'
  reviewRemark?: string
  reviewer?: string
  applyTime: string
  reviewTime?: string
}

export interface Ticket {
  id: string
  ticketNo: string
  type: TicketType
  title: string
  content: string
  category: string
  subCategory: string
  userId: string
  userName: string
  phone: string
  email?: string
  location?: string
  anonymous: boolean
  priority: TicketPriority
  status: TicketStatus
  replyMethod: ReplyMethod
  departmentId?: string
  departmentName?: string
  assignee?: string
  assigneeRole?: string
  slaHours: number
  remainingHours?: number
  isOverdue: boolean
  attachments: string[]
  replies: TicketReply[]
  timeline: TicketTimeline[]
  submitTime: string
  assignTime?: string
  acceptTime?: string
  firstReplyTime?: string
  closeTime?: string
  archiveTime?: string
  rating?: number
  comment?: string
  evaluationId?: string
  rectificationStatus?: 'pending' | 'processing' | 'completed' | 'verified' | 'failed'
  reviewStatus?: 'pending' | 'reviewing' | 'completed'
  currentStep: number
  totalSteps: number
  isKeySupervision?: boolean
  extendCount?: number
}

export type EvaluationSource = 'application' | 'ticket' | 'venue' | 'general'

export interface EvaluationDimension {
  key: string
  label: string
  rating: number
}

export interface Evaluation {
  id: string
  source: EvaluationSource
  sourceId: string
  sourceNo: string
  sourceName: string
  userId: string
  userName: string
  overallRating: number
  speedRating: number
  attitudeRating: number
  qualityRating: number
  convenienceRating: number
  tags: string[]
  content: string
  images: string[]
  departmentId: string
  departmentName: string
  operatorId?: string
  operatorName?: string
  replyContent?: string
  replyTime?: string
  isRectified: boolean
  rectificationStatus?: 'pending' | 'processing' | 'verified' | 'failed'
  rectificationRemark?: string
  rectifyMeasures?: string
  rectifyResponsible?: string
  rectifyDeadline?: string
  rectificationTimeline?: RectificationTimelineItem[]
  verificationResult?: string
  anonymous: boolean
  createTime: string
}

export interface RectificationTimelineItem {
  id: string
  status: string
  title: string
  description: string
  operator?: string
  time: string
}

export interface DispatchRule {
  id: string
  name: string
  keywords: string[]
  departmentId: string
  departmentName: string
  category?: string
  priority: number
  enabled: boolean
  createTime: string
  updateTime: string
}

export type EvaluationTagCategory = 'positive' | 'negative' | 'neutral'

export interface EvaluationTag {
  id: string
  label: string
  category: EvaluationTagCategory
  sort: number
}

export type MonitorStatus = 'healthy' | 'warning' | 'critical' | 'offline'

export interface ServiceMonitor {
  id: string
  name: string
  departmentId: string
  departmentName: string
  status: MonitorStatus
  availability: number
  avgResponseTime: number
  p99ResponseTime: number
  errorRate: number
  totalRequests: number
  successRequests: number
  failedRequests: number
  lastCheckTime: string
  lastSuccessTime?: string
  lastFailTime?: string
  lastErrorMessage?: string
  warningThreshold: number
  criticalThreshold: number
  alerts: MonitorAlert[]
}

export interface MonitorAlert {
  id: string
  monitorId: string
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  createTime: string
  resolveTime?: string
  resolver?: string
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface ReportSummary {
  totalApplications: number
  completedApplications: number
  completionRate: number
  avgProcessingDays: number
  totalTickets: number
  completedTickets: number
  avgTicketHours: number
  avgRating: number
  totalEvaluations: number
  goodRate: number
}

export interface DepartmentRanking {
  departmentId: string
  departmentName: string
  applicationCount: number
  completionRate: number
  avgProcessingDays: number
  avgRating: number
  rank: number
  trend: 'up' | 'down' | 'stable'
}

export interface ServiceRanking {
  serviceId: string
  serviceName: string
  departmentName: string
  applyCount: number
  satisfaction: number
  rank: number
}

export interface Report {
  id: string
  title: string
  type: ReportType
  period: string
  startDate: string
  endDate: string
  summary: ReportSummary
  departmentRankings: DepartmentRanking[]
  serviceRankings: ServiceRanking[]
  trendData: ReportTrendItem[]
  hotIssues: HotIssue[]
  recommendations: string[]
  creator: string
  createTime: string
  pdfUrl?: string
}

export interface ReportTrendItem {
  date: string
  applications: number
  completions: number
  tickets: number
  avgRating: number
}

export interface HotIssue {
  category: string
  count: number
  description: string
  trend: 'up' | 'down' | 'stable'
}

export interface SocialSecurityRecord {
  id: string
  type: 'pension' | 'medical' | 'unemployment' | 'injury' | 'maternity'
  period: string
  base: number
  personalPayment: number
  companyPayment: number
  status: 'paid' | 'unpaid' | 'refunded'
  payTime?: string
}

export interface SocialSecurityInfo {
  insuranceNo: string
  status: 'normal' | 'suspended' | 'terminated'
  participateDate: string
  cumulativeMonths: number
  pensionBalance: number
  personalAccountBalance: number
  records: SocialSecurityRecord[]
}

export interface MedicalInsuranceRecord {
  id: string
  period: string
  personalPayment: number
  companyPayment: number
  reimbursementAmount: number
  hospitalLevel?: string
  status: 'paid' | 'unpaid'
}

export interface MedicalInsuranceInfo {
  cardNo: string
  status: 'normal' | 'suspended' | 'terminated'
  participateDate: string
  cumulativeMonths: number
  personalAccountBalance: number
  overallAccountBalance: number
  thisYearReimbursement: number
  totalReimbursement: number
  records: MedicalInsuranceRecord[]
}

export interface EducationInfo {
  studentId: string
  name: string
  idCard: string
  currentSchool: string
  currentGrade: string
  currentClass: string
  status: 'studying' | 'graduated' | 'suspended' | 'transferred'
  enrollmentDate: string
  expectedGraduationDate?: string
  educationHistory: EducationRecord[]
  scores: ScoreRecord[]
}

export interface EducationRecord {
  id: string
  schoolName: string
  educationLevel: 'primary' | 'junior' | 'senior' | 'college' | 'university'
  startTime: string
  endTime: string
  major?: string
  status: 'studying' | 'graduated' | 'suspended' | 'dropped'
}

export interface ScoreRecord {
  id: string
  semester: string
  subject: string
  score: number
  level: 'excellent' | 'good' | 'pass' | 'fail'
  classRank?: number
  gradeRank?: number
}

export interface HousingFundRecord {
  id: string
  period: string
  type: 'deposit' | 'withdraw' | 'loan' | 'interest' | 'adjustment'
  amount: number
  balance: number
  description: string
  operator: string
  time: string
}

export interface HousingFundLoanInfo {
  loanNo: string
  loanType: 'first_home' | 'second_home' | 'remodeling'
  loanAmount: number
  loanTerm: number
  interestRate: number
  monthlyPayment: number
  remainingPrincipal: number
  paidMonths: number
  overdueAmount: number
  status: 'normal' | 'overdue' | 'settled'
  startDate: string
  endDate: string
}

export interface HousingFundInfo {
  accountNo: string
  status: 'normal' | 'sealed' | 'transferred' | 'terminated'
  unitName: string
  participateDate: string
  cumulativeMonths: number
  monthlyDeposit: number
  personalDepositRatio: number
  companyDepositRatio: number
  balance: number
  lastDepositDate: string
  loan?: HousingFundLoanInfo
  records: HousingFundRecord[]
}

export interface UserProfile {
  userId: string
  userName: string
  idCard: string
  phone: string
  updateTime: string
  socialSecurity: SocialSecurityInfo
  medicalInsurance: MedicalInsuranceInfo
  education: EducationInfo
  housingFund: HousingFundInfo
}

export interface Policy {
  id: string
  title: string
  category: string
  departmentId: string
  departmentName: string
  issueDate: string
  effectiveDate: string
  expiryDate?: string
  status: 'effective' | 'expired' | 'draft'
  summary: string
  content: string
  attachments: string[]
  viewCount: number
  downloadCount: number
  tags: string[]
  relatedServices: string[]
}

export type VenueType =
  | 'library'
  | 'museum'
  | 'gymnasium'
  | 'park'
  | 'community_center'
  | 'cultural_center'
  | 'government_hall'

export interface VenueResource {
  id: string
  name: string
  type: string
  capacity: number
  availableCount: number
  price: number
  unit: string
  openSlots: string[]
}

export interface Venue {
  id: string
  name: string
  type: VenueType
  address: string
  district: string
  phone: string
  workHours: string
  description: string
  images: string[]
  facilities: string[]
  latitude: number
  longitude: number
  rating: number
  reviewCount: number
  capacity: number
  currentOccupancy: number
  isOpen: boolean
  resources: VenueResource[]
  createTime: string
  updateTime: string
}

export interface PageParams {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
  traceId: string
}

export interface Pagination {
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
}

export type SortOrder = 'asc' | 'desc'

export interface SortParams {
  field: string
  order: SortOrder
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface OptionItem {
  label: string
  value: string | number
  disabled?: boolean
  children?: OptionItem[]
}

export interface TreeItem<T = unknown> {
  id: string
  label: string
  parentId?: string
  children?: TreeItem<T>[]
  data?: T
}

export interface DictItem {
  code: string
  name: string
  value: string | number
  sort: number
  enabled: boolean
}

export type DictType =
  | 'service_category'
  | 'application_status'
  | 'ticket_type'
  | 'ticket_status'
  | 'ticket_priority'
  | 'evaluation_tags'
  | 'monitor_status'
  | 'report_type'
  | 'venue_type'
  | 'user_role'
  | 'gender'

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkIn: number
  networkOut: number
}

export interface ApiEndpoint {
  id: string
  name: string
  path: string
  method: string
  callCount: number
  successCount: number
  failCount: number
  successRate: number
  avgResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
}

export interface MonitorDetail extends ServiceMonitor {
  manager: string
  managerPhone: string
  launchTime: string
  serverAddress: string
  metrics: SystemMetrics
  endpoints: ApiEndpoint[]
  responseTrend: { time: string; p50: number; p95: number; p99: number }[]
  errorTrend: { time: string; errorRate: number }[]
  topErrors: { endpoint: string; count: number; rate: number }[]
  alertHistory: MonitorAlert[]
}

export interface AlertRule {
  id: string
  monitorId: string
  monitorName: string
  responseTimeWarning: number
  responseTimeCritical: number
  errorRateWarning: number
  errorRateCritical: number
  availabilityWarning: number
  availabilityCritical: number
  notifySms: boolean
  notifyEmail: boolean
  notifySite: boolean
}

export interface ServiceStepDetail {
  id: string
  step: number
  title: string
  description: string
  role: string
  assignee: string
  expectedDuration: number
  durationUnit: 'minute' | 'hour' | 'day'
  isKeyNode: boolean
  isSkippable: boolean
  preConditions: string
  checkPoints: string[]
  outputs: string[]
  formFields: { key: string; label: string; visible: boolean; editable: boolean }[]
}

export interface ServiceStepStats {
  totalSteps: number
  totalDuration: number
  keyNodeCount: number
  avgStepDuration: number
}

export interface ReportSatisfactionDetail {
  overallRating: number
  speedRating: number
  attitudeRating: number
  qualityRating: number
  convenienceRating: number
  transparencyRating: number
}

export interface BadEvaluationCase {
  id: string
  serviceName: string
  departmentName: string
  reason: string
  content: string
  rectificationMeasures: string
  rectificationStatus: 'pending' | 'processing' | 'completed'
  createTime: string
}

export interface GoodEvaluationCase {
  id: string
  serviceName: string
  departmentName: string
  content: string
  tags: string[]
  createTime: string
}

export interface ReportProblemItem {
  id: string
  title: string
  description: string
  impact: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
}

export interface ReportDetail extends Report {
  satisfactionDetail: ReportSatisfactionDetail
  badEvaluationCases: BadEvaluationCase[]
  goodEvaluationCases: GoodEvaluationCase[]
  problems: ReportProblemItem[]
  nextMonthFocus: string[]
  crossDepartmentItems: string[]
  dataSources: string[]
  annotations: { id: string; content: string; creator: string; createTime: string }[]
}

export interface ComplaintKeyword {
  word: string
  count: number
}

export interface SlaStat {
  total: number
  onTime: number
  overdue: number
  slaRate: number
  avgResponseHours: number
  avgResolutionHours: number
}
