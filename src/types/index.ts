export type WorkerLevel = 'L1' | 'L2' | 'L3' | 'L4'

export type IdentityStatus = 'pending' | 'verified' | 'rejected'
export type MedicalStatus = 'none' | 'uploaded' | 'ocr_processed' | 'verified'
export type OrderStatus = 'pending' | 'video_screening' | 'interview_scheduled' | 'contract_signed' | 'insurance_enrolled' | 'in_service' | 'completed' | 'disputed' | 'cancelled'
export type ServiceStatus = 'not_started' | 'in_progress' | 'completed' | 'disputed'
export type DisputeStatus = 'pending' | 'ai_judged' | 'human_review' | 'resolved'
export type CompensationStatus = 'pending' | 'approved' | 'rejected' | 'paid'
export type RecertificationStatus = 'pending' | 'in_progress' | 'passed' | 'failed'

export interface IdentityVerification {
  status: IdentityStatus
  idNumber: string
  realName: string
  verifiedAt?: string
  rejectReason?: string
}

export interface MedicalReport {
  status: MedicalStatus
  uploadDate?: string
  ocrResult?: {
    hospital: string
    examDate: string
    items: { name: string; result: string; normal: boolean }[]
  }
  verifiedAt?: string
}

export interface SkillCertificate {
  id: string
  name: string
  level: string
  issuer: string
  issueDate: string
  expireDate: string
  structuredData: Record<string, string>
}

export interface TrainingRecord {
  id: string
  courseName: string
  completedDate: string
  score: number
  passed: boolean
  certificateId?: string
}

export interface ComplaintTag {
  id: string
  category: string
  label: string
  count: number
  lastOccurred?: string
}

export interface WorkerProfile {
  id: string
  name: string
  phone: string
  avatar?: string
  age: number
  gender: 'male' | 'female'
  level: WorkerLevel
  city: string
  serviceRadius: number
  identity: IdentityVerification
  medical: MedicalReport
  skills: SkillCertificate[]
  training: TrainingRecord[]
  rating: number
  totalOrders: number
  complaintTags: ComplaintTag[]
  serviceCategories: string[]
  status: 'active' | 'suspended' | 'recertifying' | 'inactive'
  joinDate: string
  lastActiveDate: string
}

export interface EmployerProfile {
  id: string
  name: string
  phone: string
  avatar?: string
  creditScore: number
  creditLevel: 'A+' | 'A' | 'B' | 'C' | 'D'
  totalOrders: number
  completedOrders: number
  disputeRate: number
  address: string
  city: string
  joinDate: string
  status: 'active' | 'restricted' | 'blacklisted'
}

export interface InterviewSchedule {
  id: string
  dateTime: string
  duration: number
  type: 'online' | 'offline'
  location?: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

export interface ServiceContract {
  id: string
  signedAt?: string
  startDate: string
  endDate: string
  terms: string
  status: 'unsigned' | 'signed' | 'terminated'
}

export interface InsuranceRecord {
  id: string
  policyNumber: string
  provider: string
  type: string
  premium: number
  startDate: string
  endDate: string
  status: 'active' | 'expired' | 'claimed'
}

export interface ServiceOrder {
  id: string
  employerId: string
  employerName: string
  workerId: string
  workerName: string
  category: string
  description: string
  status: OrderStatus
  createdAt: string
  scheduledDate?: string
  address: string
  city: string
  price: number
  duration: number
  interviewSchedule?: InterviewSchedule
  contract?: ServiceContract
  insurance?: InsuranceRecord
  videoScreening?: {
    url: string
    duration: number
    passed: boolean
    completedAt: string
  }
}

export interface GPSPoint {
  lat: number
  lng: number
  timestamp: string
}

export interface ServiceSession {
  id: string
  orderId: string
  workerId: string
  workerName: string
  employerName: string
  startTime: string
  endTime?: string
  expectedDuration: number
  actualDuration?: number
  gpsTrack: GPSPoint[]
  status: ServiceStatus
  deviationAlert: boolean
  deviationReason?: string
}

export interface ThreePartyEvaluation {
  id: string
  sessionId: string
  orderId: string
  employerRating: number
  employerComment: string
  workerRating: number
  workerComment: string
  platformRating: number
  platformComment: string
  completedAt: string
}

export interface Dispute {
  id: string
  orderId: string
  initiatorType: 'employer' | 'worker'
  initiatorId: string
  initiatorName: string
  reason: string
  description: string
  status: DisputeStatus
  aiJudgment?: {
    suggestedResolution: string
    confidence: number
    analysis: string
    relatedRules: string[]
  }
  createdAt: string
  resolvedAt?: string
  resolution?: string
}

export interface ReplacementRequest {
  id: string
  orderId: string
  employerId: string
  employerName: string
  reason: string
  status: 'pending' | 'auto_dispatched' | 'manual_assigned' | 'completed'
  originalWorkerId: string
  originalWorkerName: string
  newWorkerId?: string
  newWorkerName?: string
  createdAt: string
  dispatchedAt?: string
}

export interface CompensationRule {
  id: string
  name: string
  condition: string
  category: string
  maxAmount: number
  calculationMethod: 'fixed' | 'percentage' | 'tiered'
  isActive: boolean
}

export interface CompensationClaim {
  id: string
  orderId: string
  employerId: string
  employerName: string
  workerId: string
  workerName: string
  reason: string
  amount: number
  approvedAmount?: number
  status: CompensationStatus
  appliedRules: string[]
  createdAt: string
  processedAt?: string
}

export interface ServicePackage {
  id: string
  name: string
  providerId: string
  providerName: string
  city: string
  category: string
  description: string
  price: number
  duration: number
  includes: string[]
  isActive: boolean
  createdAt: string
}

export interface TrainingCourse {
  id: string
  name: string
  providerId: string
  providerName: string
  category: string
  description: string
  duration: number
  maxStudents: number
  enrolledStudents: number
  startDate: string
  endDate: string
  status: 'upcoming' | 'in_progress' | 'completed'
  requiredLevel?: WorkerLevel
  certificationUponCompletion: boolean
}

export interface RecertificationRecord {
  id: string
  workerId: string
  workerName: string
  currentLevel: WorkerLevel
  targetLevel: WorkerLevel
  courseId?: string
  courseName?: string
  status: RecertificationStatus
  appliedAt: string
  scheduledDate?: string
  completedDate?: string
  score?: number
  notes?: string
}

export interface ServiceProviderProfile {
  id: string
  name: string
  city: string
  contactPerson: string
  phone: string
  workerCount: number
  orderCount: number
  rating: number
  status: 'active' | 'suspended'
  joinDate: string
}
