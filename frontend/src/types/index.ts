export type UserRole = 'user' | 'rider' | 'merchant' | 'admin';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  phone: string;
  name: string;
  avatar?: string;
  level: number;
  vehicleType: string;
  vehicleNumber?: string;
  isOnline: boolean;
  rating: number;
  orderCount: number;
  balance: number;
  totalEarnings: number;
  location?: GeoPoint;
  status: 'active' | 'banned' | 'reviewing';
  createdAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  phone: string;
  shopName: string;
  shopLogo?: string;
  shopAddress?: string;
  shopType: string;
  businessLicense?: string;
  status: 'active' | 'banned' | 'reviewing';
  rating: number;
  orderCount: number;
  balance: number;
  createdAt: string;
}

export interface Admin {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'city_admin' | 'operator';
  createdAt: string;
}

export type OrderCategory = 'buy' | 'send' | 'fetch' | 'errand';

export type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'delivering' | 'completed' | 'cancelled' | 'disputed';

export interface Order {
  id: string;
  orderNo: string;
  category: OrderCategory;
  status: OrderStatus;
  userId: string;
  user?: User;
  riderId?: string;
  rider?: Rider;
  merchantId?: string;
  merchant?: Merchant;
  title: string;
  description?: string;
  pickupAddress: string;
  pickupLocation: GeoPoint;
  pickupName?: string;
  pickupPhone?: string;
  deliveryAddress: string;
  deliveryLocation: GeoPoint;
  deliveryName: string;
  deliveryPhone: string;
  weight?: number;
  goodsValue?: number;
  tip?: number;
  distance: number;
  duration: number;
  deliveryFee: number;
  totalAmount: number;
  payStatus: 'unpaid' | 'paid' | 'refunded';
  payMethod?: 'wechat' | 'alipay' | 'balance';
  paidAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelBy?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface GpsTrack {
  id: string;
  orderId: string;
  riderId: string;
  location: GeoPoint;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface Settlement {
  id: string;
  orderId: string;
  riderId: string;
  amount: number;
  platformFee: number;
  riderIncome: number;
  status: 'pending' | 'settled';
  settledAt?: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userType: 'rider' | 'merchant';
  amount: number;
  fee: number;
  actualAmount: number;
  payMethod: 'wechat' | 'alipay' | 'bank';
  payAccount: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  rejectReason?: string;
  approvedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DisputeTicket {
  id: string;
  orderId: string;
  order?: Order;
  reporterId: string;
  reporterType: UserRole;
  respondentId: string;
  respondentType: UserRole;
  type: string;
  title: string;
  description: string;
  evidence?: string[];
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  handlerId?: string;
  handler?: Admin;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  riderId: string;
  rating: number;
  content?: string;
  images?: string[];
  tags?: string[];
  createdAt: string;
}

export interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: string;
}

export interface Coupon {
  id: string;
  name: string;
  type: 'discount' | 'amount' | 'free_delivery';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  used: boolean;
  usedAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  fullAddress: string;
  location: GeoPoint;
  isDefault: boolean;
  tag?: 'home' | 'company' | 'school' | 'other';
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
