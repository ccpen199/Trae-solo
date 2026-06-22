export interface LocalServiceCoupon {
  id: string;
  externalId: string;
  provider: 'xiaohu_preferred';
  merchantId: string;
  merchantName: string;
  category: 'food' | 'entertainment' | 'fitness' | 'beauty' | 'travel' | 'other';
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  city: string;
  images: string[];
  validFrom: Date;
  validUntil: Date;
  stock: number;
  soldCount: number;
  averageRating: number;
  reviewCount: number;
  tags: string[];
  termsAndConditions: string;
}

export interface CouponOrder {
  id: string;
  userId: string;
  couponId: string;
  externalOrderId: string;
  activityId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  redemptionCode: string;
  redemptionStatus: 'pending' | 'redeemed' | 'expired' | 'refunded';
  redeemedAt?: Date;
  redeemedLocation?: string;
  syncedWithXiaohu: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface XiaohuSyncResult {
  success: boolean;
  externalOrderId?: string;
  status?: CouponOrder['redemptionStatus'];
  errorMessage?: string;
  syncedAt: Date;
}

export interface MerchantInfo {
  id: string;
  externalId: string;
  name: string;
  category: LocalServiceCoupon['category'];
  city: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  businessHours: string;
  averageRating: number;
  images: string[];
}
