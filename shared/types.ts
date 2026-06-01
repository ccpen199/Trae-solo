export interface Drug {
  id: number
  name: string
  genericName: string
  batchNumber: string
  manufacturer: string
  holder: string
  indications: string
  risks: string
  createdAt: string
  updatedAt: string
}

export type ReportStatus = 'draft' | 'submitted' | 'reviewing' | 'returned' | 'reported' | 'receipt' | 'archived'

export type Severity = 'mild' | 'moderate' | 'severe' | 'life-threatening' | 'fatal'

export interface Report {
  id: number
  reportNo: string
  status: ReportStatus
  patientName: string
  patientGender: 'male' | 'female'
  patientAge: number
  patientId: string
  drugId: number
  drugName: string
  dosage: string
  route: string
  startDate: string
  reaction: string
  reactionStart: string
  severity: Severity
  treatment: string
  outcome: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type FinalLevel = 'definite' | 'probable' | 'possible' | 'unlikely'

export interface Assessment {
  id: number
  reportId: number
  temporalRelation: number
  withdrawalImprovement: number
  rechallengeReaction: number
  concomitantMedication: number
  severityLevel: number
  finalLevel: FinalLevel
  assessedBy: string
  assessedAt: string
  remark: string
}

export interface ProcessLog {
  id: number
  reportId: number
  fromStatus: string
  toStatus: string
  operator: string
  operateAt: string
  remark: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
