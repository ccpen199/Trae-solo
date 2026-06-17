// 市民信息类型
export interface Citizen {
  id: string;
  idCardNumber: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  realNameVerified: boolean;
  realNameVerifiedAt?: Date;
  faceVerified: boolean;
  avatar?: string;
  district: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 电子卡证类型
export interface ElectronicCard {
  id: string;
  citizenId: string;
  cardType: 'social_security' | 'medical_insurance' | 'driver_license' | 'transport';
  cardNumber: string;
  cardName: string;
  status: 'active' | 'inactive' | 'lost';
  boundAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// 交通卡类型
export interface TransportCard {
  id: string;
  citizenId: string;
  cardNo: string;
  balance: number;
  status: 'active' | 'inactive' | 'lost' | 'closed';
  nfcEnabled: boolean;
  cityCode: string;
  cityName: string;
  createdAt: Date;
}

// 交易记录类型
export interface Transaction {
  id: string;
  cardId: string;
  type: 'recharge' | 'consume' | 'refund';
  amount: number;
  balanceAfter: number;
  cityCode?: string;
  cityName?: string;
  routeName?: string;
  discountApplied?: number;
  originalAmount?: number;
  status: 'success' | 'pending' | 'failed';
  createdAt: Date;
}

// 折扣策略类型
export interface DiscountRule {
  id: string;
  name: string;
  cityCodes: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  priority: number;
}

// 景区类型
export interface ScenicSpot {
  id: string;
  name: string;
  district: string;
  address: string;
  description: string;
  coverImage: string;
  images: string[];
  maxDailyCapacity: number;
  currentVisitorCount: number;
  openTime: string;
  closeTime: string;
  ticketPrice: number;
  isActive: boolean;
  adminUserId?: string;
  tags: string[];
  rating: number;
  reviewCount: number;
}

// 时段类型
export interface TimeSlot {
  id: string;
  scenicId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  reservedCount: number;
  isAvailable: boolean;
}

// 预约类型
export interface Reservation {
  id: string;
  citizenId: string;
  scenicId: string;
  scenicName: string;
  timeSlotId: string;
  visitorCount: number;
  visitorNames: string[];
  visitorIdCards: string[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  qrCode: string;
  checkedInAt?: Date;
  createdAt: Date;
}

// 企业类型
export interface Enterprise {
  id: string;
  name: string;
  unifiedSocialCreditCode: string;
  legalPersonName: string;
  industry: string;
  district: string;
  contactName: string;
  contactPhone: string;
  verifiedStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  createdAt: Date;
}

// 政策类型
export interface Policy {
  id: string;
  title: string;
  category: string;
  industry?: string;
  district?: string;
  summary: string;
  eligibility: string;
  deadline?: Date;
  isActive: boolean;
  createdAt: Date;
}

// 商户类型
export interface Merchant {
  id: string;
  name: string;
  category: string;
  district: string;
  address: string;
  logo?: string;
  verifiedStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  rating: number;
  createdAt: Date;
}

// 优惠券类型
export interface Coupon {
  id: string;
  templateId: string;
  citizenId: string;
  name: string;
  type: 'discount' | 'fixed_amount' | 'free';
  value: number;
  minSpendAmount?: number;
  merchantName?: string;
  code: string;
  status: 'active' | 'used' | 'expired';
  usedAt?: Date;
  expiresAt: Date;
  receivedAt: Date;
}

// 积分账户类型
export interface PointsAccount {
  id: string;
  citizenId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: Date;
}

// 服务入口类型
export interface ServiceEntry {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  path: string;
  category: 'transport' | 'tourism' | 'government' | 'life' | 'enterprise';
  isHot?: boolean;
  isNew?: boolean;
}

// 轮播图类型
export interface BannerItem {
  id: string;
  title: string;
  image: string;
  linkType: 'page' | 'service' | 'none';
  link?: string;
}

// 消息通知类型
export interface NoticeItem {
  id: string;
  title: string;
  summary: string;
  type: 'system' | 'activity' | 'service';
  isRead: boolean;
  createdAt: Date;
}

// 行政区划类型
export interface District {
  code: string;
  name: string;
  level: 'city' | 'district' | 'street';
  parentCode?: string;
}

// 通用API响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
