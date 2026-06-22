export type UserRole = 'user' | 'technician'

export interface ServiceCategory {
  id: string
  name: string
  parentId: string | null
  icon?: string
}

export interface SkillTag {
  id: string
  name: string
  categoryId: string
}

export interface Certificate {
  id: string
  name: string
  imageUrl: string
  ocrData?: string
  verified: boolean
  verifiedAt?: string
}

export interface Technician {
  id: string
  name: string
  phone: string
  avatar?: string
  skillTags: string[]
  serviceRadius: number
  rating: number
  reviewCount: number
  certificates: Certificate[]
  location: Coordinates
  frozen: boolean
  frozenReason?: string
  createdAt: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export type TaskStatus = 'pending' | 'broadcasting' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'paid' | 'reviewed' | 'cancelled'

export type ServiceNode = 'door_arrival' | 'start_work' | 'completed'

export interface TaskCheckin {
  node: ServiceNode
  timestamp: string
  location?: Coordinates
  note?: string
}

export interface ServicePart {
  name: string
  quantity: number
  unitPrice: number
}

export interface ServiceReport {
  id: string
  taskId: string
  diagnosis: string
  parts: ServicePart[]
  warrantyMonths: number
  notes?: string
  createdAt: string
}

export interface PaymentProof {
  id: string
  taskId: string
  imageUrl: string
  amount: number
  uploadedAt: string
}

export interface Review {
  id: string
  taskId: string
  fromUserId: string
  toUserId: string
  fromRole: UserRole
  rating: number
  content: string
  createdAt: string
}

export interface RepairTask {
  id: string
  userId: string
  technicianId?: string
  categoryId: string
  title: string
  description: string
  images: string[]
  address: string
  location: Coordinates
  expectedResponseTime: number
  status: TaskStatus
  checkins: TaskCheckin[]
  bids: TaskBid[]
  serviceReportId?: string
  paymentProofId?: string
  userReviewId?: string
  technicianReviewId?: string
  createdAt: string
  acceptedAt?: string
  completedAt?: string
}

export interface TaskBid {
  technicianId: string
  estimatedPrice: number
  estimatedTime: string
  note?: string
  submittedAt: string
}

export interface AppUser {
  id: string
  role: UserRole
  name: string
  phone: string
  avatar?: string
}
