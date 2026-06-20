export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMMUNITY_ADMIN'
  | 'PROPERTY_STAFF'
  | 'FINANCE_STAFF'
  | 'SECURITY_STAFF'
  | 'RESIDENT';

export interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email?: string;
  idCard?: string;
  avatar?: string;
  role: UserRole;
  communityId?: string;
  buildingId?: string;
  unitId?: string;
  roomId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesensitizedUser {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email?: string;
  idCard?: string;
  avatar?: string;
  role: UserRole;
  communityId?: string;
  buildingId?: string;
  unitId?: string;
  roomId?: string;
}

export interface Community {
  id: string;
  name: string;
  address: string;
  totalBuildings: number;
  totalUnits: number;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  id: string;
  communityId: string;
  name: string;
  totalUnits: number;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  buildingId: string;
  name: string;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  unitId: string;
  roomNumber: string;
  area: number;
  ownerId?: string;
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type WorkOrderType = 'REPAIR' | 'COMPLAINT' | 'CONSULT' | 'SUGGESTION' | 'OTHER';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface WorkOrder {
  id: string;
  orderNo: string;
  title: string;
  description: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  submitterId: string;
  submitterName: string;
  assigneeId?: string;
  assigneeName?: string;
  communityId: string;
  buildingId?: string;
  roomId?: string;
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ProgressLog {
  id: string;
  workOrderId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  remark?: string;
  createdAt: string;
}

export interface Satisfaction {
  id: string;
  workOrderId: string;
  residentId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  userName: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'ENDED' | 'CANCELLED';

export type ActivityCategory = 'CULTURE' | 'SPORTS' | 'EDUCATION' | 'CHARITY' | 'OTHER';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  status: ActivityStatus;
  coverImage?: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
  currentParticipants: number;
  communityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  phone: string;
  signedUpAt: string;
  status: 'REGISTERED' | 'CANCELLED' | 'ATTENDED';
}

export type FinanceProductType = 'FUND' | 'INSURANCE' | 'DEPOSIT' | 'LOAN' | 'OTHER';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface FinanceProduct {
  id: string;
  name: string;
  type: FinanceProductType;
  description?: string;
  expectedReturn?: string;
  riskLevel: RiskLevel;
  minAmount: number;
  term?: string;
  imageUrl?: string;
  isRecommended?: boolean;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  userName: string;
  recordDate: string;
  bloodPressure?: string;
  heartRate?: number;
  bloodSugar?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  remark?: string;
  createdAt: string;
}

export interface HealthIndicator {
  userId: string;
  indicatorType: string;
  value: number;
  unit: string;
  normalRange?: string;
  status: 'NORMAL' | 'ABNORMAL' | 'WARNING';
  recordedAt: string;
}

export type BillType = 'PROPERTY_FEE' | 'WATER_FEE' | 'ELECTRICITY_FEE' | 'GAS_FEE' | 'PARKING_FEE' | 'OTHER';

export type BillStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL_PAID';

export interface Bill {
  id: string;
  billNo: string;
  userId: string;
  userName: string;
  roomId: string;
  roomNumber: string;
  type: BillType;
  amount: number;
  paidAmount: number;
  status: BillStatus;
  billingPeriod: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalResidents: number;
  totalWorkOrders: number;
  pendingWorkOrders: number;
  todayWorkOrders: number;
  totalBills: number;
  unpaidBills: number;
  unpaidAmount: number;
  totalActivities: number;
  ongoingActivities: number;
  slaWarningCount: number;
  workOrderTrend: Array<{ date: string; count: number }>;
  revenueTrend: Array<{ month: string; amount: number }>;
  workOrderTypeDistribution: Array<{ type: string; count: number }>;
  billTypeDistribution: Array<{ type: string; amount: number }>;
}
