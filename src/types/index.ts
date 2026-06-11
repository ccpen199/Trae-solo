export type UserRole = 'user' | 'lawyer' | 'admin'

export type LegalCaseType =
  | 'marriage'
  | 'labor'
  | 'debt'
  | 'property'
  | 'contract'
  | 'traffic'
  | 'criminal'
  | 'other'

export type ConsultationStatus =
  | 'pending'
  | 'dispatched'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type LawyerStatus = 'active' | 'inactive' | 'frozen' | 'pending_review'

export type MessageType = 'text' | 'image' | 'file' | 'system'

export type AppealStatus = 'pending' | 'accepted' | 'rejected' | 'resolved'

export interface User {
  id: string
  role: UserRole
  phone: string
  nickname: string
  avatar?: string
  realName?: string
  idCard?: string
  isVerified: boolean
  createdAt: number
  updatedAt: number
}

export interface Lawyer {
  id: string
  role: 'lawyer'
  phone: string
  nickname: string
  avatar?: string
  realName: string
  licenseNumber: string
  licenseVerified: boolean
  lawFirm: string
  practiceYears: number
  expertise: LegalCaseType[]
  regions: string[]
  creditScore: number
  continuingEducationCredits: number
  status: LawyerStatus
  totalCases: number
  completedCases: number
  avgRating: number
  responseRate: number
  avgResponseTime: number
  lastActiveAt: number
  createdAt: number
  updatedAt: number
}

export interface AdminUser {
  id: string
  role: 'admin'
  username: string
  nickname: string
  avatar?: string
  permissions: string[]
  createdAt: number
  updatedAt: number
}

export interface Evidence {
  id: string
  consultationId: string
  uploaderId: string
  fileName: string
  fileType: 'image' | 'pdf' | 'doc' | 'video' | 'audio'
  fileSize: number
  fileUrl: string
  watermarkText?: string
  createdAt: number
}

export interface Consultation {
  id: string
  userId: string
  lawyerId?: string
  caseType: LegalCaseType
  title: string
  description: string
  region: string
  status: ConsultationStatus
  dispatchMode: 'auto' | 'manual' | 'grab'
  evidences: Evidence[]
  createdAt: number
  dispatchedAt?: number
  acceptedAt?: number
  completedAt?: number
  cancelledAt?: number
}

export interface Message {
  id: string
  consultationId: string
  senderId: string
  senderType: 'user' | 'lawyer' | 'system'
  type: MessageType
  messageType: MessageType
  content: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isEncrypted: boolean
  encrypted: boolean
  isSelfDestruct: boolean
  burnAfterRead: boolean
  burnDuration?: number
  selfDestructAfter?: number
  selfDestructedAt?: number
  readAt?: number
  createdAt: number
}

export interface LegalSummary {
  id: string
  consultationId: string
  lawyerId: string
  caseAnalysis: string
  legalBasis: string
  suggestions: string
  riskWarning?: string
  createdAt: number
  confirmedByLawyer: boolean
  confirmedByUser: boolean
}

export interface Evaluation {
  id: string
  consultationId: string
  userId: string
  lawyerId: string
  rating: number
  content?: string
  tags?: string[]
  createdAt: number
}

export interface Appeal {
  id: string
  consultationId: string
  appellantId: string
  respondentId: string
  reason: string
  description: string
  evidences: Evidence[]
  status: AppealStatus
  arbitratorId?: string
  arbitrationResult?: string
  createdAt: number
  acceptedAt?: number
  resolvedAt?: number
}

export interface LawyerDailyStat {
  date: string
  lawyerId: string
  receivedCount: number
  acceptedCount: number
  completedCount: number
  avgResponseTime: number
  messageCount: number
}

export interface MonitoringStats {
  totalConsultations: number
  todayConsultations: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
  activeLawyers: number
  frozenLawyers: number
  avgResponseTime: number
  avgRating: number
  dailyStats: LawyerDailyStat[]
}
