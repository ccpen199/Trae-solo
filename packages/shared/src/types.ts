import type {
  UserRole,
  UserGender,
  PetType,
  PetGender,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingStatus,
  MembershipLevel,
  MembershipCardType,
  FlashSaleStatus,
  TrialStatus,
  PostType,
  PostStatus,
  ContentAuditStatus,
  ReviewStatus,
  DoctorStatus,
  ConsultationStatus,
  AdoptionStatus,
  RelationshipType,
  ActivityType,
  ActivityParticipationStatus,
  MerchantStatus,
} from './enums';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListQueryParams extends PaginationParams {
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  merchantId?: string;
  doctorId?: string;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  nickname: string;
  avatar?: string;
  gender: UserGender;
  birthday?: Date;
  role: UserRole;
  membershipLevel: MembershipLevel;
  membershipExpireAt?: Date;
  growthPoints: number;
  balance: number;
  point: number;
  isVerified: boolean;
  status: 'active' | 'disabled' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

export interface PetProfile {
  id: string;
  userId: string;
  name: string;
  type: PetType;
  breed?: string;
  gender: PetGender;
  birthday?: Date;
  weight?: number;
  avatar?: string;
  bio?: string;
  isNeutered: boolean;
  vaccineRecords?: PetVaccineRecord[];
  healthRecords?: PetHealthRecord[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PetVaccineRecord {
  id: string;
  petId: string;
  vaccineName: string;
  vaccineDate: Date;
  nextVaccineDate?: Date;
  hospitalName?: string;
  certificateImage?: string;
  notes?: string;
}

export interface PetHealthRecord {
  id: string;
  petId: string;
  recordType: 'examination' | 'surgery' | 'medication' | 'other';
  recordDate: Date;
  hospitalName?: string;
  doctorName?: string;
  diagnosis?: string;
  prescription?: string;
  images?: string[];
  notes?: string;
}

export interface ProductCategoryNode {
  id: string;
  name: string;
  code: string;
  icon?: string;
  level: number;
  parentId?: string;
  sortOrder: number;
  children?: ProductCategoryNode[];
}

export interface ProductAttribute {
  id: string;
  name: string;
  values: string[];
  isVariant: boolean;
}

export interface ProductSPU {
  id: string;
  merchantId: string;
  categoryId: string;
  name: string;
  subtitle?: string;
  description: string;
  mainImage: string;
  images: string[];
  videos?: string[];
  attributes: ProductAttribute[];
  status: ProductStatus;
  salesCount: number;
  reviewCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
  skus: ProductSKU[];
}

export interface ProductSKU {
  id: string;
  spuId: string;
  skuCode: string;
  attributes: Record<string, string>;
  price: number;
  originalPrice: number;
  cost: number;
  stock: number;
  stockLocked: number;
  weight: number;
  barcode?: string;
  image?: string;
  status: 'active' | 'disabled';
}

export interface CartItem {
  id: string;
  userId: string;
  skuId: string;
  quantity: number;
  selected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  merchantId: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  actualAmount: number;
  pointUsed: number;
  pointEarned: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  shippingStatus: ShippingStatus;
  trackingNo?: string;
  trackingCompany?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  shippingAddress: OrderAddress;
  items: OrderItem[];
  invoiceInfo?: InvoiceInfo;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  postalCode?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  skuId: string;
  productName: string;
  productImage: string;
  attributes: Record<string, string>;
  price: number;
  quantity: number;
  subtotal: number;
  isReviewed: boolean;
}

export interface InvoiceInfo {
  type: 'personal' | 'company';
  title: string;
  taxNo?: string;
  email: string;
  content: string;
}

export interface FlashSale {
  id: string;
  title: string;
  description?: string;
  bannerImage?: string;
  startTime: Date;
  endTime: Date;
  status: FlashSaleStatus;
  items: FlashSaleItem[];
  totalStock: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashSaleItem {
  id: string;
  flashSaleId: string;
  skuId: string;
  spuId: string;
  salePrice: number;
  originalPrice: number;
  saleStock: number;
  soldCount: number;
  limitPerUser: number;
  sortOrder: number;
}

export interface MembershipBenefit {
  level: MembershipLevel;
  minGrowthPoints: number;
  maxGrowthPoints: number;
  discountRate: number;
  pointMultiplier: number;
  freeShippingThreshold: number;
  monthlyCoupons: CouponTemplate[];
  exclusiveProducts: string[];
  customerServiceLevel: 'standard' | 'priority' | 'vip';
}

export interface MembershipCardPackage {
  id: string;
  type: MembershipCardType;
  name: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  benefits: string[];
  gifts: MembershipGift[];
  isHot: boolean;
  sortOrder: number;
  status: 'active' | 'disabled';
}

export interface MembershipGift {
  type: 'coupon' | 'point' | 'product' | 'balance';
  value: number;
  description: string;
  couponId?: string;
  skuId?: string;
}

export interface CouponTemplate {
  id: string;
  name: string;
  type: 'fixed' | 'percentage' | 'shipping';
  value: number;
  minAmount: number;
  maxDiscount?: number;
  scope: 'all' | 'category' | 'product';
  scopeIds?: string[];
  durationType: 'days' | 'fixed';
  durationDays?: number;
  validFrom?: Date;
  validTo?: Date;
  totalQuantity: number;
  receivedCount: number;
  usedCount: number;
  perUserLimit: number;
  status: 'active' | 'disabled' | 'expired';
}

export interface UserCoupon {
  id: string;
  userId: string;
  templateId: string;
  code: string;
  status: 'unused' | 'used' | 'expired' | 'frozen';
  receivedAt: Date;
  validFrom: Date;
  validTo: Date;
  usedAt?: Date;
  orderId?: string;
}

export interface ProductTrial {
  id: string;
  spuId: string;
  title: string;
  description: string;
  coverImage: string;
  totalQuantity: number;
  appliedCount: number;
  approvedCount: number;
  applicationStartTime: Date;
  applicationEndTime: Date;
  trialDurationDays: number;
  reviewDeadline: Date;
  status: TrialStatus;
  requirements: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrialApplication {
  id: string;
  trialId: string;
  userId: string;
  petId?: string;
  reason: string;
  experience?: string;
  status: TrialStatus;
  approvedAt?: Date;
  rejectedReason?: string;
  shippedAt?: Date;
  trackingNo?: string;
  trackingCompany?: string;
  deliveredAt?: Date;
  reviewId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductReview {
  id: string;
  orderItemId: string;
  userId: string;
  spuId: string;
  skuId: string;
  rating: number;
  content: string;
  images?: string[];
  videos?: string[];
  gifs?: string[];
  isTrial: boolean;
  status: ReviewStatus;
  helpfulCount: number;
  replyContent?: string;
  replyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  icon?: string;
  category: 'discussion' | 'health' | 'nutrition' | 'training' | 'life' | 'adoption' | 'other';
  postCount: number;
  followerCount: number;
  isHot: boolean;
  isOfficial: boolean;
  sortOrder: number;
  status: 'active' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  title?: string;
  content: string;
  images?: string[];
  videos?: string[];
  gifs?: string[];
  topicIds: string[];
  tags: string[];
  status: PostStatus;
  auditStatus: ContentAuditStatus;
  auditReason?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isTop: boolean;
  isHot: boolean;
  isEssence: boolean;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  replyToUserId?: string;
  content: string;
  images?: string[];
  status: 'normal' | 'hidden' | 'removed';
  likeCount: number;
  isAudited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  realName: string;
  avatar?: string;
  title: string;
  department: string;
  hospital: string;
  yearsOfExperience: number;
  specialties: string[];
  education: EducationRecord[];
  certificates: string[];
  licenseNumber: string;
  licenseImage: string;
  introduction: string;
  consultationFee: number;
  consultationCount: number;
  rating: number;
  reviewCount: number;
  status: DoctorStatus;
  isOnline: boolean;
  lastOnlineAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EducationRecord {
  school: string;
  degree: string;
  major: string;
  startYear: number;
  endYear: number;
}

export interface ConsultationOrder {
  id: string;
  orderNo: string;
  userId: string;
  doctorId: string;
  petId?: string;
  type: 'text' | 'voice' | 'video';
  title: string;
  description: string;
  images?: string[];
  fee: number;
  status: ConsultationStatus;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  rating?: number;
  reviewContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderRole: 'user' | 'doctor';
  type: 'text' | 'image' | 'voice' | 'video' | 'file';
  content: string;
  duration?: number;
  isRead: boolean;
  createdAt: Date;
}

export interface ConsultationRecord {
  id: string;
  consultationId: string;
  doctorId: string;
  diagnosis: string;
  prescription?: string;
  suggestions?: string;
  followUpDate?: Date;
  attachments?: string[];
  createdAt: Date;
}

export interface AdoptionPost {
  id: string;
  postId: string;
  userId: string;
  petType: PetType;
  petName: string;
  petAge?: number;
  petGender: PetGender;
  breed?: string;
  vaccinated: boolean;
  neutered: boolean;
  healthCondition: string;
  location: string;
  adoptionType: 'free' | 'fee';
  adoptionFee?: number;
  requirements: string[];
  contactInfo: string;
  status: AdoptionStatus;
  applicantCount: number;
  approvedApplicantId?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdoptionApplication {
  id: string;
  adoptionPostId: string;
  userId: string;
  experience: string;
  livingCondition: string;
  familyMembers: number;
  hasOtherPets: boolean;
  otherPetsInfo?: string;
  monthlyBudget: number;
  reason: string;
  contactInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: Date;
  reviewerId?: string;
  reviewReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRelationship {
  id: string;
  followerId: string;
  followingId: string;
  type: RelationshipType;
  remark?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  targetType: 'post' | 'comment' | 'user' | 'system';
  targetId?: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  type: 'sign_in' | 'post' | 'like' | 'comment' | 'share' | 'task' | 'lottery';
  startTime: Date;
  endTime: Date;
  participationCount: number;
  maxParticipants?: number;
  prizes: ActivityPrize[];
  rules: string[];
  isHot: boolean;
  status: 'draft' | 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityPrize {
  id: string;
  activityId: string;
  name: string;
  image?: string;
  type: 'coupon' | 'product' | 'point' | 'balance';
  value: number;
  quantity: number;
  wonCount: number;
  probability: number;
  sortOrder: number;
}

export interface ActivityParticipation {
  id: string;
  activityId: string;
  userId: string;
  status: ActivityParticipationStatus;
  participatedAt: Date;
  prizeId?: string;
  wonAt?: Date;
  shippingInfo?: OrderAddress;
  trackingNo?: string;
  trackingCompany?: string;
  prizeSentAt?: Date;
  prizeReceivedAt?: Date;
}

export interface UserBehaviorLog {
  id: string;
  userId?: string;
  anonymousId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, unknown>;
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  userAgent: string;
  ip?: string;
  location?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  sessionId: string;
  duration?: number;
  createdAt: Date;
}

export interface PetProfileTag {
  id: string;
  petId: string;
  tagCategory: 'personality' | 'habit' | 'health' | 'preference' | 'other';
  tagName: string;
  tagValue?: string;
  weight: number;
  source: 'manual' | 'auto' | 'behavior';
  lastUpdatedAt: Date;
  createdAt: Date;
}

export interface UserProfileTag {
  id: string;
  userId: string;
  tagCategory: 'consumption' | 'behavior' | 'preference' | 'life_stage' | 'other';
  tagName: string;
  tagValue?: string;
  weight: number;
  source: 'manual' | 'auto' | 'behavior';
  lastUpdatedAt: Date;
  createdAt: Date;
}

export interface Merchant {
  id: string;
  userId: string;
  name: string;
  businessLicense: string;
  businessLicenseImage: string;
  legalPersonName: string;
  legalPersonIdCard: string;
  legalPersonIdCardImage: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  category: string[];
  brandName?: string;
  logo?: string;
  description?: string;
  address?: string;
  status: MerchantStatus;
  verifiedAt?: Date;
  rejectReason?: string;
  rating: number;
  salesCount: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentAuditLog {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'review' | 'product' | 'merchant' | 'doctor';
  auditorId?: string;
  status: ContentAuditStatus;
  reason?: string;
  operation: string;
  autoAuditResult?: Record<string, unknown>;
  createdAt: Date;
}
