export type UserRole = 'sender' | 'receiver' | 'admin';

export type ServiceLevel = 'standard' | 'nextday' | 'secondDay';

export type WaybillStatus = 'pending' | 'picked' | 'inTransit' | 'delivering' | 'signed' | 'exception';

export type ClaimType = 'damage' | 'lost';

export type ClaimStatus = 'pending' | 'reviewing' | 'approved' | 'paid' | 'rejected';

export type CLVTier = 'low' | 'medium' | 'high' | 'premium';

export interface User {
  id: number;
  phone: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
}

export interface Waybill {
  id: string;
  trackingNo: string;
  userId?: number;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  itemType: string;
  weight: number;
  volume?: number;
  isSpecial: boolean;
  specialDesc?: string;
  serviceLevel: ServiceLevel;
  pickupTime: string;
  freight: number;
  status: WaybillStatus;
  outletId?: number;
  createdAt: string;
}

export interface TrackingEvent {
  id: number;
  waybillId: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

export interface Outlet {
  id: number;
  name: string;
  address: string;
  lng: number;
  lat: number;
  phone: string;
  businessHours: string;
  serviceTags: string[];
  avgResponseTime: number;
  complaintRate: number;
  onTimeRate: number;
  rating: number;
}

export interface AfterSaleClaim {
  id: string;
  waybillId: string;
  userId: number;
  type: ClaimType;
  amount: number;
  description: string;
  images: string[];
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CLVData {
  id: number;
  customerId: number;
  totalOrders: number;
  totalAmount: number;
  orderFrequency: number;
  avgOrderValue: number;
  churnRisk: number;
  clvScore: number;
  tier: CLVTier;
  updatedAt: string;
}

export interface FreightCalculateRequest {
  originCity: string;
  destCity: string;
  weight: number;
  serviceLevel: ServiceLevel;
  volume?: number;
}

export interface FreightCalculateResponse {
  freight: number;
  estimatedDays: string;
  serviceLevel: ServiceLevel;
  serviceName: string;
  breakdown: {
    baseFee: number;
    weightFee: number;
    distanceFee: number;
    servicePremium: number;
  };
}

export interface HeatmapDataPoint {
  lng: number;
  lat: number;
  value: number;
  outletId: number;
  outletName: string;
  metric: 'responseTime' | 'complaintRate' | 'onTimeRate';
}

export interface DashboardStats {
  totalOrdersToday: number;
  totalOrdersYesterday: number;
  activeClaims: number;
  avgDeliveryTime: number;
  complaintRate: number;
  onTimeRate: number;
  weeklyTrend: { date: string; orders: number }[];
  topOutlets: { name: string; orders: number; rating: number }[];
}
