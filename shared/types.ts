export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'individual' | 'merchant' | 'admin';
  createdAt: string;
}

export interface PickupAppointment {
  id: string;
  userId: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  pickupDate: string;
  pickupTimeSlot: 'morning' | 'afternoon' | 'evening';
  itemType: string;
  weight: number;
  estimatedFee: number;
  status: 'pending' | 'confirmed' | 'picked_up' | 'cancelled';
  createdAt: string;
}

export interface Waybill {
  id: string;
  userId: string;
  waybillNo: string;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  status: 'created' | 'picked_up' | 'in_transit' | 'delivered' | 'returned';
  serviceLevel: 'standard' | 'express' | 'same_day';
  weight: number;
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingNode {
  id: string;
  waybillId: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

export interface FailedImportRecord {
  row: number;
  waybillNo?: string;
  reason: string;
}

export interface ImportBatch {
  id: string;
  userId: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: 'processing' | 'completed' | 'failed';
  fileName?: string;
  template?: string;
  failedReasons: FailedImportRecord[];
  createdAt: string;
  completedAt?: string;
}

export interface PrintBatch {
  id: string;
  userId: string;
  waybillIds: string[];
  template: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  totalCount: number;
  printedCount: number;
  createdAt: string;
  completedAt?: string;
  waybills?: Waybill[];
}

export interface TrackingResult {
  waybillNo: string;
  currentStatus: string;
  platform?: string;
  nodes: TrackingNode[];
}

export interface WaybillScanResult {
  id: string;
  waybillNo: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  scanType: 'barcode' | 'ocr';
  confidence: number;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  reviewStatus?: 'auto_pass' | 'manual_edited' | 'pending_review' | 'review_passed';
  reviewConclusion?: string;
  reviewer?: string;
  reviewedAt?: string;
  syncedWaybillId?: string;
  syncedTracking?: boolean;
  syncedFee?: number;
}

export interface ComplaintTicket {
  id: string;
  waybillId: string;
  waybillNo: string;
  type: 'damage' | 'lost' | 'delay' | 'service' | 'other';
  description: string;
  evidence: string[];
  status: 'pending' | 'assigned' | 'processing' | 'resolved' | 'closed';
  assignedBranch: string;
  slaDeadline: string;
  slaRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  waybillId: string;
  waybillNo: string;
  invoiceNo: string;
  amount: number;
  title: string;
  taxNo: string;
  status: 'pending' | 'issued' | 'failed' | 'reviewing';
  issuedAt?: string;
  downloadUrl?: string;
  createdAt: string;
  failReason?: string;
  ukeyStatus?: 'connected' | 'disconnected' | 'error';
  ukeyMessage?: string;
  reviewLogs?: { time: string; operator: string; action: string; note: string }[];
}

export interface InvoiceReviewLog {
  id: string;
  invoiceId: string;
  operator: string;
  action: 'submit' | 'reject' | 'approve' | 'retry' | 'issue';
  note: string;
  createdAt: string;
}

export interface MembershipInfo {
  id: string;
  userId: string;
  points: number;
  level: 'normal' | 'silver' | 'gold' | 'svip';
  svipLevel?: number;
  svipExpiry?: string;
  totalEarned: number;
  totalUsed: number;
  totalExpired: number;
  svipGrantedAt?: string;
  svipGrantedBy?: string;
  svipSource?: 'purchase' | 'activity' | 'upgrade' | 'gift';
}

export interface PointsRecord {
  id: string;
  userId: string;
  type: 'earn' | 'use' | 'expire';
  amount: number;
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  operator: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
}

export interface ContrabandLibrary {
  id: string;
  name: string;
  category: string;
  keywords: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ContrabandCheck {
  id: string;
  userId: string;
  inputType: 'image' | 'text';
  inputContent: string;
  isContraband: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  matchedItems: string[];
  description: string;
  createdAt: string;
}

export interface FreightCalcRequest {
  senderAddress: string;
  receiverAddress: string;
  weight: number;
  volume?: number;
  serviceLevel: 'standard' | 'express' | 'same_day';
}

export interface FreightCalcResult {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  serviceFee: number;
  discount: number;
  totalFee: number;
  estimatedDays: number;
  distance: number;
}

export interface DashboardStats {
  todayPickups: number;
  inTransitWaybills: number;
  pendingComplaints: number;
  pointsBalance: number;
  todayRevenue: number;
  deliveryRate: number;
  scanTodayCount?: number;
  scanPendingReview?: number;
  importProcessing?: number;
  importTodayFailed?: number;
  printPending?: number;
  printFailed?: number;
  pendingInvoices?: number;
  failedInvoices?: number;
  svipLevel?: number;
}

export interface TodoItem {
  id: string;
  type: 'pickup' | 'complaint' | 'invoice' | 'scan' | 'import' | 'print';
  title: string;
  description: string;
  deadline?: string;
  createdAt: string;
  link?: string;
  meta?: Record<string, any>;
}

export type ServiceLevel = 'standard' | 'express' | 'same_day';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type WaybillStatus = 'created' | 'picked_up' | 'in_transit' | 'delivered' | 'returned';
export type ComplaintType = 'damage' | 'lost' | 'delay' | 'service' | 'other';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high';
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'svip';
