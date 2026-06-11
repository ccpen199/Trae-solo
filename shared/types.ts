export type UserRole = "shipper" | "driver" | "admin";

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  name: string;
  avatar?: string;
  creditScore: number;
  performanceScore: number;
  createdAt: string;
}

export type LoadingMethod = "manual" | "forklift" | "crane" | "conveyor";
export type CargoStatus =
  | "draft"
  | "published"
  | "matched"
  | "shipping"
  | "completed"
  | "cancelled";

export interface Cargo {
  id: string;
  shipperId: string;
  title: string;
  origin: string;
  destination: string;
  distance: number;
  volume: number;
  weight: number;
  cargoType: string;
  loadingMethod: LoadingMethod;
  insuranceRequired: boolean;
  insuranceAmount?: number;
  expectedPrice: number;
  referencePrice: number;
  status: CargoStatus;
  requiredVehicleTypes: string[];
  requiredQualifications: string[];
  publishedAt: string;
  images?: string[];
}

export interface DriverProfile {
  id: string;
  userId: string;
  vehiclePlate: string;
  vehicleType: string;
  vehicleCapacity: number;
  vehicleVolume: number;
  qualifications: string[];
  performanceScore: number;
  totalOrders: number;
  isEmpty: boolean;
  currentLocation: { lat: number; lng: number; address: string };
  frequentRoutes: Array<{ origin: string; destination: string; count: number }>;
  safeDrivingPoints: number;
  level: number;
}

export type WaybillStatus =
  | "pending"
  | "loading"
  | "shipping"
  | "unloading"
  | "completed"
  | "disputed";

export interface NegotiationRecord {
  from: "shipper" | "driver";
  price: number;
  time: string;
  message?: string;
}

export interface TrackingPoint {
  lat: number;
  lng: number;
  time: string;
  speed?: number;
}

export interface Waybill {
  id: string;
  cargoId: string;
  shipperId: string;
  driverId: string;
  agreedPrice: number;
  status: WaybillStatus;
  negotiationHistory: NegotiationRecord[];
  blockchainHash?: string;
  trackingPoints: TrackingPoint[];
  estimatedArrival?: string;
  actualArrival?: string;
  createdAt: string;
}

export type AlertType = "credit" | "track" | "price" | "qualification";
export type AlertLevel = "low" | "medium" | "high" | "critical";

export interface RiskAlert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  targetId: string;
  targetType: "shipper" | "driver" | "waybill";
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface PricingModel {
  id: string;
  route: { origin: string; destination: string };
  cargoType: string;
  season: Season;
  basePricePerKm: number;
  basePricePerTon: number;
  surgeFactor: number;
  updatedAt: string;
}

export interface TrafficControl {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  affectedRoutes: string[];
  source: "amap" | "baidu";
}

export interface MatchedDriver extends DriverProfile {
  matchScore: number;
  distanceToCargo: number;
  estimatedArrivalTime: string;
}

export interface DriverGrowthConfig {
  pointsPerOrder: number;
  pointsPerSafeDay: number;
  levels: Array<{ level: number; name: string; minPoints: number; benefits: string[] }>;
  exchangeItems: Array<{ id: string; name: string; points: number; icon: string; stock: number }>;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

export interface LoginRequest {
  phone: string;
  role: UserRole;
}
