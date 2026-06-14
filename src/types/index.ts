export type OrderStatus =
  | 'PUBLISHED'
  | 'MATCHING'
  | 'MATCHED'
  | 'ACCEPTED'
  | 'PICKING_UP'
  | 'IN_TRANSIT'
  | 'PARTIAL_DELIVERED'
  | 'DELIVERED'
  | 'FULFILLMENT_CHECKING'
  | 'COMPLETED'
  | 'EXCEPTION'
  | 'CANCELLED';

export type TempControl = 'NORMAL' | 'REFRIGERATED' | 'FRESH' | 'DEEP_FREEZE';
export type LoadingDifficulty = 'LOW' | 'MEDIUM' | 'HIGH';
export type VehicleType = 'VAN' | 'TRUCK_4M' | 'TRUCK_6M' | 'TRUCK_9M' | 'REEFER';
export type UserRole = 'SHIPPER' | 'DRIVER' | 'ADMIN';
export type DriverStatus = 'IDLE' | 'ON_DUTY' | 'IN_TRANSIT';
export type StopType = 'PICKUP' | 'DELIVERY';

export interface CargoStop {
  seq: number;
  type: StopType;
  address: string;
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
  arrivedAt?: string;
  departedAt?: string;
  signedBy?: string;
  weightDiffKg?: number;
}

export interface PriceBreakdown {
  basePrice: number;
  congestionPremium: number;
  nightSurcharge: number;
  multiStopCoefficient: number;
  insuranceFee: number;
  total: number;
}

export interface InsuranceInfo {
  enabled: boolean;
  policyNo?: string;
  premium: number;
  coverage: number;
  insurer: 'PICC';
  status: 'PENDING' | 'ISSUED' | 'CLAIMED' | 'SETTLED';
}

export interface CheckResult {
  pass: boolean;
  score: number;
  detail: string;
}

export interface Violation {
  type: 'LOAD' | 'TEMP' | 'DOOR' | 'STOP_SEQ';
  timestamp: string;
  severity: 'WARNING' | 'SERIOUS';
  description: string;
}

export interface FulfillmentResult {
  orderId: string;
  loadCheck: CheckResult;
  tempCheck: CheckResult;
  doorCheck: CheckResult;
  stopSeqCheck: CheckResult;
  overallPass: boolean;
  violations: Violation[];
}

export interface CargoOrder {
  id: string;
  orderNo: string;
  shipperId: string;
  shipperName: string;
  cargoName: string;
  volume: number;
  weight: number;
  tempControl: TempControl;
  tempRange?: [number, number];
  loadingDifficulty: LoadingDifficulty;
  cargoValue: number;
  stops: CargoStop[];
  pickupTimeWindow: [string, string];
  priceBreakdown: PriceBreakdown;
  totalPrice: number;
  insurance: InsuranceInfo;
  status: OrderStatus;
  driverId?: string;
  matchedAt?: string;
  createdAt: string;
  fulfillment?: FulfillmentResult;
  currentLat?: number;
  currentLng?: number;
  matchCandidates?: MatchCandidate[];
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  licensePlate: string;
  vehicleType: VehicleType;
  vehicleTypeName: string;
  maxVolume: number;
  maxWeight: number;
  tempCapability?: TempControl[];
  historyFulfillmentRate: number;
  currentLat: number;
  currentLng: number;
  currentStatus: DriverStatus;
  saturation: number;
  totalOrders: number;
  rating: number;
  region: string;
  todayEarnings?: number;
}

export interface DoorEvent {
  timestamp: string;
  location: { lat: number; lng: number };
  durationSec: number;
}

export interface VehicleSensorData {
  driverId: string;
  orderId?: string;
  timestamp: string;
  loadWeight: number;
  temperature: number;
  doorOpenCount: number;
  doorEvents: DoorEvent[];
  location: { lat: number; lng: number; speed: number };
}

export interface MatchCandidate {
  driverId: string;
  driver: Driver;
  overallScore: number;
  routeScore: number;
  historyScore: number;
  vehicleScore: number;
  returnEmptyScore: number;
  etaMinutes: number;
  distanceKm: number;
}

export interface UserInfo {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  avatar: string;
  company?: string;
}

export interface RegionSaturation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  saturation: number;
  idleDrivers: number;
  inTransitDrivers: number;
  pendingOrders: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  value: number;
  count: number;
  regionName: string;
}

export interface TrafficZone {
  id: string;
  name: string;
  congestionFactor: number;
}
