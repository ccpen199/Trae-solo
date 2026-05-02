export type UserRole = 'USER' | 'ADMIN' | 'CUSTOMER_SERVICE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  balance: number;
  status: UserStatus;
  createdAt: string;
}

export type AccountStatus = 'PENDING_REVIEW' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'SOLD' | 'REMOVED';

export interface GameAccount {
  id: string;
  title: string;
  description?: string;
  gameName: string;
  gameServer?: string;
  accountLevel?: number;
  price: number;
  originalPrice?: number;
  sellerId: string;
  status: AccountStatus;
  viewCount: number;
  favoriteCount: number;
  isTop: boolean;
  isHot: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    username: string;
  };
  images?: AccountImage[];
}

export interface AccountImage {
  id: string;
  accountId: string;
  url: string;
  sort: number;
  isMain: boolean;
  createdAt: string;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_DELIVERY' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELED' | 'EXCEPTION';

export interface Order {
  id: string;
  orderNo: string;
  accountId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: OrderStatus;
  paymentMethod?: string;
  paidAt?: string;
  deliveryInfo?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  account?: GameAccount;
  buyer?: {
    id: string;
    username: string;
  };
  seller?: {
    id: string;
    username: string;
  };
}

export type ExceptionType = 'PAYMENT_ISSUE' | 'DELIVERY_ISSUE' | 'ACCOUNT_ISSUE' | 'COMPLAINT' | 'REFUND_REQUEST' | 'OTHER';
export type ExceptionStatus = 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';
export type ExceptionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Exception {
  id: string;
  orderId?: string;
  type: ExceptionType;
  title: string;
  description?: string;
  status: ExceptionStatus;
  priority: ExceptionPriority;
  handlerId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
  order?: Order;
  handler?: {
    id: string;
    username: string;
  };
  logs?: ExceptionLog[];
}

export interface ExceptionLog {
  id: string;
  exceptionId: string;
  operatorId?: string;
  action: string;
  description?: string;
  createdAt: string;
}

export type TodoType = 'ORDER_REVIEW' | 'ACCOUNT_REVIEW' | 'EXCEPTION_HANDLE' | 'CUSTOMER_FOLLOWUP' | 'OTHER';
export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  type: TodoType;
  status: TodoStatus;
  priority: TodoPriority;
  relatedId?: string;
  relatedType?: string;
  assigneeId?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  overview: {
    totalAccounts: number;
    totalOrders: number;
    totalAmount: number;
    pendingExceptions: number;
    pendingTodos: number;
  };
  accountStats: Record<string, number>;
  orderStats: Record<string, { count: number; amount: number }>;
  exceptionStats: Record<string, Record<string, number>>;
  todoStats: Record<string, Record<string, number>>;
  recentOrders: Order[];
  recentExceptions: Exception[];
}

export interface TrendData {
  date: string;
  orders: number;
  completed: number;
}
