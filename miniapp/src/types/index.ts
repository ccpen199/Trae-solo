export type CouponType = 'fixed' | 'discount' | 'threshold';
export type CouponStatus = 'available' | 'used' | 'expired' | 'frozen';
export type TabType = 'available' | 'used' | 'expired';
export type MapViewType = 'map' | 'list';
export type CategoryType = 'food' | 'shopping' | 'entertainment' | 'service' | 'travel' | 'all';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CouponActivity {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  threshold: number;
  status: CouponStatus;
  startTime: string;
  endTime: string;
  description: string;
  applicableMerchants: string[];
  useRules: string[];
  category: string;
  district: string;
}

export interface CouponInstance {
  id: string;
  activityId: string;
  code: string;
  status: CouponStatus;
  issuedAt: string;
  expiresAt: string;
  usedAt?: string;
  activity: CouponActivity;
  merchantId: string;
  merchantName?: string;
  type: CouponType;
  value: number;
  threshold?: number;
  validStart: string;
  validEnd: string;
  district?: string;
  claimLimit?: number;
  totalClaimed?: number;
  totalUsed?: number;
  redemptionRate?: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  district: string;
  address: string;
  location: GeoLocation;
  contactPhone: string;
  businessHours: string;
  rating: number;
  imageUrl: string;
  distance?: number;
  couponCount: number;
  description: string;
}

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  activityId?: string;
}

export interface CategoryItem {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
}

export interface RecommendedCoupon {
  activityId: string;
  activity: CouponActivity;
  score: number;
  reason: string;
  matchType: 'category' | 'district' | 'tier' | 'trending';
}

export interface VerificationRecord {
  id: string;
  activityId: string;
  couponCode: string;
  merchantName: string;
  originalAmount: number;
  discountAmount: number;
  amount: number;
  verifiedAt: string;
  status: 'success' | 'failed' | 'reversed';
  activity: CouponActivity;
}

export interface UserProfile {
  userId: string;
  realName: string;
  phone: string;
  idCard?: string;
  isVerified: boolean;
  avatarUrl?: string;
  totalCoupons: number;
  usedCoupons: number;
  totalSaved: number;
  consumptionTier: 'low' | 'medium' | 'high';
  preferredCategories: string[];
  preferredDistricts: string[];
}

export interface AppState {
  user: UserProfile | null;
  coupons: CouponInstance[];
  merchants: Merchant[];
  banners: BannerItem[];
  recommendedCoupons: RecommendedCoupon[];
  verificationHistory: VerificationRecord[];
  activeTab: TabType;
  mapViewType: MapViewType;
  selectedCategory: CategoryType;
  selectedDistrict: string;
}
