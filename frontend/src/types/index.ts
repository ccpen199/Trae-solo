export enum Role {
  BUYER = 'BUYER',
  FARMER = 'FARMER',
  OPERATOR = 'OPERATOR',
  FINANCE = 'FINANCE',
  STORAGE = 'STORAGE',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PREPAYMENT = 'PENDING_PREPAYMENT',
  PREPAYMENT_PAID = 'PREPAYMENT_PAID',
  IN_COLLECTION = 'IN_COLLECTION',
  QUALITY_CHECKED = 'QUALITY_CHECKED',
  IN_TRANSPORT = 'IN_TRANSPORT',
  DELIVERED = 'DELIVERED',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  EXCEPTION_HANDLING = 'EXCEPTION_HANDLING',
  STORAGE_TRANSFERRED = 'STORAGE_TRANSFERRED',
}

export enum QualityLevel {
  PREMIUM = 'PREMIUM',
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  GRADE_C = 'GRADE_C',
  REJECTED = 'REJECTED',
}

export enum ColdChainStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  EXCEPTION = 'EXCEPTION',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum LogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CANCEL = 'CANCEL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  NOTIFY = 'NOTIFY',
  EXCEPTION = 'EXCEPTION',
}

export interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email?: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  virtualAccount?: VirtualAccount;
}

export interface VirtualAccount {
  id: string;
  userId: string;
  balance: number;
  frozenAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  buyerId: string;
  status: OrderStatus;
  productName: string;
  productCategory: string;
  expectedWeight: number;
  expectedPrice: number;
  expectedAmount: number;
  actualWeight?: number;
  actualPrice?: number;
  actualAmount?: number;
  prepaidAmount: number;
  settlementAmount?: number;
  contractNo?: string;
  originProvince: string;
  originCity: string;
  originDistrict: string;
  originDetail?: string;
  destinationProvince: string;
  destinationCity: string;
  destinationDistrict: string;
  destinationDetail?: string;
  expectedPickupDate?: string;
  actualPickupDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  toleranceRate: number;
  hasColdChain: boolean;
  qualityStandard?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: User;
  subOrders?: SubOrder[];
  qualityChecks?: QualityCheck[];
  settlements?: Settlement[];
  coldChainRecords?: ColdChainRecord[];
}

export interface SubOrder {
  id: string;
  subOrderNo: string;
  mainOrderId: string;
  farmerId: string;
  status: OrderStatus;
  productName: string;
  expectedWeight: number;
  expectedPrice: number;
  expectedAmount: number;
  actualWeight?: number;
  actualPrice?: number;
  actualAmount?: number;
  prepaidAmount: number;
  farmProvince: string;
  farmCity: string;
  farmDistrict: string;
  farmDetail?: string;
  qualityGrade?: QualityLevel;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  mainOrder?: Order;
  farmer?: User;
  qualityChecks?: QualityCheck[];
  settlements?: Settlement[];
}

export interface QualityCheck {
  id: string;
  orderId?: string;
  subOrderId?: string;
  inspectorId: string;
  checkTime: string;
  totalWeight: number;
  premiumWeight: number;
  gradeAWeight: number;
  gradeBWeight: number;
  gradeCWeight: number;
  rejectedWeight: number;
  premiumPrice?: number;
  gradeAPrice?: number;
  gradeBPrice?: number;
  gradeCPrice?: number;
  rejectedPrice?: number;
  qualityReport?: string;
  images: string[];
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColdChainRecord {
  id: string;
  orderId: string;
  deviceId: string;
  temperature: number;
  humidity?: number;
  status: ColdChainStatus;
  locationLat?: number;
  locationLng?: number;
  locationName?: string;
  recordTime: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  settlementNo: string;
  orderId?: string;
  subOrderId?: string;
  type: string;
  status: SettlementStatus;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  taxRate: number;
  paymentMethod?: string;
  payerId?: string;
  payeeId?: string;
  referenceNo?: string;
  remark?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: LogAction;
  operatorId: string;
  operatorName: string;
  operatorRole: Role;
  oldValue?: any;
  newValue?: any;
  changeSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  remark?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface LoginResult {
  access_token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  code?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
