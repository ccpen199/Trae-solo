export type ListingType = 'ccb_direct' | 'partner' | 'personal'
export type ListingStatus = 'available' | 'reserved' | 'rented'
export type CommuteMode = 'metro' | 'bus' | 'drive'
export type PaymentMethod = 'ccb_card' | 'unionpay' | 'installment'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ContractStatus = 'draft' | 'signing' | 'signed' | 'filed'
export type FilingStatus = 'pending' | 'filed' | 'rejected'
export type ServiceType = 'plumbing' | 'electrical' | 'appliance' | 'structural' | 'other'
export type ServiceUrgency = 'low' | 'medium' | 'high'
export type ServiceStatus = 'submitted' | 'dispatched' | 'in_progress' | 'completed'

export interface VerificationInfo {
  propertyVerified?: boolean
  propertyCertNo?: string
  faceVerified?: boolean
  faceVerifiedAt?: string
  whitelistQualified?: boolean
  whitelistExpiry?: string
  serviceContractNo?: string
  serviceContractSigned?: boolean
  directManaged?: boolean
  managementStandard?: string
}

export interface AreaBreakdown {
  room: string
  area: number
}

export interface AIAnalysis {
  areaBreakdown: AreaBreakdown[]
  orientation: string
  lightingScore: number
  lightingMap: number[][]
}

export interface CommuteStation {
  station: string
  minutes: number
}

export interface CommuteInfo {
  metro: CommuteStation[]
  bus: CommuteStation[]
  drive: { destination: string; minutes: number }[]
}

export interface Landlord {
  name: string
  type: 'ccb' | 'partner' | 'personal'
  verified: boolean
  rating: number
}

export interface Listing {
  id: string
  title: string
  type: ListingType
  address: string
  district: string
  price: number
  area: number
  rooms: number
  halls: number
  floor: string
  orientation: string
  images: string[]
  floorPlan: string
  aiAnalysis: AIAnalysis
  commuteInfo: CommuteInfo
  landlord: Landlord
  amenities: string[]
  status: ListingStatus
  verification: VerificationInfo
}

export interface SearchParams {
  commuteMode: CommuteMode
  commuteDestination: string
  maxCommuteMinutes: number
  budgetMin: number
  budgetMax: number
  rooms: number[]
  listingType: ListingType[]
  district: string
}

export interface BankCertificate {
  certificateNo: string
  hash: string
  timestamp: string
}

export interface FilingInfo {
  filingNo: string
  status: FilingStatus
  filedAt: string
  reviewComments?: string
}

export interface Contract {
  id: string
  listingId: string
  tenantId: string
  tenantName: string
  landlordId: string
  landlordName: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  status: ContractStatus
  bankCertificate: BankCertificate
  filingInfo: FilingInfo
  signatures: {
    tenant: { signed: boolean; timestamp: string }
    landlord: { signed: boolean; timestamp: string }
  }
}

export interface InstallmentPlan {
  totalMonths: number
  monthlyAmount: number
  interestRate: number
}

export interface AuditTrailEntry {
  from: string
  to: string
  amount: number
  intermediateAccounts: string[]
  timestamp: string
}

export interface Payment {
  id: string
  contractId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  createdAt: string
  installmentPlan?: InstallmentPlan
  auditTrail: AuditTrailEntry[]
}

export interface ServiceProvider {
  id: string
  name: string
  rating: number
  completionRate: number
  avgResponseTime: string
}

export interface ServiceRating {
  score: number
  comment: string
  ratedAt: string
}

export interface ServiceRequest {
  id: string
  contractId: string
  type: ServiceType
  urgency: ServiceUrgency
  description: string
  images: string[]
  status: ServiceStatus
  assignedProvider: ServiceProvider
  rating?: ServiceRating
  dispatchHistory: { status: ServiceStatus; timestamp: string }[]
}

export interface TimeSlot {
  date: string
  time: string
  available: boolean
  lockedBy?: string
}

export interface Appointment {
  id: string
  listingId: string
  tenantId: string
  agentId: string
  agentName: string
  agentAvatar: string
  agentRating: number
  slots: TimeSlot[]
  selectedSlot: TimeSlot | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  confirmHistory: { action: string; timestamp: string; by: string }[]
}

export interface FinancialProduct {
  id: string
  name: string
  type: 'installment' | 'deposit_loan' | 'insurance'
  description: string
  rate: string
  term: string
  icon: string
}

export interface BusinessFlowStep {
  path: string
  label: string
  completed: boolean
  active: boolean
}
