export type UserRole = 'shipper' | 'carrier' | 'operator'

export interface User {
  id: string
  name: string
  company: string
  role: UserRole
  avatar?: string
}

export type OrderStatus =
  | 'pending'
  | 'published'
  | 'matched'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'exception'

export type CargoType = 'general' | 'refrigerated' | 'hazardous' | 'bulk' | 'container'

export interface CargoAttribute {
  name: string
  weight: number
  volume: number
  quantity: number
  unit: string
  packaging: string
}

export interface TimeRequirement {
  pickupStart: string
  pickupEnd: string
  deliveryDeadline: string
}

export interface TransportOrder {
  id: string
  orderNo: string
  shipperId: string
  shipperName: string
  originCity: string
  originAddress: string
  originLat: number
  originLng: number
  destCity: string
  destAddress: string
  destLat: number
  destLng: number
  distanceKm: number
  cargo: CargoAttribute
  cargoType: CargoType
  cargoTypeLabel: string
  timeRequirement: TimeRequirement
  budget: number
  status: OrderStatus
  statusLabel: string
  carrierId?: string
  carrierName?: string
  vehicleId?: string
  vehiclePlate?: string
  matchedAt?: string
  loadedAt?: string
  arrivedAt?: string
  completedAt?: string
  createdAt: string
  remark?: string
  isUrgent?: boolean
}

export type VehicleType = 'truck' | 'ship'
export type GpsStatus = 'online' | 'offline' | 'abnormal'
export type VehicleStatus = 'idle' | 'loading' | 'in_transit' | 'unloading' | 'maintenance'

export interface VehicleDocument {
  type: string
  typeLabel: string
  number: string
  issueDate: string
  expireDate: string
  verified: boolean
  ocrAccuracy?: number
  imageUrl?: string
}

export interface CapacityResource {
  id: string
  carrierId: string
  carrierName: string
  type: VehicleType
  typeLabel: string
  plateNo: string
  shipName?: string
  loadCapacity: number
  loadUnit: string
  volumeCapacity: number
  driverName: string
  driverPhone: string
  gpsStatus: GpsStatus
  gpsStatusLabel: string
  vehicleStatus: VehicleStatus
  vehicleStatusLabel: string
  currentCity: string
  currentLat: number
  currentLng: number
  lastGpsUpdate: string
  documents: VehicleDocument[]
  documentsValid: boolean
  performanceScore: number
  totalOrders: number
  onTimeRate: number
  createdAt: string
}

export type AuditStatus = 'pending' | 'ocr_verifying' | 'approved' | 'rejected' | 'manual_review'

export interface QualificationAudit {
  id: string
  applicantId: string
  applicantName: string
  applicantType: 'carrier' | 'shipper'
  documentType: string
  documentTypeLabel: string
  documentNumber: string
  uploadedAt: string
  ocrResult?: {
    recognized: boolean
    confidence: number
    extractedFields: Record<string, string>
    warnings: string[]
  }
  auditStatus: AuditStatus
  auditStatusLabel: string
  auditorId?: string
  auditorName?: string
  auditComment?: string
  auditedAt?: string
  isWhitelisted: boolean
}

export type MatchReason = 'route_overlap' | 'historical_performance' | 'load_optimization' | 'cost_effective'

export interface MatchResult {
  orderId: string
  orderNo: string
  resourceId: string
  plateNo: string
  carrierName: string
  matchScore: number
  routeOverlap: number
  performanceScore: number
  loadPrediction: number
  estimatedCost: number
  reasons: MatchReason[]
  reasonLabels: string[]
  isRecommended: boolean
}

export type TrackingEventType =
  | 'order_created'
  | 'order_published'
  | 'order_matched'
  | 'vehicle_arrived_pickup'
  | 'cargo_loaded'
  | 'departed_origin'
  | 'waypoint_passed'
  | 'abnormal_detected'
  | 'arrived_destination'
  | 'cargo_unloaded'
  | 'order_completed'

export interface TrackingEvent {
  id: string
  orderId: string
  eventType: TrackingEventType
  eventLabel: string
  location: string
  lat: number
  lng: number
  timestamp: string
  remark?: string
  operator?: string
}

export interface AbnormalAlert {
  id: string
  orderId: string
  orderNo: string
  type: 'stop_abnormal' | 'route_deviation' | 'speed_abnormal' | 'temperature_abnormal' | 'delay'
  typeLabel: string
  severity: 'low' | 'medium' | 'high'
  severityLabel: string
  location: string
  lat: number
  lng: number
  detectedAt: string
  resolved: boolean
  resolvedAt?: string
  resolver?: string
  remark?: string
}

export type ContractStatus = 'draft' | 'pending_sign' | 'signed' | 'expired' | 'terminated'
export type WaybillStatus = 'created' | 'signed' | 'completed'

export interface ContractTemplate {
  id: string
  templateName: string
  templateCode: string
  version: string
  applicableScenario: string
  content: string
  clauses: ContractClause[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ContractClause {
  id: string
  clauseNo: string
  title: string
  content: string
  required: boolean
}

export interface ElectronicContract {
  id: string
  contractNo: string
  templateId: string
  templateName: string
  orderId?: string
  shipperId: string
  shipperName: string
  carrierId: string
  carrierName: string
  totalAmount: number
  status: ContractStatus
  statusLabel: string
  shipperSignedAt?: string
  shipperSignature?: string
  carrierSignedAt?: string
  carrierSignature?: string
  platformSignedAt?: string
  platformSignature?: string
  sealHash: string
  createdAt: string
  effectiveAt?: string
  expireAt?: string
}

export interface PaperlessWaybill {
  id: string
  waybillNo: string
  orderId: string
  orderNo: string
  standard: string
  origin: string
  destination: string
  cargoInfo: string
  weight: number
  volume: number
  carrierName: string
  vehiclePlate: string
  driverName: string
  status: WaybillStatus
  statusLabel: string
  shipperSignature?: string
  driverSignature?: string
  receiverSignature?: string
  signedAt?: string
  createdAt: string
  qrCodeUrl: string
}

export type SettlementItemType = 'freight' | 'insurance' | 'toll' | 'fuel' | 'loading' | 'other'

export interface SettlementItem {
  id: string
  type: SettlementItemType
  typeLabel: string
  description: string
  amount: number
  taxRate?: number
  taxAmount?: number
}

export type SettlementStatus = 'pending' | 'confirmed' | 'invoiced' | 'paid' | 'disputed'

export interface SettlementFlow {
  id: string
  flowNo: string
  orderId?: string
  orderNo?: string
  contractId?: string
  payerId: string
  payerName: string
  payeeId: string
  payeeName: string
  items: SettlementItem[]
  totalAmount: number
  totalTax?: number
  netAmount: number
  status: SettlementStatus
  statusLabel: string
  currency: string
  paymentMethod?: string
  paidAt?: string
  transactionId?: string
  invoiceNo?: string
  createdAt: string
  confirmedAt?: string
  auditorId?: string
  fundIsolated: boolean
  auditTrail: AuditRecord[]
}

export interface MonthlyReconciliation {
  id: string
  period: string
  partyId: string
  partyName: string
  partyRole: 'shipper' | 'carrier'
  totalOrders: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  status: 'draft' | 'pending_confirmation' | 'confirmed' | 'reconciled' | 'disputed'
  statusLabel: string
  items: SettlementFlow[]
  generatedAt: string
  confirmedAt?: string
  remark?: string
}

export type DisputeStatus = 'submitted' | 'under_review' | 'evidence_required' | 'arbitrated' | 'closed'
export type CreditRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D'

export interface DisputeCase {
  id: string
  caseNo: string
  orderId?: string
  orderNo?: string
  applicantId: string
  applicantName: string
  respondentId: string
  respondentName: string
  type: string
  typeLabel: string
  description: string
  amountInvolved: number
  status: DisputeStatus
  statusLabel: string
  evidence: DisputeEvidence[]
  arbitratorId?: string
  arbitratorName?: string
  arbitrationResult?: string
  createdAt: string
  closedAt?: string
}

export interface DisputeEvidence {
  id: string
  uploadedBy: string
  uploadedByName: string
  fileName: string
  fileUrl: string
  uploadedAt: string
  description?: string
}

export interface CreditRecord {
  id: string
  partyId: string
  partyName: string
  partyRole: 'shipper' | 'carrier'
  rating: CreditRating
  score: number
  onTimeDeliveryRate: number
  disputeCount: number
  complaintCount: number
  totalOrders: number
  lastEvaluatedAt: string
  isBlacklisted: boolean
  blacklistReason?: string
  blacklistedAt?: string
}

export interface AuditRecord {
  id: string
  action: string
  actionLabel: string
  operatorId: string
  operatorName: string
  operatorRole: string
  targetType: string
  targetId: string
  ipAddress: string
  timestamp: string
  detail: string
}
