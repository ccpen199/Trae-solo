
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  phone: 'phone',
  email: 'email',
  password: 'password',
  nickname: 'nickname',
  avatar: 'avatar',
  gender: 'gender',
  birthday: 'birthday',
  role: 'role',
  membershipLevel: 'membershipLevel',
  membershipExpireAt: 'membershipExpireAt',
  growthPoints: 'growthPoints',
  balance: 'balance',
  point: 'point',
  isVerified: 'isVerified',
  status: 'status',
  lastLoginAt: 'lastLoginAt',
  lastLoginIp: 'lastLoginIp',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PetProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  type: 'type',
  breed: 'breed',
  gender: 'gender',
  birthday: 'birthday',
  weight: 'weight',
  avatar: 'avatar',
  bio: 'bio',
  isNeutered: 'isNeutered',
  tags: 'tags',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PetVaccineRecordScalarFieldEnum = {
  id: 'id',
  petId: 'petId',
  vaccineName: 'vaccineName',
  vaccineDate: 'vaccineDate',
  nextVaccineDate: 'nextVaccineDate',
  hospitalName: 'hospitalName',
  certificateImage: 'certificateImage',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PetHealthRecordScalarFieldEnum = {
  id: 'id',
  petId: 'petId',
  recordType: 'recordType',
  recordDate: 'recordDate',
  hospitalName: 'hospitalName',
  doctorName: 'doctorName',
  diagnosis: 'diagnosis',
  prescription: 'prescription',
  images: 'images',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserAddressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  phone: 'phone',
  province: 'province',
  city: 'city',
  district: 'district',
  detail: 'detail',
  postalCode: 'postalCode',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  icon: 'icon',
  level: 'level',
  parentId: 'parentId',
  sortOrder: 'sortOrder',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductAttributeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  values: 'values',
  isVariant: 'isVariant',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  spuId: 'spuId'
};

exports.Prisma.ProductSPUScalarFieldEnum = {
  id: 'id',
  merchantId: 'merchantId',
  categoryId: 'categoryId',
  name: 'name',
  subtitle: 'subtitle',
  description: 'description',
  mainImage: 'mainImage',
  images: 'images',
  videos: 'videos',
  status: 'status',
  salesCount: 'salesCount',
  reviewCount: 'reviewCount',
  rating: 'rating',
  auditReason: 'auditReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductSKUScalarFieldEnum = {
  id: 'id',
  spuId: 'spuId',
  skuCode: 'skuCode',
  attributes: 'attributes',
  price: 'price',
  originalPrice: 'originalPrice',
  cost: 'cost',
  stock: 'stock',
  stockLocked: 'stockLocked',
  weight: 'weight',
  barcode: 'barcode',
  image: 'image',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  skuId: 'skuId',
  quantity: 'quantity',
  selected: 'selected',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  orderNo: 'orderNo',
  userId: 'userId',
  merchantId: 'merchantId',
  status: 'status',
  totalAmount: 'totalAmount',
  discountAmount: 'discountAmount',
  shippingFee: 'shippingFee',
  actualAmount: 'actualAmount',
  pointUsed: 'pointUsed',
  pointEarned: 'pointEarned',
  paymentMethod: 'paymentMethod',
  paymentStatus: 'paymentStatus',
  paidAt: 'paidAt',
  shippingStatus: 'shippingStatus',
  trackingNo: 'trackingNo',
  trackingCompany: 'trackingCompany',
  shippedAt: 'shippedAt',
  deliveredAt: 'deliveredAt',
  completedAt: 'completedAt',
  cancelledAt: 'cancelledAt',
  cancelReason: 'cancelReason',
  shippingAddress: 'shippingAddress',
  invoiceInfo: 'invoiceInfo',
  remark: 'remark',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  couponId: 'couponId'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  skuId: 'skuId',
  spuId: 'spuId',
  productName: 'productName',
  productImage: 'productImage',
  attributes: 'attributes',
  price: 'price',
  quantity: 'quantity',
  subtotal: 'subtotal',
  isReviewed: 'isReviewed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentRecordScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  paymentNo: 'paymentNo',
  method: 'method',
  amount: 'amount',
  status: 'status',
  transactionId: 'transactionId',
  paidAt: 'paidAt',
  failedReason: 'failedReason',
  refundAmount: 'refundAmount',
  refundAt: 'refundAt',
  refundReason: 'refundReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShippingLogScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  trackingNo: 'trackingNo',
  trackingCompany: 'trackingCompany',
  status: 'status',
  location: 'location',
  description: 'description',
  eventTime: 'eventTime',
  createdAt: 'createdAt'
};

exports.Prisma.FlashSaleScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  bannerImage: 'bannerImage',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  totalStock: 'totalStock',
  soldCount: 'soldCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FlashSaleItemScalarFieldEnum = {
  id: 'id',
  flashSaleId: 'flashSaleId',
  skuId: 'skuId',
  spuId: 'spuId',
  salePrice: 'salePrice',
  originalPrice: 'originalPrice',
  saleStock: 'saleStock',
  soldCount: 'soldCount',
  limitPerUser: 'limitPerUser',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CouponTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  value: 'value',
  minAmount: 'minAmount',
  maxDiscount: 'maxDiscount',
  scope: 'scope',
  scopeIds: 'scopeIds',
  durationType: 'durationType',
  durationDays: 'durationDays',
  validFrom: 'validFrom',
  validTo: 'validTo',
  totalQuantity: 'totalQuantity',
  receivedCount: 'receivedCount',
  usedCount: 'usedCount',
  perUserLimit: 'perUserLimit',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserCouponScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  templateId: 'templateId',
  code: 'code',
  status: 'status',
  receivedAt: 'receivedAt',
  validFrom: 'validFrom',
  validTo: 'validTo',
  usedAt: 'usedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MembershipCardScalarFieldEnum = {
  id: 'id',
  type: 'type',
  name: 'name',
  price: 'price',
  originalPrice: 'originalPrice',
  durationDays: 'durationDays',
  benefits: 'benefits',
  gifts: 'gifts',
  isHot: 'isHot',
  sortOrder: 'sortOrder',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MembershipPurchaseScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  cardId: 'cardId',
  orderNo: 'orderNo',
  amount: 'amount',
  paidAt: 'paidAt',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductTrialScalarFieldEnum = {
  id: 'id',
  spuId: 'spuId',
  title: 'title',
  description: 'description',
  coverImage: 'coverImage',
  totalQuantity: 'totalQuantity',
  appliedCount: 'appliedCount',
  approvedCount: 'approvedCount',
  applicationStartTime: 'applicationStartTime',
  applicationEndTime: 'applicationEndTime',
  trialDurationDays: 'trialDurationDays',
  reviewDeadline: 'reviewDeadline',
  status: 'status',
  requirements: 'requirements',
  tags: 'tags',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrialApplicationScalarFieldEnum = {
  id: 'id',
  trialId: 'trialId',
  userId: 'userId',
  petId: 'petId',
  reason: 'reason',
  experience: 'experience',
  status: 'status',
  approvedAt: 'approvedAt',
  rejectedReason: 'rejectedReason',
  shippedAt: 'shippedAt',
  trackingNo: 'trackingNo',
  trackingCompany: 'trackingCompany',
  deliveredAt: 'deliveredAt',
  reviewId: 'reviewId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductReviewScalarFieldEnum = {
  id: 'id',
  orderItemId: 'orderItemId',
  userId: 'userId',
  spuId: 'spuId',
  skuId: 'skuId',
  rating: 'rating',
  content: 'content',
  images: 'images',
  videos: 'videos',
  gifs: 'gifs',
  isTrial: 'isTrial',
  status: 'status',
  helpfulCount: 'helpfulCount',
  replyContent: 'replyContent',
  replyAt: 'replyAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewHelpfulScalarFieldEnum = {
  id: 'id',
  reviewId: 'reviewId',
  userId: 'userId',
  isHelpful: 'isHelpful',
  createdAt: 'createdAt'
};

exports.Prisma.TopicScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  coverImage: 'coverImage',
  icon: 'icon',
  category: 'category',
  postCount: 'postCount',
  followerCount: 'followerCount',
  isHot: 'isHot',
  isOfficial: 'isOfficial',
  sortOrder: 'sortOrder',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TopicFollowerScalarFieldEnum = {
  id: 'id',
  topicId: 'topicId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  content: 'content',
  images: 'images',
  videos: 'videos',
  gifs: 'gifs',
  tags: 'tags',
  status: 'status',
  auditStatus: 'auditStatus',
  auditReason: 'auditReason',
  viewCount: 'viewCount',
  likeCount: 'likeCount',
  commentCount: 'commentCount',
  shareCount: 'shareCount',
  isTop: 'isTop',
  isHot: 'isHot',
  isEssence: 'isEssence',
  location: 'location',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  userId: 'userId',
  parentId: 'parentId',
  replyToUserId: 'replyToUserId',
  content: 'content',
  images: 'images',
  status: 'status',
  likeCount: 'likeCount',
  isAudited: 'isAudited',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LikeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  targetId: 'targetId',
  targetType: 'targetType',
  postId: 'postId',
  commentId: 'commentId',
  createdAt: 'createdAt'
};

exports.Prisma.ShareScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  postId: 'postId',
  platform: 'platform',
  createdAt: 'createdAt'
};

exports.Prisma.DoctorProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  realName: 'realName',
  avatar: 'avatar',
  title: 'title',
  department: 'department',
  hospital: 'hospital',
  yearsOfExperience: 'yearsOfExperience',
  specialties: 'specialties',
  education: 'education',
  certificates: 'certificates',
  licenseNumber: 'licenseNumber',
  licenseImage: 'licenseImage',
  introduction: 'introduction',
  consultationFee: 'consultationFee',
  consultationCount: 'consultationCount',
  rating: 'rating',
  reviewCount: 'reviewCount',
  status: 'status',
  isOnline: 'isOnline',
  lastOnlineAt: 'lastOnlineAt',
  verifiedAt: 'verifiedAt',
  rejectReason: 'rejectReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConsultationOrderScalarFieldEnum = {
  id: 'id',
  orderNo: 'orderNo',
  userId: 'userId',
  doctorId: 'doctorId',
  petId: 'petId',
  type: 'type',
  title: 'title',
  description: 'description',
  images: 'images',
  fee: 'fee',
  status: 'status',
  paymentStatus: 'paymentStatus',
  paidAt: 'paidAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  cancelledAt: 'cancelledAt',
  cancelReason: 'cancelReason',
  rating: 'rating',
  reviewContent: 'reviewContent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConsultationMessageScalarFieldEnum = {
  id: 'id',
  consultationId: 'consultationId',
  senderId: 'senderId',
  senderRole: 'senderRole',
  type: 'type',
  content: 'content',
  duration: 'duration',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.ConsultationRecordScalarFieldEnum = {
  id: 'id',
  consultationId: 'consultationId',
  doctorId: 'doctorId',
  diagnosis: 'diagnosis',
  prescription: 'prescription',
  suggestions: 'suggestions',
  followUpDate: 'followUpDate',
  attachments: 'attachments',
  createdAt: 'createdAt'
};

exports.Prisma.AdoptionPostScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  userId: 'userId',
  petType: 'petType',
  petName: 'petName',
  petAge: 'petAge',
  petGender: 'petGender',
  breed: 'breed',
  vaccinated: 'vaccinated',
  neutered: 'neutered',
  healthCondition: 'healthCondition',
  location: 'location',
  adoptionType: 'adoptionType',
  adoptionFee: 'adoptionFee',
  requirements: 'requirements',
  contactInfo: 'contactInfo',
  status: 'status',
  applicantCount: 'applicantCount',
  approvedApplicantId: 'approvedApplicantId',
  closedAt: 'closedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AdoptionApplicationScalarFieldEnum = {
  id: 'id',
  adoptionPostId: 'adoptionPostId',
  userId: 'userId',
  experience: 'experience',
  livingCondition: 'livingCondition',
  familyMembers: 'familyMembers',
  hasOtherPets: 'hasOtherPets',
  otherPetsInfo: 'otherPetsInfo',
  monthlyBudget: 'monthlyBudget',
  reason: 'reason',
  contactInfo: 'contactInfo',
  status: 'status',
  reviewedAt: 'reviewedAt',
  reviewerId: 'reviewerId',
  reviewReason: 'reviewReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserRelationshipScalarFieldEnum = {
  id: 'id',
  followerId: 'followerId',
  followingId: 'followingId',
  type: 'type',
  remark: 'remark',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  targetType: 'targetType',
  targetId: 'targetId',
  content: 'content',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityEventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  coverImage: 'coverImage',
  type: 'type',
  startTime: 'startTime',
  endTime: 'endTime',
  participationCount: 'participationCount',
  maxParticipants: 'maxParticipants',
  prizes: 'prizes',
  rules: 'rules',
  isHot: 'isHot',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ActivityParticipationScalarFieldEnum = {
  id: 'id',
  activityId: 'activityId',
  userId: 'userId',
  status: 'status',
  participatedAt: 'participatedAt',
  prizeId: 'prizeId',
  wonAt: 'wonAt',
  shippingInfo: 'shippingInfo',
  trackingNo: 'trackingNo',
  trackingCompany: 'trackingCompany',
  prizeSentAt: 'prizeSentAt',
  prizeReceivedAt: 'prizeReceivedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MerchantScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  businessLicense: 'businessLicense',
  businessLicenseImage: 'businessLicenseImage',
  legalPersonName: 'legalPersonName',
  legalPersonIdCard: 'legalPersonIdCard',
  legalPersonIdCardImage: 'legalPersonIdCardImage',
  contactName: 'contactName',
  contactPhone: 'contactPhone',
  contactEmail: 'contactEmail',
  category: 'category',
  brandName: 'brandName',
  logo: 'logo',
  description: 'description',
  address: 'address',
  status: 'status',
  verifiedAt: 'verifiedAt',
  rejectReason: 'rejectReason',
  rating: 'rating',
  salesCount: 'salesCount',
  reviewCount: 'reviewCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContentAuditLogScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  contentType: 'contentType',
  auditorId: 'auditorId',
  status: 'status',
  reason: 'reason',
  operation: 'operation',
  autoAuditResult: 'autoAuditResult',
  createdAt: 'createdAt',
  postId: 'postId',
  merchantId: 'merchantId',
  doctorId: 'doctorId'
};

exports.Prisma.UserBehaviorLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  anonymousId: 'anonymousId',
  eventType: 'eventType',
  eventName: 'eventName',
  properties: 'properties',
  pageUrl: 'pageUrl',
  pageTitle: 'pageTitle',
  referrer: 'referrer',
  userAgent: 'userAgent',
  ip: 'ip',
  location: 'location',
  deviceType: 'deviceType',
  os: 'os',
  browser: 'browser',
  sessionId: 'sessionId',
  duration: 'duration',
  createdAt: 'createdAt'
};

exports.Prisma.UserProfileTagScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tagCategory: 'tagCategory',
  tagName: 'tagName',
  tagValue: 'tagValue',
  weight: 'weight',
  source: 'source',
  lastUpdatedAt: 'lastUpdatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.PetProfileTagScalarFieldEnum = {
  id: 'id',
  petId: 'petId',
  tagCategory: 'tagCategory',
  tagName: 'tagName',
  tagValue: 'tagValue',
  weight: 'weight',
  source: 'source',
  lastUpdatedAt: 'lastUpdatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SystemConfigScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  type: 'type',
  group: 'group',
  isPublic: 'isPublic',
  remark: 'remark',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserGender = exports.$Enums.UserGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  UNKNOWN: 'UNKNOWN'
};

exports.UserRole = exports.$Enums.UserRole = {
  CUSTOMER: 'CUSTOMER',
  MERCHANT: 'MERCHANT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

exports.MembershipLevel = exports.$Enums.MembershipLevel = {
  NORMAL: 'NORMAL',
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
  DIAMOND: 'DIAMOND'
};

exports.UserStatus = exports.$Enums.UserStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  BANNED: 'BANNED'
};

exports.PetType = exports.$Enums.PetType = {
  CAT: 'CAT',
  DOG: 'DOG',
  FISH: 'FISH',
  BIRD: 'BIRD',
  HAMSTER: 'HAMSTER',
  RABBIT: 'RABBIT',
  REPTILE: 'REPTILE',
  OTHER: 'OTHER'
};

exports.PetGender = exports.$Enums.PetGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  UNKNOWN: 'UNKNOWN'
};

exports.ProductStatus = exports.$Enums.ProductStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  ON_SALE: 'ON_SALE',
  OFF_SALE: 'OFF_SALE',
  REJECTED: 'REJECTED'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING_CONFIRM: 'PENDING_CONFIRM',
  PENDING_SHIPMENT: 'PENDING_SHIPMENT',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDING: 'REFUNDING',
  REFUNDED: 'REFUNDED'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  ALIPAY: 'ALIPAY',
  WECHAT: 'WECHAT',
  BALANCE: 'BALANCE'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.ShippingStatus = exports.$Enums.ShippingStatus = {
  PENDING: 'PENDING',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED'
};

exports.FlashSaleStatus = exports.$Enums.FlashSaleStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED'
};

exports.MembershipCardType = exports.$Enums.MembershipCardType = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
  LIFETIME: 'LIFETIME'
};

exports.TrialStatus = exports.$Enums.TrialStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  REVIEWED: 'REVIEWED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED'
};

exports.ReviewStatus = exports.$Enums.ReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  HIDDEN: 'HIDDEN'
};

exports.PostType = exports.$Enums.PostType = {
  DISCUSSION: 'DISCUSSION',
  QUESTION: 'QUESTION',
  REVIEW: 'REVIEW',
  ADOPTION: 'ADOPTION',
  RESCUE: 'RESCUE',
  MOMENT: 'MOMENT'
};

exports.PostStatus = exports.$Enums.PostStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  REMOVED: 'REMOVED'
};

exports.ContentAuditStatus = exports.$Enums.ContentAuditStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FLAGGED: 'FLAGGED'
};

exports.DoctorStatus = exports.$Enums.DoctorStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED'
};

exports.ConsultationStatus = exports.$Enums.ConsultationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

exports.AdoptionStatus = exports.$Enums.AdoptionStatus = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  ADOPTED: 'ADOPTED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
};

exports.RelationshipType = exports.$Enums.RelationshipType = {
  FOLLOW: 'FOLLOW',
  BLOCK: 'BLOCK',
  FRIEND: 'FRIEND'
};

exports.ActivityType = exports.$Enums.ActivityType = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  SHARE: 'SHARE',
  FOLLOW: 'FOLLOW',
  MENTION: 'MENTION',
  SYSTEM: 'SYSTEM'
};

exports.ActivityParticipationStatus = exports.$Enums.ActivityParticipationStatus = {
  NOT_PARTICIPATED: 'NOT_PARTICIPATED',
  PARTICIPATED: 'PARTICIPATED',
  WON: 'WON',
  PRIZE_SENT: 'PRIZE_SENT',
  PRIZE_RECEIVED: 'PRIZE_RECEIVED'
};

exports.MerchantStatus = exports.$Enums.MerchantStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED'
};

exports.Prisma.ModelName = {
  User: 'User',
  PetProfile: 'PetProfile',
  PetVaccineRecord: 'PetVaccineRecord',
  PetHealthRecord: 'PetHealthRecord',
  UserAddress: 'UserAddress',
  ProductCategory: 'ProductCategory',
  ProductAttribute: 'ProductAttribute',
  ProductSPU: 'ProductSPU',
  ProductSKU: 'ProductSKU',
  CartItem: 'CartItem',
  Order: 'Order',
  OrderItem: 'OrderItem',
  PaymentRecord: 'PaymentRecord',
  ShippingLog: 'ShippingLog',
  FlashSale: 'FlashSale',
  FlashSaleItem: 'FlashSaleItem',
  CouponTemplate: 'CouponTemplate',
  UserCoupon: 'UserCoupon',
  MembershipCard: 'MembershipCard',
  MembershipPurchase: 'MembershipPurchase',
  ProductTrial: 'ProductTrial',
  TrialApplication: 'TrialApplication',
  ProductReview: 'ProductReview',
  ReviewHelpful: 'ReviewHelpful',
  Topic: 'Topic',
  TopicFollower: 'TopicFollower',
  Post: 'Post',
  Comment: 'Comment',
  Like: 'Like',
  Share: 'Share',
  DoctorProfile: 'DoctorProfile',
  ConsultationOrder: 'ConsultationOrder',
  ConsultationMessage: 'ConsultationMessage',
  ConsultationRecord: 'ConsultationRecord',
  AdoptionPost: 'AdoptionPost',
  AdoptionApplication: 'AdoptionApplication',
  UserRelationship: 'UserRelationship',
  Activity: 'Activity',
  ActivityEvent: 'ActivityEvent',
  ActivityParticipation: 'ActivityParticipation',
  Merchant: 'Merchant',
  ContentAuditLog: 'ContentAuditLog',
  UserBehaviorLog: 'UserBehaviorLog',
  UserProfileTag: 'UserProfileTag',
  PetProfileTag: 'PetProfileTag',
  SystemConfig: 'SystemConfig'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
