// 基础枚举类型

/** 订单状态 */
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  NO_SHOW = 'NO_SHOW',
}

/** 酒店状态 */
export enum HotelStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
}

/** 房型状态 */
export enum RoomTypeStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

/** 房价计划状态 */
export enum RatePlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/** 会员等级 */
export enum MemberTier {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
}

/** 币种 */
export enum Currency {
  CNY = 'CNY',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  GBP = 'GBP',
  AED = 'AED',
  SGD = 'SGD',
  THB = 'THB',
}

/** 税率类型 */
export enum TaxType {
  VAT = 'VAT',
  CITY_TAX = 'CITY_TAX',
  TOURISM_TAX = 'TOURISM_TAX',
  SERVICE_FEE = 'SERVICE_FEE',
}

/** 费用类型 */
export enum FeeType {
  CLEANING_FEE = 'CLEANING_FEE',
  BREAKFAST_FEE = 'BREAKFAST_FEE',
  EXTRA_BED_FEE = 'EXTRA_BED_FEE',
  PARKING_FEE = 'PARKING_FEE',
  PET_FEE = 'PET_FEE',
}

/** 折扣类型 */
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

/** 用户角色 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_OPERATOR = 'PLATFORM_OPERATOR',
  HOTEL_ADMIN = 'HOTEL_ADMIN',
  HOTEL_STAFF = 'HOTEL_STAFF',
  CUSTOMER = 'CUSTOMER',
}

/** 取消政策类型 */
export enum CancellationType {
  FREE_CANCELLATION = 'free_cancellation',
  PARTIAL_REFUND = 'partial_refund',
  NON_REFUNDABLE = 'non_refundable',
}

/** 入住状态 */
export enum StayStatus {
  UPCOMING = 'UPCOMING',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  NO_SHOW = 'NO_SHOW',
}

/** 申请状态 */
export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ADDITIONAL_INFO_REQUIRED = 'additional_info_required',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/** GDPR 请求类型 */
export enum GDPRRequestType {
  ACCESS = 'access',
  RECTIFICATION = 'rectification',
  ERASURE = 'erasure',
  EXPORT = 'export',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
}

/** GDPR 请求状态 */
export enum GDPRRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

/** 佣金结算周期 */
export enum SettlementCycle {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

/** 税务计算基数 */
export enum TaxCalculationBasis {
  ROOM_RATE = 'room_rate',
  PER_NIGHT = 'per_night',
  PER_GUEST = 'per_guest',
}

// 通用接口

/** 分页参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** 分页结果 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** API 成功响应 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/** API 错误响应 */
export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: string;
}

/** 坐标位置 */
export interface GeoLocation {
  lat: number;
  lng: number;
}

// 核心业务接口

/** 酒店地址 */
export interface HotelAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  postalCode: string;
  lat: number;
  lng: number;
}

/** 酒店联系方式 */
export interface HotelContact {
  phone: string;
  email: string;
  website?: string;
}

/** 酒店评分明细 */
export interface RatingBreakdown {
  cleanliness: number;
  service: number;
  location: number;
  facilities: number;
  valueForMoney: number;
}

/** 取消政策 */
export interface CancellationPolicy {
  type: CancellationType;
  deadlineDays: number;
  penaltyPercentage?: number;
}

/** 酒店政策 */
export interface HotelPolicies {
  checkInTime: string;
  checkOutTime: string;
  allowEarlyCheckIn: boolean;
  allowLateCheckOut: boolean;
  maxGuestsPerRoom: number;
  minAgeForCheckIn: number;
  paymentMethods: string[];
  smokingPolicy: 'non_smoking' | 'designated_areas' | 'all_areas';
  petPolicy: 'not_allowed' | 'allowed' | 'allowed_with_fee';
  cancellationPolicy: CancellationPolicy;
}

/** 酒店 */
export interface Hotel {
  id: string;
  name: string;
  nameEn?: string;
  shortDescription: string;
  description: string;
  starRating: number;
  status: HotelStatus;
  address: HotelAddress;
  contact: HotelContact;
  thumbnail: string;
  images: string[];
  facilities: string[];
  overallRating: number;
  reviewCount: number;
  ratingBreakdown: RatingBreakdown;
  policies: HotelPolicies;
  createdAt: string;
  updatedAt: string;
}

/** 房型 */
export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  nameEn?: string;
  description: string;
  sizeSqm: number;
  maxOccupancy: number;
  bedType: string;
  bedCount: number;
  status: RoomTypeStatus;
  images: string[];
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

/** 房价计划 */
export interface RatePlan {
  id: string;
  roomTypeId: string;
  channel: string;
  price: {
    amount: number;
    currency: Currency;
  };
  originalPrice?: {
    amount: number;
    currency: Currency;
  };
  includesBreakfast: boolean;
  isRefundable: boolean;
  status: RatePlanStatus;
  validFrom?: string;
  validTo?: string;
}

/** 渠道价格对比项 */
export interface ChannelPriceComparison {
  channel: string;
  price: {
    amount: number;
    currency: Currency;
  };
  savings?: number;
}

/** 搜索结果 */
export interface SearchResult {
  id: string;
  hotel: Hotel;
  roomTypes: RoomType[];
  bestRate: RatePlan;
  rateComparison: ChannelPriceComparison[];
  compositeScore: number;
  distanceFromSearch?: number;
}

export type HotelSearchResult = SearchResult;

/** 价格货币 */
export interface PriceCurrency {
  amount: number;
  currency: Currency;
}

/** 税费项 */
export interface TaxItem {
  name: string;
  rate: number;
  amount: PriceCurrency;
  type: TaxType;
}

/** 费用项 */
export interface FeeItem {
  name: string;
  amount: PriceCurrency;
  description?: string;
}

/** 折扣项 */
export interface DiscountItem {
  name: string;
  code?: string;
  amount: PriceCurrency;
  percentage?: number;
}

/** 入住人 */
export interface Guest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

/** 价格明细 */
export interface PricingDetail {
  roomTotal: PriceCurrency;
  taxes: {
    amount: PriceCurrency;
    breakdown: TaxItem[];
  };
  fees: {
    amount: PriceCurrency;
    breakdown: FeeItem[];
  };
  discounts: {
    amount: PriceCurrency;
    breakdown: DiscountItem[];
  };
  grandTotal: PriceCurrency;
}

/** 预订订单 */
export interface BookingOrder {
  id: string;
  orderNumber: string;
  hotelId: string;
  hotelName?: string;
  roomTypeId: string;
  roomTypeName?: string;
  ratePlanId: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: {
    adults: number;
    children: number;
    infants: number;
  };
  guestInfo: Guest[];
  specialRequests?: string;
  pricing: PricingDetail;
  status: OrderStatus;
  channelCode?: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
  confirmationNumber?: string;
  cancellationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

/** 会员权益 */
export interface MemberBenefit {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

/** 会员 */
export interface Member {
  id: string;
  userId: string;
  tier: MemberTier;
  points: number;
  tierPoints: number;
  tierPointsToNextLevel: number;
  memberSince: string;
  vipAccessEnabled: boolean;
  lateCheckoutHours: number;
  benefits: MemberBenefit[];
}

/** 积分交易 */
export interface PointsTransaction {
  id: string;
  memberId: string;
  amount: number;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  referenceType: string;
  referenceId?: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

/** 行程 */
export interface Itinerary {
  id: string;
  userId: string;
  name: string;
  description?: string;
  bookings: string[];
  shareToken?: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

/** GDPR 请求 */
export interface GDPRRequest {
  id: string;
  userId: string;
  type: GDPRRequestType;
  status: GDPRRequestStatus;
  description?: string;
  responseDetails?: string;
  processedBy?: string;
  submittedAt: string;
  completedAt?: string;
}

/** 酒店入驻申请 */
export interface HotelOnboardingApplication {
  id: string;
  hotelId?: string;
  legalName: string;
  brandName?: string;
  registrationNumber: string;
  taxNumber: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  propertyDetails?: {
    starRating: number;
    roomCount: number;
    facilities: string[];
  };
  documents?: {
    businessLicense?: string;
    propertyLicense?: string;
    insuranceCertificate?: string;
  };
  status: ApplicationStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 佣金配置 */
export interface CommissionConfig {
  id: string;
  hotelId: string;
  commissionRate: number;
  settlementCycle: SettlementCycle;
  currency: Currency;
  paymentTerms: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

/** 税务规则 */
export interface TaxRule {
  id: string;
  countryCode: string;
  region?: string;
  type: TaxType;
  rate: number;
  calculationBasis: TaxCalculationBasis;
  appliesTo: 'all' | 'residents' | 'non_residents';
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  effectiveFrom: string;
  isActive: boolean;
  createdAt: string;
}

/** 用户 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  locale: string;
  preferredCurrency: Currency;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 搜索参数 */
export interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  infants?: number;
  rooms?: number;
  channelCode?: string;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number[];
  facilities?: string[];
  cancellationType?: CancellationType;
  sortBy?: 'recommended' | 'price_low' | 'price_high' | 'rating' | 'distance';
}

/** 登录请求 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** 注册请求 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/** 登录响应 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/** 创建订单请求 */
export interface CreateBookingRequest {
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: {
    adults: number;
    children?: number;
    infants?: number;
  };
  guestInfo: Guest[];
  specialRequests?: string;
  channelCode?: string;
  promoCode?: string;
}

/** 价格计算请求 */
export interface CalculatePriceRequest {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: {
    adults: number;
    children?: number;
    infants?: number;
  };
  promoCode?: string;
  channelCode?: string;
}
