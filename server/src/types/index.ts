export type UserRole = 'sender' | 'courier' | 'sorter' | 'recipient' | 'admin';

export type GoodsType = 'normal' | 'cold' | 'fragile';

export type RouteType = 'air' | 'land' | 'cold';

export type OrderStatus = 'pending' | 'collected' | 'sorting' | 'transit' | 'delivering' | 'signed' | 'exception';

export type BillStatus = 'draft' | 'confirmed' | 'paid' | 'overdue';

export type BillDimension = 'department' | 'project' | 'recipient_city';

export type GreenLevel = 'A' | 'B' | 'C';

export type ExceptionType = 'delay' | 'damage' | 'lost' | 'address_error';

export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  enterpriseName?: string;
  phone: string;
  createdAt: string;
}

export interface Sender {
  name: string;
  phone: string;
  address: string;
}

export interface Recipient {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface Goods {
  name: string;
  weight: number;
  type: GoodsType;
}

export interface RoutingInfo {
  routeType: RouteType;
  estimatedTime: number;
  hubs: string[];
}

export interface Order {
  id: string;
  waybillNo: string;
  sender: Sender;
  recipient: Recipient;
  goods: Goods;
  routing?: RoutingInfo;
  status: OrderStatus;
  department?: string;
  project?: string;
  totalFee: number;
  createdAt: string;
  qrCode?: string;
  blockchainHash?: string;
  userId: string;
  billId?: string;
}

export interface OrderCreateInput {
  sender: Sender;
  recipient: Recipient;
  goods: Goods;
  department?: string;
  project?: string;
  userId: string;
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

export interface Bill {
  id: string;
  enterpriseName: string;
  month: string;
  totalOrders: number;
  totalWeight: number;
  totalFee: number;
  paidAmount: number;
  status: BillStatus;
  createdAt: string;
  details: BillDetail[];
  orders: Order[];
}

export interface BillDetail {
  id: string;
  billId: string;
  dimension: BillDimension;
  department?: string;
  project?: string;
  recipientCity?: string;
  orderCount: number;
  totalWeight: number;
  totalFee: number;
}

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

export interface Hub {
  id: string;
  name: string;
  location: string;
  maxCapacity: number;
  currentThroughput: number;
  vehiclesInTransit: number;
  lat: number;
  lng: number;
}

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

export interface RoutingMatchInput {
  weight: number;
  destination: string;
  goodsType: GoodsType;
  urgency?: 'standard' | 'express' | 'next-day';
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginResult {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: string[];
  orders: Order[];
}
