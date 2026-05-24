export type UserRole = 'dealer' | 'buyer' | 'inspector' | 'sales' | 'customer_service' | 'finance' | 'admin';

export type CarStatus = 'draft' | 'pending_inspection' | 'inspecting' | 'inspection_rejected' | 'pending_audit' | 'on_sale' | 'locked' | 'sold' | 'off_shelf' | 'exception';

export type InspectionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type DepositStatus = 'pending' | 'paid' | 'locked' | 'refund_pending' | 'refunded' | 'released_to_seller' | 'deducted';

export type ContractStatus = 'draft' | 'pending_sign' | 'signed' | 'pending_payment' | 'paid' | 'completed' | 'cancelled';

export type TransferStatus = 'pending' | 'submitted' | 'reviewing' | 'approved' | 'completed' | 'rejected';

export type SettlementStatus = 'pending' | 'settled' | 'reconciled' | 'invoiced';

export type ExceptionType = 'fake_car' | 'accident_concealed' | 'deposit_refund' | 'transfer_failed' | 'mileage_dispute' | 'duplicate_sale';

export type ExceptionStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
  permissions: string[];
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  email?: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface CarDocument {
  type: 'registration' | 'insurance' | 'maintenance' | 'other';
  name: string;
  url: string;
}

export interface StatusHistory {
  id: number;
  fromStatus: string;
  toStatus: string;
  operatorId: number;
  operator?: User;
  reason: string;
  createdAt: string;
}

export interface Car {
  id: number;
  vin: string;
  brand: string;
  model: string;
  year: number;
  month: number;
  mileage: number;
  color: string;
  price: number;
  originalPrice?: number;
  configuration: string;
  images: string[];
  documents: CarDocument[];
  dealerId: number;
  dealer?: User;
  status: CarStatus;
  statusHistory: StatusHistory[];
  inspectionId?: number;
  inspection?: Inspection;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionItem {
  result: 'normal' | 'abnormal' | 'suspicious';
  description: string;
  images?: string[];
}

export interface MaintenanceRecord {
  date: string;
  mileage: number;
  item: string;
  cost: number;
  shop: string;
}

export interface PaintworkItem {
  position: string;
  originalPaint: boolean;
  repainted: boolean;
  sheetMetal: boolean;
  description: string;
}

export interface RoadTest {
  engine: string;
  transmission: string;
  brake: string;
  steering: string;
  suspension: string;
  overall: string;
}

export interface Inspection {
  id: number;
  carId: number;
  car?: Car;
  inspectorId: number;
  inspector?: User;
  accident: InspectionItem;
  waterDamage: InspectionItem;
  fireDamage: InspectionItem;
  maintenance: MaintenanceRecord[];
  paintwork: PaintworkItem[];
  roadTest: RoadTest;
  overallScore: number;
  overallComment: string;
  status: InspectionStatus;
  auditorId?: number;
  auditor?: User;
  auditComment?: string;
  auditedAt?: string;
  createdAt: string;
}

export interface FollowUpRecord {
  id: number;
  operatorId: number;
  operator?: User;
  content: string;
  createdAt: string;
}

export interface Appointment {
  id: number;
  carId: number;
  car?: Car;
  buyerId: number;
  buyer?: User;
  salesId?: number;
  sales?: User;
  type: 'view' | 'test_drive';
  appointmentTime: string;
  contactPhone: string;
  intentionLevel: 'high' | 'medium' | 'low';
  notes?: string;
  status: AppointmentStatus;
  followUpRecords: FollowUpRecord[];
  createdAt: string;
}

export interface Deposit {
  id: number;
  carId: number;
  car?: Car;
  buyerId: number;
  buyer?: User;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paidAt?: string;
  status: DepositStatus;
  refundReason?: string;
  refundApprovedBy?: number;
  refundApprovedAt?: string;
  releaseType?: 'to_seller' | 'deducted' | 'refunded';
  settlementId?: number;
  createdAt: string;
}

export interface FinancePlan {
  bank: string;
  downPayment: number;
  loanAmount: number;
  loanTerm: number;
  interestRate: number;
  monthlyPayment: number;
}

export interface Contract {
  id: number;
  carId: number;
  car?: Car;
  buyerId: number;
  buyer?: User;
  dealerId: number;
  dealer?: User;
  depositId?: number;
  deposit?: Deposit;
  totalPrice: number;
  paymentMethod: 'full' | 'installment';
  financePlan?: FinancePlan;
  status: ContractStatus;
  signedByBuyerAt?: string;
  signedByDealerAt?: string;
  createdAt: string;
}

export interface TransferDocument {
  type: 'id_card_buyer' | 'id_card_seller' | 'registration' | 'insurance' | 'other';
  name: string;
  url: string;
}

export interface Transfer {
  id: number;
  contractId: number;
  contract?: Contract;
  carId: number;
  car?: Car;
  documents: TransferDocument[];
  status: TransferStatus;
  reviewerId?: number;
  reviewer?: User;
  reviewComment?: string;
  reviewedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SettlementFee {
  type: 'inspection' | 'transfer' | 'finance' | 'other';
  name: string;
  amount: number;
}

export interface Settlement {
  id: number;
  contractId: number;
  contract?: Contract;
  carId: number;
  car?: Car;
  dealerId: number;
  dealer?: User;
  totalAmount: number;
  platformFee: number;
  feeRate: number;
  otherFees: SettlementFee[];
  amountToDealer: number;
  status: SettlementStatus;
  settledAt?: string;
  reconciledAt?: string;
  invoicedAt?: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface HandlingRecord {
  id: number;
  operatorId: number;
  operator?: User;
  action: string;
  comment: string;
  createdAt: string;
}

export interface Exception {
  id: number;
  type: ExceptionType;
  relatedType: 'car' | 'inspection' | 'appointment' | 'deposit' | 'contract' | 'transfer';
  relatedId: number;
  reporterId: number;
  reporter?: User;
  assigneeId?: number;
  assignee?: User;
  title: string;
  description: string;
  evidence: string[];
  status: ExceptionStatus;
  handlingRecords: HandlingRecord[];
  resolution?: string;
  closedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  role: UserRole;
  action: string;
  resourceType: string;
  resourceId?: number;
  ipAddress: string;
  userAgent: string;
  oldValue?: unknown;
  newValue?: unknown;
  changeSummary?: string;
  createdAt: string;
}

export interface StatisticsSummary {
  totalCars: number;
  carsOnSale: number;
  carsSold: number;
  totalAppointments: number;
  totalDeposits: number;
  totalSettlements: number;
  totalPlatformFee: number;
  conversionRate: number;
}

export interface ConversionFunnelItem {
  stage: string;
  count: number;
  rate: number;
}

export interface Permission {
  id: number;
  role: UserRole;
  resource: string;
  action: string;
  createdAt: string;
}
