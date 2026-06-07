export type UserRole = 'user' | 'auditor' | 'admin'

export interface User {
  id: number
  idCardNo: string
  realName: string
  phone: string
  passwordHash: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type PermitStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export interface PermitApplication {
  id: number
  userId: number
  plateNumber: string
  vehicleType: string
  startDate: string
  endDate: string
  route: string
  status: PermitStatus
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export type ViolationStatus = 'pending' | 'valid' | 'invalid'

export interface ViolationReport {
  id: number
  userId: number
  violationType: string
  latitude?: number
  longitude?: number
  location?: string
  violationTime: string
  description?: string
  evidenceHash?: string
  status: ViolationStatus
  createdAt: string
}

export type AccidentStatus = 'negotiating' | 'determined' | 'completed'

export interface AccidentRecord {
  id: number
  caseNo: string
  accidentTime: string
  location: string
  partyAId?: number
  partyBId?: number
  officerId?: number
  liability?: string
  status: AccidentStatus
  createdAt: string
}

export type EbikeStatus = 'pending' | 'approved' | 'rejected'

export interface EbikeRegistration {
  id: number
  userId: number
  frameNumber: string
  motorNumber: string
  brand: string
  model: string
  color: string
  purchaseDate: string
  status: EbikeStatus
  createdAt: string
}

export type AppointmentStatus = 'booked' | 'cancelled' | 'completed'

export interface Appointment {
  id: number
  userId: number
  windowId: number
  appointmentDate: string
  timeSlot: string
  businessType: string
  queueNumber?: string
  status: AppointmentStatus
  rating?: number
  comment?: string
  createdAt: string
}

export interface ServiceWindow {
  id: number
  name: string
  address: string
  district: string
  businessTypes: string
}

export interface Schedule {
  id: number
  windowId: number
  date: string
  timeSlots: string
  capacity: number
}

export type WorkflowStatus = 'pending' | 'processing' | 'completed' | 'rejected'

export interface WorkflowTask {
  id: number
  businessType: string
  businessId: number
  currentStage: string
  status: WorkflowStatus
  currentAuditorId?: number
  createdAt: string
  updatedAt: string
}

export type AuditAction = 'submit' | 'approve' | 'reject'

export interface AuditRecord {
  id: number
  taskId: number
  auditorId: number
  action: AuditAction
  opinion?: string
  signature?: string
  createdAt: string
}

export type CertificateStatus = 'active' | 'expired' | 'cancelled'

export interface Certificate {
  id: number
  userId: number
  certType: string
  certNumber: string
  content: string
  signature?: string
  validFrom: string
  validTo: string
  status: CertificateStatus
  issuedAt: string
}

export type AlertLevel = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'pending' | 'processing' | 'ignored'

export interface AbnormalAlert {
  id: number
  taskId?: number
  alertType: string
  level: AlertLevel
  description: string
  status: AlertStatus
  createdAt: string
}

export interface ChatbotSession {
  id: number
  userId: number
  sessionId: string
  history?: string
  createdAt: string
  updatedAt: string
}

export interface DriverArchive {
  id: number
  idCardNo: string
  licenseNumber: string
  licenseType: string
  issueDate: string
  score: number
  status: string
}

export interface VehicleArchive {
  id: number
  plateNumber: string
  idCardNo: string
  vehicleType: string
  frameNumber: string
  registerDate: string
  inspectionStatus: string
}

export interface EbikeArchive {
  id: number
  plateNumber: string
  idCardNo: string
  frameNumber: string
  registerDate: string
  status: string
}

export interface MonthlyStats {
  id: number
  month: string
  permitCount: number
  violationCount: number
  accidentCount: number
  ebikeCount: number
  appointmentCount: number
  avgProcessTime: number
  satisfactionRate: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PagedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface JwtPayload {
  userId: number
  idCardNo: string
  realName: string
  role: UserRole
  iat?: number
  exp?: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
