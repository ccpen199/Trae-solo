export interface Shop {
  id: number;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  onTimeRate: number;
  badReviewRate: number;
  repurchaseRate: number;
  deliveryRadius: number;
  isOnline: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  shopId: number;
  shopName?: string;
  name: string;
  category: 'flower' | 'cake' | 'gift';
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  festival: string[];
  scene: string[];
  shelfLifeHours: number;
  deliveryRadius: number;
  stock: number;
  createdAt: string;
}

export interface Inventory {
  id: number;
  shopId: number;
  productId: number;
  batchNo: string;
  quantity: number;
  temperature: number;
  humidity: number;
  inboundTime: string;
  expiryTime: string;
}

export interface User {
  id: number;
  phone: string;
  nickname: string;
  role: 'customer' | 'shop' | 'dispatcher' | 'admin';
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'accepted' | 'preparing' | 'picked' | 'delivering' | 'completed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  userId: number;
  shopId: number;
  shopName?: string;
  totalAmount: number;
  status: OrderStatus;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientLat: number;
  recipientLng: number;
  deliveryType: 'instant' | 'next-day';
  expectedDeliveryTime: string;
  actualDeliveryTime?: string;
  riderId?: number;
  riderName?: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: string;
  productId: number;
  productName?: string;
  productImage?: string;
  quantity: number;
  price: number;
}

export interface LogisticsNode {
  id: number;
  orderId: string;
  type: 'sorting' | 'rider' | 'cold-chain';
  name: string;
  lat: number;
  lng: number;
  temperature?: number;
  timestamp: string;
  status: string;
}

export interface Claim {
  id: number;
  orderId: string;
  type: 'timeout' | 'damaged' | 'rejected';
  reason: string;
  evidence?: string;
  refundRatio: number;
  refundAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Rider {
  id: number;
  name: string;
  phone: string;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  createdAt: string;
}

export interface Wastage {
  id: number;
  shopId: number;
  productId: number;
  productName?: string;
  batchNo: string;
  quantity: number;
  reason: string;
  recordedAt: string;
}

export interface DeliveryException {
  id: number;
  orderId: string;
  type: string;
  description: string;
  evidence?: string;
  reportedBy: number;
  reportedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ColdChainVehicle {
  id: string;
  orderId: string;
  riderName: string;
  currentLat: number;
  currentLng: number;
  currentTemperature: number;
  temperatureHistory: Array<{ timestamp: string; temperature: number }>;
  status: 'normal' | 'warning' | 'alert';
  lastUpdate: string;
}

export interface DispatchResult {
  shop: Shop;
  rider: Rider;
  reason: string;
  estimatedDeliveryTime?: string;
}

export interface ClaimStats {
  todayClaimAmount: number;
  claimRate: number;
  totalClaims: number;
  pendingClaims: number;
}

export interface ShopRating extends Shop {
  compositeScore: number;
  rank: number;
}

export interface HotProduct {
  id: number;
  name: string;
  shopName: string;
  salesCount: number;
  salesAmount: number;
  category: string;
}

export interface ShopSalesRanking {
  id: number;
  name: string;
  salesAmount: number;
  orderCount: number;
  city: string;
  district: string;
}

export interface DashboardStats {
  todayOrders: number;
  todayGMV: number;
  activeShops: number;
  activeRiders: number;
  orderGrowth: number;
  gmvGrowth: number;
  shopGrowth: number;
  riderGrowth: number;
}
