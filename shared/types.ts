export type UserRole = 'driver' | 'shipper' | 'admin';

export type AuthStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus =
  | 'published'
  | 'matched'
  | 'loading'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export type PrepayStatus =
  | 'pending'
  | 'risk_approved'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'settled';

export type SettlementCycle = 'daily' | 'weekly' | 'monthly';

export type SettlementStatus = 'draft' | 'processing' | 'completed' | 'failed';

export type FuelType = 'gasoline_92' | 'gasoline_95' | 'gasoline_98' | 'diesel_0' | 'diesel_-10';

export type TrackAlertType =
  | 'speeding'
  | 'fatigue'
  | 'deviation'
  | 'geofence_exit'
  | 'emergency'
  | 'sensor_abnormal';

export type TransactionType =
  | 'freight_income'
  | 'freight_payment'
  | 'prepay_disbursement'
  | 'prepay_deduction'
  | 'fuel_redeem'
  | 'fuel_recharge'
  | 'etc_deduction'
  | 'settlement'
  | 'withdrawal'
  | 'recharge';

export type FuelBrand = 'sinopec' | 'cnpc' | 'shell';

export interface AddressPoint {
  id: string;
  province: string;
  city: string;
  district: string;
  address: string;
  longitude: number;
  latitude: number;
  geohash?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface DriverAuthDocs {
  idCardFront: string;
  idCardBack: string;
  driverLicense: string;
  qualificationLicense: string;
  vehicleLicense: string;
  roadTransportPermit: string;
  submittedAt: string;
  auditedAt?: string;
  status: AuthStatus;
  auditRemark?: string;
}

export interface ShipperAuthDocs {
  businessLicense: string;
  legalPersonIdFront: string;
  legalPersonIdBack: string;
  companyName: string;
  unifiedSocialCreditCode: string;
  submittedAt: string;
  auditedAt?: string;
  status: AuthStatus;
  auditRemark?: string;
}

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  nickname: string;
  avatar?: string;
  realName?: string;
  idCardNo?: string;
  creditScore: number;
  createdAt: string;
  lastLoginAt?: string;
  driverDocs?: DriverAuthDocs;
  shipperDocs?: ShipperAuthDocs;
  walletId: string;
}

export interface DriverProfile {
  userId: string;
  realName: string;
  idCardNo: string;
  driverLicenseNo: string;
  qualificationLicenseNo: string;
  vehiclePlateNo: string;
  vehicleType: 'truck_4_2' | 'truck_6_8' | 'truck_9_6' | 'truck_13' | 'truck_17_5';
  vehicleLength: number;
  vehicleWeight: number;
  vehicleVolume: number;
  totalOrders: number;
  completedOrders: number;
  totalMileage: number;
  drivingYears: number;
  preferredRoutes: string[];
  preferredCargoTypes: string[];
  homeAddress: AddressPoint;
  currentLocation?: AddressPoint;
  rating: number;
}

export interface ShipperProfile {
  userId: string;
  companyName: string;
  unifiedSocialCreditCode: string;
  legalPersonName: string;
  industry: 'manufacturing' | 'retail' | 'logistics' | 'agriculture' | 'construction' | 'ecommerce';
  companyAddress: AddressPoint;
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  totalOrders: number;
  totalFreightAmount: number;
  rating: number;
  settlementCycle: SettlementCycle;
  contractStartDate: string;
  contractEndDate: string;
}

export interface FreightOrder {
  id: string;
  orderNo: string;
  shipperId: string;
  driverId?: string;
  title: string;
  cargoType: string;
  cargoWeight: number;
  cargoVolume: number;
  vehicleTypeRequired: string;
  pickupPoint: AddressPoint;
  deliveryPoint: AddressPoint;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryDeadline: string;
  freightAmount: number;
  prepayRatio: number;
  prepayMaxAmount: number;
  insuranceRequired: boolean;
  insuranceAmount?: number;
  status: OrderStatus;
  distanceKm: number;
  estimatedDurationHours: number;
  remark?: string;
  publishedAt: string;
  matchedAt?: string;
  loadedAt?: string;
  departedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface MatchResult {
  orderId: string;
  driverId: string;
  score: number;
  priceScore: number;
  creditScore: number;
  qualificationScore: number;
  routeScore: number;
  recommendedAt: string;
  matched?: boolean;
  matchedAt?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  frozenAmount: number;
  availableCredit: number;
  usedCredit: number;
  totalIncome: number;
  totalExpense: number;
  lastUpdatedAt: string;
  bankCards: BankCard[];
}

export interface BankCard {
  id: string;
  bankName: string;
  cardNo: string;
  cardHolder: string;
  isDefault: boolean;
  bindTime: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  counterpartyId?: string;
  counterpartyName?: string;
  relatedOrderId?: string;
  relatedSettlementId?: string;
  remark?: string;
  createdAt: string;
}

export interface PrepayOrder {
  id: string;
  prepayNo: string;
  orderId: string;
  driverId: string;
  shipperId: string;
  requestedAmount: number;
  approvedAmount: number;
  disbursedAmount: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'reject';
  riskReasons: string[];
  status: PrepayStatus;
  requestedAt: string;
  riskEvaluatedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  settledAt?: string;
  rejectReason?: string;
}

export interface SettlementBatch {
  id: string;
  batchNo: string;
  cycle: SettlementCycle;
  cycleStartDate: string;
  cycleEndDate: string;
  status: SettlementStatus;
  totalOrders: number;
  totalFreightAmount: number;
  totalFuelAmount: number;
  totalEtcAmount: number;
  totalPrepayDeduction: number;
  totalNetAmount: number;
  generatedAt: string;
  processedAt?: string;
  completedAt?: string;
  processedBy?: string;
}

export interface SettlementDetail {
  id: string;
  batchId: string;
  orderId: string;
  orderNo: string;
  driverId: string;
  driverName: string;
  shipperId: string;
  shipperName: string;
  freightAmount: number;
  fuelAmount: number;
  etcAmount: number;
  prepayDeduction: number;
  insuranceAmount: number;
  platformFee: number;
  netAmount: number;
  remark?: string;
}

export interface FuelStation {
  id: string;
  name: string;
  brand: FuelBrand;
  address: AddressPoint;
  phone: string;
  openHours: string;
  services: string[];
  rating: number;
  isRecommended: boolean;
  geohash?: string;
  prices: FuelPrice[];
}

export interface FuelPrice {
  stationId: string;
  fuelType: FuelType;
  price: number;
  originalPrice: number;
  updatedAt: string;
  effectiveDate: string;
}

export interface TrackPoint {
  id: string;
  orderId: string;
  driverId: string;
  timestamp: string;
  longitude: number;
  latitude: number;
  speed: number;
  heading: number;
  altitude: number;
  geohash?: string;
}

export interface TrackAlert {
  id: string;
  orderId: string;
  driverId: string;
  type: TrackAlertType;
  level: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface FuelRedeem {
  id: string;
  orderId: string;
  driverId: string;
  stationId: string;
  stationName: string;
  fuelType: FuelType;
  liters: number;
  unitPrice: number;
  totalAmount: number;
  redeemCode: string;
  status: 'issued' | 'redeemed' | 'expired';
  issuedAt: string;
  redeemedAt?: string;
  expiredAt: string;
}

export interface MatchingConfig {
  priceWeight: number;
  creditWeight: number;
  qualificationWeight: number;
  routeWeight: number;
  topN: number;
  minCreditScore: number;
  maxPriceDeviationPercent: number;
}

export interface RiskConfig {
  driverCreditWeight: number;
  completionRateWeight: number;
  orderRiskWeight: number;
  shipperCreditWeight: number;
  lowRiskThreshold: number;
  mediumRiskThreshold: number;
  highRiskThreshold: number;
  prepayMaxRatio: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
