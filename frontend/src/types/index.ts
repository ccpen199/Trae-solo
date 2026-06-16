export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'CITIZEN' | 'MERCHANT' | 'ADMIN' | 'GOVERNMENT';
  interestTags?: string[];
  latitude?: number;
  longitude?: number;
  locationName?: string;
  isVerified: boolean;
  creditScore: number;
}

export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  businessLicense: string;
  licenseVerified: boolean;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  description?: string;
  logo?: string;
  images?: any;
  rating: number;
  reviewCount: number;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  coupons?: Coupon[];
  distance?: number;
  stats?: {
    totalCoupons: number;
    totalClaimed: number;
    totalRedeemed: number;
    redemptionRate: number;
    reviewCount: number;
    postConversionRate: number;
    heatScore: number;
  };
}

export interface Coupon {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';
  discountValue: number;
  minSpend: number;
  totalQuantity: number;
  claimedQuantity: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  isActive: boolean;
  merchant?: Merchant;
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  claimedAt: string;
  usedAt?: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  coupon: Coupon & { merchant: Merchant };
}

export interface AuditLog {
  id: string;
  postId: string;
  auditorId: string;
  action: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiScore: number;
  matchedKeywords?: string[];
  reason?: string;
  createdAt: string;
  auditor?: Pick<User, 'id' | 'nickname' | 'avatar' | 'role'>;
}

export interface Post {
  id: string;
  userId: string;
  merchantId?: string;
  type: 'NEWS' | 'REVIEW' | 'ACTIVITY' | 'HELP' | 'INFO' | 'NOTICE' | 'EMERGENCY';
  title: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  priceAnchor?: number;
  hasProof: boolean;
  isPitfall: boolean;
  hotScore: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED';
  auditNote?: string;
  sourceLevel: 'ORDINARY' | 'V' | 'OFFICIAL' | 'GOV';
  sourceOrg?: string;
  createdAt: string;
  updatedAt: string;
  expireAt?: string;
  user: Pick<User, 'id' | 'nickname' | 'avatar' | 'isVerified'>;
  merchant?: Pick<Merchant, 'id' | 'businessName' | 'logo'>;
  topics?: { topic: Topic }[];
  comments?: Comment[];
  likes?: any[];
  auditLogs?: AuditLog[];
  isLiked?: boolean;
  distance?: number;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  postCount: number;
  heatScore: number;
  isHot: boolean;
  category?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId?: string;
  isTop: boolean;
  likeCount: number;
  status: 'NORMAL' | 'HIDDEN' | 'REMOVED';
  createdAt: string;
  user: Pick<User, 'id' | 'nickname' | 'avatar'>;
  children?: Comment[];
}

export interface HelpRequest {
  id: string;
  userId: string;
  type: 'SECOND_HAND' | 'SKILL_EXCHANGE' | 'EMERGENCY' | 'OTHER';
  title: string;
  content: string;
  images?: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  radiusMeters: number;
  urgency: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
  acceptedBy?: string;
  user: Pick<User, 'id' | 'nickname' | 'avatar' | 'phone' | 'creditScore'>;
  responses?: HelpResponse[];
  messages?: Message[];
  distance?: number;
}

export interface HelpResponse {
  id: string;
  requestId: string;
  userId: string;
  content: string;
  images?: string[];
  isAccepted: boolean;
  createdAt: string;
  user: Pick<User, 'id' | 'nickname' | 'avatar' | 'creditScore'>;
}

export interface Message {
  id: string;
  helpRequestId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: Pick<User, 'id' | 'nickname' | 'avatar'>;
}

export interface UtilityService {
  id: string;
  type: 'BUS' | 'WATER_NOTICE' | 'POWER_NOTICE' | 'VACCINATION' | 'COVID_TEST';
  name: string;
  provider: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  lastUpdated: string;
  data: any;
  updates?: UtilityUpdate[];
}

export interface UtilityUpdate {
  id: string;
  serviceId: string;
  title: string;
  content: string;
  locationScope: string;
  startTime?: string;
  endTime?: string;
  severity: number;
  createdAt: string;
  service?: UtilityService;
}

export interface BusStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  predictions: {
    lineName: string;
    arrivalMinutes: number;
    nextArrivalMinutes: number;
  }[];
}

export interface TestSite {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  hours: string;
  price: number;
  status: string;
  waitTime: string;
  distance?: number;
}
