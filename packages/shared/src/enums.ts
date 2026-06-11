export enum UserRole {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum PetType {
  CAT = 'cat',
  DOG = 'dog',
  FISH = 'fish',
  BIRD = 'bird',
  HAMSTER = 'hamster',
  RABBIT = 'rabbit',
  REPTILE = 'reptile',
  OTHER = 'other',
}

export enum PetGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum ProductCategory {
  CAT_FOOD = 'cat_food',
  DOG_FOOD = 'dog_food',
  AQUARIUM = 'aquarium',
  GROOMING = 'grooming',
  MEDICAL = 'medical',
  TOY = 'toy',
}

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ON_SALE = 'on_sale',
  OFF_SALE = 'off_sale',
  REJECTED = 'rejected',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_CONFIRM = 'pending_confirm',
  PENDING_SHIPMENT = 'pending_shipment',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BALANCE = 'balance',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum ShippingStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum MembershipLevel {
  NORMAL = 'normal',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum MembershipCardType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

export enum FlashSaleStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum TrialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  REVIEWED = 'reviewed',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum PostType {
  DISCUSSION = 'discussion',
  QUESTION = 'question',
  REVIEW = 'review',
  ADOPTION = 'adoption',
  RESCUE = 'rescue',
  MOMENT = 'moment',
}

export enum PostStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  REMOVED = 'removed',
}

export enum ContentAuditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  HIDDEN = 'hidden',
}

export enum DoctorStatus {
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum ConsultationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum AdoptionStatus {
  OPEN = 'open',
  PENDING = 'pending',
  ADOPTED = 'adopted',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum RelationshipType {
  FOLLOW = 'follow',
  BLOCK = 'block',
  FRIEND = 'friend',
}

export enum ActivityType {
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  FOLLOW = 'follow',
  MENTION = 'mention',
  SYSTEM = 'system',
}

export enum ActivityParticipationStatus {
  NOT_PARTICIPATED = 'not_participated',
  PARTICIPATED = 'participated',
  WON = 'won',
  PRIZE_SENT = 'prize_sent',
  PRIZE_RECEIVED = 'prize_received',
}

export enum MerchantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export enum AuditOperation {
  APPROVE = 'approve',
  REJECT = 'reject',
  FLAG = 'flag',
  REMOVE = 'remove',
  RESTORE = 'restore',
}
