export type OrderStatus = 'pending' | 'collected' | 'sorting' | 'transit' | 'delivering' | 'signed' | 'exception';
export type GoodsType = 'normal' | 'cold' | 'fragile';
export type RouteType = 'air' | 'land' | 'cold';

export interface Order {
  id: string;
  waybillNo: string;
  sender: {
    name: string;
    phone: string;
    address: string;
  };
  recipient: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  goods: {
    name: string;
    weight: number;
    type: GoodsType;
  };
  routing: {
    routeType: RouteType;
    estimatedTime: number;
    hubs: string[];
  };
  status: OrderStatus;
  department?: string;
  project?: string;
  totalFee: number;
  createdAt: string;
  qrCode: string;
  blockchainHash: string;
  userId: string;
  billId?: string;
}

export interface TrackNode {
  id: string;
  orderId: string;
  hubName: string;
  location: { lat: number; lng: number };
  status: string;
  timestamp: string;
  operator: string;
  imageUrl?: string;
}

export type BillStatus = 'draft' | 'confirmed' | 'paid' | 'overdue';
export type BillDimension = 'department' | 'project' | 'recipient_city';

export interface BillDetail {
  id: string;
  dimension: BillDimension;
  department?: string;
  project?: string;
  recipientCity?: string;
  orderCount: number;
  totalWeight: number;
  totalFee: number;
  billId: string;
}

export interface Bill {
  id: string;
  enterpriseName: string;
  month: string;
  totalOrders: number;
  totalWeight: number;
  totalFee: number;
  paidAmount: number;
  status: BillStatus;
  details: BillDetail[];
  orders: Order[];
  createdAt: string;
}

export type GreenLevel = 'A' | 'B' | 'C';

export interface CarbonRecord {
  id: string;
  orderId: string;
  packaging: {
    carton: number;
    tape: number;
    filler: number;
  };
  carbonEmission: number;
  carbonReduction: number;
  greenLevel: GreenLevel;
}

export type WarningLevel = 'normal' | 'warning' | 'danger';

export interface HubCapacity {
  hubId: string;
  hubName: string;
  throughput: number;
  maxCapacity: number;
  vehiclesInTransit: number;
  exceptionCount: number;
  warningLevel: WarningLevel;
  location: string;
  lat: number;
  lng: number;
}

export type ExceptionType = 'delay' | 'damage' | 'lost' | 'address_error';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

export interface ExceptionOrder {
  id: string;
  orderId: string;
  waybillNo: string;
  type: ExceptionType;
  description: string;
  status: ExceptionStatus;
  createdAt: string;
  handledBy?: string;
  handledAt?: string;
}

export interface RoutingRule {
  id: string;
  minWeight: number;
  maxWeight: number;
  destination?: string;
  maxHours?: number;
  routeType: RouteType;
  priority: number;
}

export type UserRole = 'sender' | 'courier' | 'sorter' | 'recipient' | 'admin';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  enterpriseName?: string;
  phone: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
