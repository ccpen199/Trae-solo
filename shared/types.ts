export type UserRole = 'owner' | 'fleet' | 'driver' | 'operator' | 'admin';

export type AuthStatus = 'pending' | 'approved' | 'rejected';

export type CargoStatus = 'draft' | 'published' | 'bidding' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';

export type WaybillStatus = 'pending' | 'loading' | 'in_transit' | 'unloading' | 'completed' | 'exception';

export type BillStatus = 'unpaid' | 'partial' | 'paid';

export type InvoiceStatus = 'not_applied' | 'applied' | 'invoiced';

export type InvoiceType = 'vat_special' | 'vat_normal';

export type TrendType = 'up' | 'down' | 'stable';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  phone: string;
  companyName?: string;
  avatar?: string;
  authStatus: AuthStatus;
  createdAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  idCard: string;
  driverLicense: string;
  driverLicenseType: string;
  qualificationCertificate?: string;
  avatar?: string;
  authStatus: AuthStatus;
  rating: number;
  totalOrders: number;
  fleetId?: string;
}

export interface Vehicle {
  id: string;
  plateNo: string;
  vehicleType: string;
  vehicleLength: number;
  maxLoad: number;
  maxVolume: number;
  color: string;
  drivingLicense: string;
  roadTransportPermit?: string;
  insuranceExpireDate?: string;
  annualInspectionDate?: string;
  authStatus: AuthStatus;
  fleetId?: string;
  currentDriverId?: string;
}

export interface Carrier {
  id: string;
  companyName: string;
  businessLicense: string;
  roadTransportPermit: string;
  contactName: string;
  contactPhone: string;
  rating: number;
  whitelist: boolean;
  authStatus: AuthStatus;
}

export interface Cargo {
  id: string;
  orderNo: string;
  ownerId: string;
  cargoName: string;
  cargoType: 'LTL' | 'FTL';
  weight: number;
  volume: number;
  quantity: number;
  packageType: string;
  startCity: string;
  endCity: string;
  startAddress: string;
  endAddress: string;
  pickupTime: string;
  deliveryTime?: string;
  temperatureRequirement?: {
    min: number;
    max: number;
    unit: 'celsius' | 'fahrenheit';
  } | null;
  insurance?: {
    enabled: boolean;
    type: string;
    amount: number;
    premium: number;
  } | null;
  vehicleRequirement: {
    vehicleType: string;
    vehicleLength: number;
  };
  expectedPrice: number;
  status: CargoStatus;
  createdAt: string;
}

export interface Waybill {
  id: string;
  waybillNo: string;
  cargoId: string;
  driverId: string;
  vehicleId: string;
  fleetId?: string;
  actualPrice: number;
  status: WaybillStatus;
  startTime?: string;
  endTime?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  } | null;
}

export interface GpsPoint {
  id: string;
  waybillId: string;
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  ignition: boolean;
  timestamp: string;
}

export interface ExceptionRecord {
  id: string;
  waybillId: string;
  type: 'parking_timeout' | 'route_deviation' | 'temperature_abnormal' | 'delay';
  level: 'warning' | 'danger';
  location: { lat: number; lng: number };
  timestamp: string;
  description: string;
  handled: boolean;
  handledBy?: string;
  handledAt?: string;
  handleRemark?: string;
}

export interface Bill {
  id: string;
  billNo: string;
  orderId: string;
  waybillId: string;
  amount: number;
  type: 'receivable' | 'payable';
  status: BillStatus;
  invoiceStatus: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  billId: string;
  type: InvoiceType;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  buyerInfo: {
    companyName: string;
    taxNumber: string;
    address?: string;
    phone?: string;
    bank?: string;
    bankAccount?: string;
  };
  status: 'draft' | 'issued' | 'voided';
  issuedAt?: string;
  pdfUrl?: string;
}

export interface FreightRate {
  id: string;
  startCity: string;
  endCity: string;
  vehicleType: string;
  currentPrice: number;
  trend: TrendType;
  changePercent: number;
  updateTime: string;
}

export interface FuelCard {
  id: string;
  cardNo: string;
  driverId: string;
  balance: number;
  status: 'active' | 'frozen' | 'cancelled';
}

export interface FuelTransaction {
  id: string;
  cardId: string;
  amount: number;
  type: 'recharge' | 'consume' | 'refund';
  waybillId?: string;
  stationName?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
