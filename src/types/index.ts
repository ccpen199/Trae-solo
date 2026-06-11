export type CategoryType = 'air_conditioner' | 'water_heater' | 'washing_machine' | 'refrigerator' | 'tv' | 'other'

export interface DiagnosisResult {
  category: CategoryType
  categoryLabel: string
  faultType: string
  confidence: number
  description: string
  recommendedServices: RecommendedService[]
}

export interface RecommendedService {
  id: string
  name: string
  estimatedPrice: { min: number; max: number }
  estimatedDuration: string
  urgency: 'low' | 'medium' | 'high'
}

export interface Engineer {
  id: string
  name: string
  avatar: string
  skills: string[]
  rating: number
  creditLevel: 'S' | 'A' | 'B' | 'C' | 'D'
  completionRate: number
  isOnline: boolean
  distance: number
  totalOrders: number
  matchScore?: number
}

export interface ServiceProvider {
  id: string
  name: string
  avatar: string
  rating: number
  price: number
  laborFee: number
  partsFee: number
  visitFee: number
  estimatedArrival: string
  completionRate: number
  warranty: string
  guarantees: string[]
  totalOrders: number
}

export interface ServiceItem {
  id: string
  name: string
  category: CategoryType
  categoryLabel: string
  laborFee: number
  description: string
  estimatedDuration: string
  warranty: string
  guarantees: string[]
  providers: ServiceProvider[]
}

export interface WorkOrder {
  id: string
  orderId: string
  engineerId: string
  userId: string
  status: 'pending' | 'in_progress' | 'completed' | 'signed'
  category: string
  categoryLabel: string
  faultDescription: string
  beforePhotos: string[]
  afterPhotos: string[]
  steps: WorkOrderStep[]
  signature?: string
  createdAt: string
  completedAt?: string
  signedAt?: string
  customerName: string
  customerAddress: string
  customerPhone: string
}

export interface WorkOrderStep {
  index: number
  title: string
  description: string
  status: 'pending' | 'doing' | 'done'
}

export interface Part {
  id: string
  name: string
  category: string
  supplierId: string
  price: number
  stock: number
  qrCode: string
  verified: boolean
  image: string
}

export interface EngineerCredit {
  engineerId: string
  name: string
  avatar: string
  score: number
  level: 'S' | 'A' | 'B' | 'C' | 'D'
  totalOrders: number
  completionRate: number
  avgRating: number
  aiInspectionPassRate: number
  creditHistory: CreditRecord[]
}

export interface CreditRecord {
  date: string
  event: string
  scoreChange: number
  currentScore: number
}

export interface ContractRecord {
  id: string
  orderId: string
  customerName: string
  engineerName: string
  templateId: string
  status: 'draft' | 'pending_sign' | 'signed' | 'archived'
  signedAt?: string
  archiveHash?: string
  evidenceChain: EvidenceItem[]
}

export interface EvidenceItem {
  type: 'contract' | 'photo_before' | 'photo_after' | 'signature' | 'inspection'
  hash: string
  timestamp: string
  description: string
}

export interface KnowledgeEntry {
  id: string
  title: string
  category: string
  brand: string
  content: string
  lastUpdated: string
}

export interface InspectionRecord {
  id: string
  orderId: string
  engineerName: string
  status: 'pass' | 'fail' | 'pending'
  aiScore: number
  checkDate: string
  issues: string[]
}

export interface InventoryBatch {
  id: string
  partId: string
  partName: string
  batchNo: string
  quantity: number
  supplierName: string
  inboundDate: string
  expireDate: string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
}

export interface StockFlowRecord {
  id: string
  partId: string
  partName: string
  type: 'inbound' | 'outbound' | 'adjust'
  quantity: number
  beforeStock: number
  afterStock: number
  operator: string
  reason: string
  timestamp: string
  orderId?: string
}

export interface DispatchMatchDetail {
  engineerId: string
  engineerName: string
  totalScore: number
  distanceScore: number
  skillScore: number
  performanceScore: number
  creditScore: number
  distanceKm: number
  matchedSkills: string[]
  missingSkills: string[]
  completionRate: number
  avgRating: number
  estimatedArrival: string
}

export type UserRole = 'user' | 'engineer' | 'supplier' | 'admin'
