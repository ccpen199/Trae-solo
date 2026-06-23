export type UserRole = 'courier' | 'admin' | 'operator';

export type TaskStatus = 'pending' | 'assigned' | 'picked' | 'weighed' | 'paid' | 'printed' | 'in_transit' | 'completed' | 'exception' | 'cancelled';

export type OrderStatus = 'created' | 'assigned' | 'picked' | 'printed' | 'shipped' | 'completed' | 'cancelled';

export type MessageType = 'pickup_reminder' | 'balance_alert' | 'suspension_notice' | 'system_announcement' | 'exception_alert';

export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'account';

export type WithdrawStatus = 'pending' | 'approved' | 'rejected' | 'transferred' | 'failed';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  outletId?: string;
  outletName?: string;
  deviceFingerprint?: string;
  certificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  sender: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
    fullAddress: string;
  };
  receiver: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
    fullAddress: string;
  };
  itemType: string;
  estimatedWeight: number;
  actualWeight?: number;
  appointmentTime: string;
  pickupCode: string;
  status: OrderStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupTask {
  id: string;
  taskNo: string;
  orderId: string;
  orderNo: string;
  courierId?: string;
  courierName?: string;
  outletId: string;
  pickupCode: string;
  senderAddress: string;
  senderPhone: string;
  itemType: string;
  estimatedWeight: number;
  actualWeight?: number;
  appointmentTime: string;
  status: TaskStatus;
  freight?: number;
  paymentMethod?: PaymentMethod;
  weightCheckRule: 'strict' | 'tolerance' | 'none';
  weightTolerance?: number;
  photos?: string[];
  waybillNo?: string;
  printedAt?: string;
  exceptionReason?: string;
  createdAt: string;
  pickedAt?: string;
  completedAt?: string;
  synced: boolean;
}

export interface WaybillAccount {
  id: string;
  outletId: string;
  outletName: string;
  balance: number;
  frozenBalance: number;
  totalRecharged: number;
  totalUsed: number;
  templateConfig: {
    templateId: string;
    templateName: string;
    paperSize: '100x150' | '100x180' | '80x150';
    fontSize: 'small' | 'medium' | 'large';
    showLogo: boolean;
    logoUrl?: string;
  };
  lowBalanceThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface RechargeRecord {
  id: string;
  accountId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  status: 'pending' | 'success' | 'failed';
  operatorId?: string;
  operatorName?: string;
  remark?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  targetRole?: UserRole;
  targetOutletId?: string;
  targetCourierId?: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface DailyFinance {
  date: string;
  outletId: string;
  outletName: string;
  totalOrders: number;
  totalWeight: number;
  totalFreight: number;
  waybillCost: number;
  platformFee: number;
  netIncome: number;
  detail: Array<{
    taskId: string;
    orderNo: string;
    weight: number;
    freight: number;
    waybillCost: number;
    platformFee: number;
  }>;
}

export interface WithdrawRecord {
  id: string;
  outletId: string;
  amount: number;
  bankCardId: string;
  bankName: string;
  cardNumber: string;
  cardHolder: string;
  status: WithdrawStatus;
  auditorId?: string;
  auditorName?: string;
  auditRemark?: string;
  transferTransactionId?: string;
  applicantId: string;
  applicantName: string;
  createdAt: string;
  auditedAt?: string;
  transferredAt?: string;
}

export interface BankCard {
  id: string;
  outletId: string;
  bankName: string;
  bankBranch: string;
  cardNumber: string;
  cardHolder: string;
  phone: string;
  isDefault: boolean;
  verified: boolean;
  createdAt: string;
}

export interface FinanceOverview {
  totalBalance: number;
  frozenBalance: number;
  availableBalance: number;
  pendingWithdraw: number;
  totalIncome: number;
  totalWithdrawn: number;
  totalWaybillUsed: number;
  unsettledAmount: number;
  defaultCard?: BankCard;
  bankCardCount: number;
}

export interface GlobalDashboardData {
  totalOutlets: number;
  totalCouriers: number;
  totalTasks: number;
  totalTasksToday: number;
  completedTasksToday: number;
  pendingTasks: number;
  pending: number;
  exceptionTasks: number;
  exception: number;
  totalRevenue: number;
  totalRevenueToday: number;
  averagePickupTime: number;
  outletRankings: Array<{
    outletId: string;
    outletName: string;
    completedTasks: number;
    totalRevenue: number;
  }>;
  hourlyTrend: Array<{
    hour: string;
    tasks: number;
  }>;
  recentExceptions: Array<{
    id: string;
    taskId: string;
    orderNo: string;
    reason: string;
    exceptionReason: string;
    status: string;
    outletName: string;
    courierName: string;
    createdAt: string;
  }>;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = any> {
  code: number;
  message: string;
  data: {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}
