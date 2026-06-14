export interface Trade {
  id: number
  name: string
  category: string
  description: string
  skill_level: number
  created_at: string
  updated_at: string
}

export interface TradeStat extends Trade {
  worker_count: number
  job_count: number
  avg_wage: number
}

export interface TradeDetail extends Trade {
  worker_count: number
  job_count: number
  workers: WorkerListItem[]
  job_requirements: JobRequirementListItem[]
  wage_trend: WageTrendItem[]
}

export interface WorkerListItem {
  id: number
  name: string
  phone: string
  certificate_count: number
  performance_score: number
  health_status: string
}

export interface JobRequirementListItem {
  id: number
  project_name: string
  quantity: number
  daily_wage: number
  status: string
  start_date: string
  end_date: string
}

export interface WageTrendItem {
  month: string
  avg_wage: number
}

export interface Worker {
  id: number
  idCard: string
  name: string
  gender: '男' | '女'
  age: number
  phone: string
  address: string
  latitude: number
  longitude: number
  tradeIds: number[]
  performanceScore: number
  healthStatus: 'green' | 'yellow' | 'red'
  healthCodeSource?: string
  healthCodeUpdatedAt?: string
  nucleicAcidStatus?: '阴性' | '阳性' | '未检测'
  vaccinationStatus?: '未接种' | '一针' | '二针' | '三针'
  createdAt: string
  updatedAt: string
}

export interface WorkerCreateRequest extends Omit<Worker, 'id' | 'performanceScore' | 'createdAt' | 'updatedAt'> {
  skillCertificates?: SkillCertificateCreateRequest[]
  safetyTrainings?: SafetyTrainingCreateRequest[]
}

export interface SkillCertificateCreateRequest {
  certificateType: string
  certificateNumber: string
  issuingAuthority: string
  issueDate: string
  expiryDate: string
  ocrResult?: string
  verified?: boolean
}

export interface SafetyTrainingCreateRequest {
  trainingName: string
  trainingDate: string
  trainingHours: number
  examScore: number
  passed: boolean
}

export interface SkillCertificate {
  id: number
  workerId: number
  certificateType: string
  certificateNumber: string
  issuingAuthority: string
  issueDate: string
  expiryDate: string
  ocrResult: string
  verified: boolean
  imageUrl?: string
}

export interface PerformanceReview {
  id: number
  workerId: number
  projectId: number
  projectName: string
  rating: number
  comment: string
  reviewer: string
  reviewDate: string
  workQuality: number
  attendance: number
  discipline: number
  safety: number
  teamwork: number
}

export interface SafetyTraining {
  id: number
  workerId: number
  trainingName: string
  trainingDate: string
  trainingHours: number
  examScore: number
  passed: boolean
  certificateNumber?: string
}

export interface Employer {
  id: number
  companyName: string
  legalPerson: string
  businessLicense: string
  qualificationLevel: string
  contactName: string
  contactPhone: string
  address: string
  creditRating: number
  verified: boolean
  createdAt: string
}

export interface JobRequirement {
  id: number
  employerId: number
  projectName: string
  projectAddress: string
  detailedAddress?: string
  latitude: number
  longitude: number
  tradeId: number
  tradeName: string
  quantity: number
  skillLevelRequired?: string
  startDate: string
  endDate: string
  workDuration?: string
  dailyWageMin?: number
  dailyWageMax?: number
  paymentMethod?: string
  providesFood?: boolean
  providesLodging?: boolean
  certificateRequired?: boolean
  certificateTypes?: string[] | string
  safetyTraining?: string
  otherQualifications?: string
  projectIntro?: string
  constructionEnvironment?: string
  notes?: string
  dailyWage: number
  workHours: string
  qualificationRequired: string
  description: string
  status: 'draft' | 'pending_review' | 'ai_reviewed' | 'manual_reviewed' | 'verified' | 'published' | 'filled' | 'closed'
  aiReviewResult?: string
  aiReviewScore?: number
  manualReviewComment?: string
  manualReviewer?: string
  verifiedBy?: string
  verifiedAt?: string
  createdAt: string
  updatedAt: string
}

export interface JobMatch {
  id: number
  jobId: number
  workerId: number
  matchScore: number
  skillMatchScore: number
  locationMatchScore: number
  performanceMatchScore: number
  status: 'pending' | 'accepted' | 'rejected' | 'hired'
  workerNotified: boolean
  employerNotified: boolean
  createdAt: string
}

export interface Contract {
  id: number
  jobId: number
  workerId: number
  employerId: number
  contractNumber: string
  startDate: string
  endDate: string
  dailyWage: number
  totalAmount: number
  status: 'draft' | 'signed_by_worker' | 'signed_by_employer' | 'fully_signed' | 'completed' | 'terminated'
  workerSignedAt?: string
  employerSignedAt?: string
  templateId: number
  content: string
  createdAt: string
}

export interface ContractTemplate {
  id: number
  name: string
  templateType?: string
  content: string
  version?: string
  isActive: boolean
  createdAt: string
}

export interface WagePayment {
  id: number
  contractId: number
  workerId: number
  employerId: number
  amount: number
  paymentDate: string
  paymentMethod: string
  workDays: number
  status: 'pending' | 'paid' | 'overdue' | 'disputed'
  supervisoryRecorded: number
  remark?: string
  createdAt: string
}

export interface ReviewRecord {
  id: number
  jobId: number
  reviewLevel: 'ai' | 'manual' | 'site'
  reviewer: string
  result: 'pass' | 'fail' | 'pending'
  comment: string
  reviewDate: string
  details?: string
}

export interface RegionHeatmap {
  region: string
  workerCount: number
  jobCount: number
  demandRatio: number
  avgWage: number
}

export interface TradeShortage {
  tradeId: number
  tradeName: string
  shortageIndex: number
  demandCount: number
  supplyCount: number
  trend: 'up' | 'down' | 'stable'
}

export interface TeamCredit {
  teamId: number
  teamName: string
  creditScore: number
  rating: 'A' | 'B' | 'C' | 'D'
  totalProjects: number
  onTimeRate: number
  complaintCount: number
}

export interface WageArrearsRisk {
  id: number
  employerId: number
  companyName: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  overdueCount: number
  totalOverdueAmount: number
  warningDate: string
  measures?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
