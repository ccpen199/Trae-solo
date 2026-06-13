export type UserRole = "courier" | "branch_admin" | "regional_supervisor";

export interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  role: UserRole;
  branchId: string;
  branchName: string;
  permissions: string[];
  avatar?: string;
}

export type OrderStatus =
  | "pending_pickup"
  | "picked"
  | "in_transit"
  | "delivered"
  | "exception";

export interface Address {
  name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
}

export interface ExpressOrder {
  id: string;
  orderNo: string;
  trackingNo: string;
  expressCompany: string;
  expressCompanyCode: string;
  branchId: string;
  courierId: string;
  courierName?: string;
  customerId?: string;
  sender: Address;
  receiver: Address;
  weight: number;
  items: string;
  price: number;
  status: OrderStatus;
  createdAt: string;
  pickedAt?: string;
  deliveredAt?: string;
}

export type BindType = "phone" | "qr_code";

export interface ProtocolInfo {
  contractNo: string;
  priceAgreement: Record<string, number>;
  settlementCycle: "daily" | "weekly" | "monthly";
  serviceScope: string[];
  expireDate: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  branchId: string;
  bindType: BindType;
  bindQrCode: string;
  isProtocol: boolean;
  protocolInfo?: ProtocolInfo;
  tags: string[];
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: string;
  repurchaseRate: number;
  createdAt: string;
}

export interface TrackingEvent {
  id: string;
  trackingNo: string;
  status: string;
  statusCode: string;
  location: string;
  description: string;
  operator: string;
  timestamp: string;
  isException: boolean;
}

export type TemplateType = "standard" | "custom";
export type PaperSize = "100x180" | "76x130" | "custom";

export interface LayoutField {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface WaybillTemplate {
  id: string;
  name: string;
  expressCompany: string;
  expressCompanyCode: string;
  templateType: TemplateType;
  paperSize: PaperSize;
  layout: Record<string, LayoutField>;
  isDefault: boolean;
  createdAt: string;
}

export type PrinterType = "pc_browser" | "mobile_bluetooth" | "mobile_wifi";
export type PrintStatus = "queued" | "printing" | "success" | "failed";

export interface PrintJob {
  id: string;
  orderIds: string[];
  templateId: string;
  templateName: string;
  printerId: string;
  printerType: PrinterType;
  status: PrintStatus;
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  createdBy: string;
}

export interface BusinessMetrics {
  date: string;
  pickupCount: number;
  revenue: number;
  newCustomers: number;
  activeCustomers: number;
  retentionRate: number;
  suppliesUsage: Record<string, number>;
}

export type SplitRuleType = "fixed" | "percentage" | "tiered";
export interface TierConfig {
  min: number;
  max: number;
  rate: number;
}

export interface SplitRule {
  id: string;
  courierId: string;
  courierName: string;
  ruleName: string;
  type: SplitRuleType;
  value: number;
  tierConfig?: TierConfig[];
  effectiveDate: string;
  expireDate?: string;
}

export type SettlementStatus = "pending" | "confirmed" | "paid";

export interface SettlementDetail {
  id: string;
  period: string;
  courierId: string;
  courierName: string;
  orderCount: number;
  baseAmount: number;
  splitAmount: number;
  deduction: number;
  netAmount: number;
  status: SettlementStatus;
  paidAt?: string;
  createdAt: string;
}

export interface DashboardSummary {
  todayPickup: number;
  todayPickupDelta: number;
  pendingTasks: number;
  exceptions: number;
  todayRevenue: number;
  todayRevenueDelta: number;
  activeCouriers: number;
  suppliesWarning: number;
}

export type TaskPriority = "high" | "normal" | "low";
export type TaskType = "pickup" | "print" | "entry" | "delivery";

export interface TaskItem {
  id: string;
  type: TaskType;
  title: string;
  desc: string;
  priority: TaskPriority;
  orderId?: string;
  dueAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  realName: string;
  role: UserRole;
  operation: string;
  module: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface PermissionConfig {
  role: UserRole;
  roleName: string;
  description: string;
  permissions: Record<string, boolean>;
}

export interface ComplianceConfig {
  dataRetentionMonths: number;
  enablePiiMasking: boolean;
  maskingFields: { phone: boolean; address: boolean; name: boolean };
  enableAuditTrail: boolean;
}

export interface HeatmapPoint {
  name: string;
  lng: number;
  lat: number;
  value: number;
}

export interface Announcement {
  id: string;
  title: string;
  type: "info" | "warning" | "success";
  content: string;
  date: string;
}
