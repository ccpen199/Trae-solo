export type PropertyServiceType = 'access_control' | 'payment' | 'repair' | 'complaint' | 'notification';

export type RepairStatus = 'submitted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentBillType = 'property_fee' | 'water' | 'electricity' | 'gas' | 'parking' | 'other';

export type BillStatus = 'unpaid' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface PropertyApiConfig {
  id: string;
  tenantId: string;
  serviceType: PropertyServiceType;
  providerName: string;
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiRequestLog {
  id: string;
  tenantId: string;
  serviceType: PropertyServiceType;
  endpoint: string;
  method: string;
  requestBody?: string;
  responseBody?: string;
  statusCode: number;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export interface AccessControlDevice {
  id: string;
  tenantId: string;
  deviceCode: string;
  deviceName: string;
  deviceType: 'gate' | 'door' | 'elevator' | 'parking';
  location: string;
  status: 'online' | 'offline' | 'fault';
  lastHeartbeat?: Date;
  vendor?: string;
  vendorDeviceId?: string;
}

export interface PaymentBill {
  id: string;
  billNo: string;
  tenantId: string;
  userId: string;
  householdId: string;
  billType: PaymentBillType;
  title: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: BillStatus;
  billMonth?: string;
  dueDate?: Date;
  paidAt?: Date;
  thirdPartyBillNo?: string;
  detail?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepairRequest {
  id: string;
  orderNo: string;
  tenantId: string;
  userId: string;
  householdId: string;
  title: string;
  description: string;
  images?: string[];
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: RepairStatus;
  assigneeId?: string;
  assigneeName?: string;
  appointmentTime?: Date;
  completedAt?: Date;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Complaint {
  id: string;
  orderNo: string;
  tenantId: string;
  userId: string;
  category: string;
  title: string;
  description: string;
  images?: string[];
  status: 'submitted' | 'processing' | 'resolved' | 'closed';
  handlerId?: string;
  handlerName?: string;
  firstResponseAt?: Date;
  firstResponseDurationMin?: number;
  resolvedAt?: Date;
  resolutionDurationMin?: number;
  resolution?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyNotification {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  type: 'notice' | 'warning' | 'emergency' | 'activity';
  targetAudience: 'all' | 'building' | 'household';
  targetIds?: string[];
  isTop: boolean;
  publishedAt?: Date;
  publisherId?: string;
  createdAt: Date;
}
