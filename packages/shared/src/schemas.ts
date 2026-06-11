import { z } from 'zod';
import {
  UserGender,
  UserRole,
  PetType,
  PetGender,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PostType,
  PostStatus,
  ConsultationStatus,
  AdoptionStatus,
  MembershipCardType,
  FlashSaleStatus,
  TrialStatus,
  ReviewStatus,
  DoctorStatus,
  ContentAuditStatus,
  RelationshipType,
  ActivityType,
  MerchantStatus,
} from './enums';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const listQuerySchema = paginationSchema.extend({
  keyword: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确');

export const emailSchema = z.string().email('邮箱格式不正确').optional();

export const passwordSchema = z
  .string()
  .min(8, '密码长度不能小于8位')
  .max(32, '密码长度不能大于32位')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/, '密码必须包含大小写字母和数字');

export const smsCodeSchema = z.string().length(6, '验证码必须是6位数字').regex(/^\d+$/, '验证码必须是数字');

export const userRegisterSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  nickname: z.string().min(2, '昵称长度不能小于2位').max(20, '昵称长度不能大于20位'),
  smsCode: smsCodeSchema,
  inviteCode: z.string().optional(),
});

export const userLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6).max(32),
});

export const userProfileUpdateSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  avatar: z.string().url().optional(),
  gender: z.nativeEnum(UserGender).optional(),
  birthday: z.coerce.date().optional(),
  email: emailSchema,
});

export const petCreateSchema = z.object({
  name: z.string().min(1).max(20),
  type: z.nativeEnum(PetType),
  breed: z.string().optional(),
  gender: z.nativeEnum(PetGender),
  birthday: z.coerce.date().optional(),
  weight: z.number().positive().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  isNeutered: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const petUpdateSchema = petCreateSchema.partial();

export const productAttributeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(50),
  values: z.array(z.string()).min(1),
  isVariant: z.boolean().default(false),
});

export const productSkuCreateSchema = z.object({
  skuCode: z.string().min(1).max(50),
  attributes: z.record(z.string(), z.string()),
  price: z.number().min(0),
  originalPrice: z.number().min(0),
  cost: z.number().min(0),
  stock: z.number().int().min(0),
  weight: z.number().min(0).default(0),
  barcode: z.string().optional(),
  image: z.string().url().optional(),
  status: z.enum(['active', 'disabled']).default('active'),
});

export const productSpuCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  description: z.string().min(1),
  mainImage: z.string().url(),
  images: z.array(z.string().url()).min(1),
  videos: z.array(z.string().url()).optional(),
  attributes: z.array(productAttributeSchema).default([]),
  skus: z.array(productSkuCreateSchema).min(1),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
});

export const productSpuUpdateSchema = productSpuCreateSchema.partial().extend({
  skus: z
    .array(
      productSkuCreateSchema.extend({
        id: z.string().optional(),
      })
    )
    .optional(),
});

export const orderAddressSchema = z.object({
  name: z.string().min(1).max(50),
  phone: phoneSchema,
  province: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  detail: z.string().min(1),
  postalCode: z.string().optional(),
});

export const invoiceInfoSchema = z.object({
  type: z.enum(['personal', 'company']),
  title: z.string().min(1),
  taxNo: z.string().optional(),
  email: emailSchema,
  content: z.string().min(1),
});

export const orderItemSchema = z.object({
  skuId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const orderCreateSchema = z.object({
  merchantId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  shippingAddress: orderAddressSchema,
  couponId: z.string().optional(),
  pointUsed: z.number().int().min(0).default(0),
  invoiceInfo: invoiceInfoSchema.optional(),
  remark: z.string().max(500).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

export const orderUpdateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  remark: z.string().optional(),
});

export const flashSaleItemSchema = z.object({
  skuId: z.string().min(1),
  spuId: z.string().min(1),
  salePrice: z.number().min(0),
  originalPrice: z.number().min(0),
  saleStock: z.number().int().min(1),
  limitPerUser: z.number().int().min(1).default(1),
  sortOrder: z.number().int().default(0),
});

export const flashSaleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  bannerImage: z.string().url().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  items: z.array(flashSaleItemSchema).min(1),
  status: z.nativeEnum(FlashSaleStatus).default(FlashSaleStatus.DRAFT),
});

export const flashSaleUpdateSchema = flashSaleCreateSchema.partial().extend({
  items: z
    .array(
      flashSaleItemSchema.extend({
        id: z.string().optional(),
      })
    )
    .optional(),
});

export const membershipCardPurchaseSchema = z.object({
  cardType: z.nativeEnum(MembershipCardType),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export const trialApplicationSchema = z.object({
  trialId: z.string().min(1),
  petId: z.string().optional(),
  reason: z.string().min(10).max(1000),
  experience: z.string().max(2000).optional(),
});

export const trialStatusUpdateSchema = z.object({
  status: z.nativeEnum(TrialStatus),
  reason: z.string().optional(),
});

export const productReviewCreateSchema = z.object({
  orderItemId: z.string().min(1),
  spuId: z.string().min(1),
  skuId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(5000),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  gifs: z.array(z.string().url()).optional(),
  isTrial: z.boolean().default(false),
});

export const productReviewUpdateStatusSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
  reason: z.string().optional(),
});

export const postCreateSchema = z.object({
  type: z.nativeEnum(PostType),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  gifs: z.array(z.string().url()).optional(),
  topicIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  status: z.nativeEnum(PostStatus).default(PostStatus.PENDING_REVIEW),
});

export const postUpdateSchema = postCreateSchema.partial();

export const commentCreateSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().optional(),
  replyToUserId: z.string().optional(),
  content: z.string().min(1).max(2000),
  images: z.array(z.string().url()).optional(),
});

export const topicCreateSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  coverImage: z.string().url().optional(),
  icon: z.string().optional(),
  category: z.enum(['discussion', 'health', 'nutrition', 'training', 'life', 'adoption', 'other']),
  isHot: z.boolean().default(false),
  isOfficial: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const doctorVerifySchema = z.object({
  realName: z.string().min(1).max(50),
  title: z.string().min(1).max(50),
  department: z.string().min(1).max(100),
  hospital: z.string().min(1).max(200),
  yearsOfExperience: z.number().int().min(0).max(60),
  specialties: z.array(z.string()).min(1),
  education: z.array(
    z.object({
      school: z.string().min(1),
      degree: z.string().min(1),
      major: z.string().min(1),
      startYear: z.number().int(),
      endYear: z.number().int(),
    })
  ),
  certificates: z.array(z.string().url()).optional(),
  licenseNumber: z.string().min(1),
  licenseImage: z.string().url(),
  introduction: z.string().min(10).max(2000),
  consultationFee: z.number().min(0),
});

export const doctorStatusUpdateSchema = z.object({
  status: z.nativeEnum(DoctorStatus),
  reason: z.string().optional(),
});

export const consultationCreateSchema = z.object({
  doctorId: z.string().min(1),
  petId: z.string().optional(),
  type: z.enum(['text', 'voice', 'video']),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  images: z.array(z.string().url()).optional(),
});

export const consultationMessageSchema = z.object({
  consultationId: z.string().min(1),
  type: z.enum(['text', 'image', 'voice', 'video', 'file']),
  content: z.string().min(1),
  duration: z.number().int().positive().optional(),
});

export const consultationStatusUpdateSchema = z.object({
  status: z.nativeEnum(ConsultationStatus),
  reason: z.string().optional(),
});

export const consultationRecordSchema = z.object({
  consultationId: z.string().min(1),
  diagnosis: z.string().min(1).max(5000),
  prescription: z.string().max(5000).optional(),
  suggestions: z.string().max(5000).optional(),
  followUpDate: z.coerce.date().optional(),
  attachments: z.array(z.string().url()).optional(),
});

export const adoptionPostCreateSchema = z.object({
  petType: z.nativeEnum(PetType),
  petName: z.string().min(1).max(50),
  petAge: z.number().positive().optional(),
  petGender: z.nativeEnum(PetGender),
  breed: z.string().optional(),
  vaccinated: z.boolean().default(false),
  neutered: z.boolean().default(false),
  healthCondition: z.string().min(1).max(2000),
  location: z.string().min(1).max(200),
  adoptionType: z.enum(['free', 'fee']),
  adoptionFee: z.number().min(0).optional(),
  requirements: z.array(z.string()).default([]),
  contactInfo: z.string().min(1).max(200),
  postContent: z.string().min(10).max(10000),
  images: z.array(z.string().url()).optional(),
});

export const adoptionStatusUpdateSchema = z.object({
  status: z.nativeEnum(AdoptionStatus),
  reason: z.string().optional(),
});

export const adoptionApplicationSchema = z.object({
  adoptionPostId: z.string().min(1),
  experience: z.string().min(10).max(2000),
  livingCondition: z.string().min(10).max(2000),
  familyMembers: z.number().int().min(1),
  hasOtherPets: z.boolean().default(false),
  otherPetsInfo: z.string().optional(),
  monthlyBudget: z.number().min(0),
  reason: z.string().min(10).max(2000),
  contactInfo: z.string().min(1).max(200),
});

export const relationshipSchema = z.object({
  followingId: z.string().min(1),
  type: z.nativeEnum(RelationshipType),
  remark: z.string().max(50).optional(),
});

export const activityPrizeSchema = z.object({
  name: z.string().min(1).max(100),
  image: z.string().url().optional(),
  type: z.enum(['coupon', 'product', 'point', 'balance']),
  value: z.number().min(0),
  quantity: z.number().int().min(1),
  probability: z.number().min(0).max(1),
  sortOrder: z.number().int().default(0),
});

export const activityEventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  coverImage: z.string().url().optional(),
  type: z.enum(['sign_in', 'post', 'like', 'comment', 'share', 'task', 'lottery']),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  maxParticipants: z.number().int().positive().optional(),
  prizes: z.array(activityPrizeSchema).default([]),
  rules: z.array(z.string()).default([]),
  isHot: z.boolean().default(false),
});

export const activityParticipateSchema = z.object({
  activityId: z.string().min(1),
});

export const merchantApplySchema = z.object({
  name: z.string().min(1).max(200),
  businessLicense: z.string().min(1).max(100),
  businessLicenseImage: z.string().url(),
  legalPersonName: z.string().min(1).max(50),
  legalPersonIdCard: z.string().min(1).max(50),
  legalPersonIdCardImage: z.string().url(),
  contactName: z.string().min(1).max(50),
  contactPhone: phoneSchema,
  contactEmail: emailSchema,
  category: z.array(z.string()).min(1),
  brandName: z.string().optional(),
  logo: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
});

export const merchantStatusUpdateSchema = z.object({
  status: z.nativeEnum(MerchantStatus),
  reason: z.string().optional(),
});

export const contentAuditSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(['post', 'comment', 'review', 'product', 'merchant', 'doctor']),
  status: z.nativeEnum(ContentAuditStatus),
  reason: z.string().optional(),
  operation: z.enum(['approve', 'reject', 'flag', 'remove', 'restore']),
});

export const behaviorLogSchema = z.object({
  eventType: z.string().min(1),
  eventName: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).default({}),
  pageUrl: z.string().min(1),
  pageTitle: z.string().min(1),
  referrer: z.string().optional(),
  duration: z.number().int().positive().optional(),
});

export const userTagCreateSchema = z.object({
  tagCategory: z.enum(['consumption', 'behavior', 'preference', 'life_stage', 'other']),
  tagName: z.string().min(1).max(50),
  tagValue: z.string().optional(),
  weight: z.number().min(0).max(100).default(50),
});

export const petTagCreateSchema = z.object({
  petId: z.string().min(1),
  tagCategory: z.enum(['personality', 'habit', 'health', 'preference', 'other']),
  tagName: z.string().min(1).max(50),
  tagValue: z.string().optional(),
  weight: z.number().min(0).max(100).default(50),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type PetCreateInput = z.infer<typeof petCreateSchema>;
export type PetUpdateInput = z.infer<typeof petUpdateSchema>;
export type ProductSpuCreateInput = z.infer<typeof productSpuCreateSchema>;
export type ProductSpuUpdateInput = z.infer<typeof productSpuUpdateSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type FlashSaleCreateInput = z.infer<typeof flashSaleCreateSchema>;
export type ProductReviewCreateInput = z.infer<typeof productReviewCreateSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type DoctorVerifyInput = z.infer<typeof doctorVerifySchema>;
export type ConsultationCreateInput = z.infer<typeof consultationCreateSchema>;
export type AdoptionPostCreateInput = z.infer<typeof adoptionPostCreateSchema>;
export type AdoptionApplicationInput = z.infer<typeof adoptionApplicationSchema>;
export type ActivityEventCreateInput = z.infer<typeof activityEventCreateSchema>;
export type MerchantApplyInput = z.infer<typeof merchantApplySchema>;
