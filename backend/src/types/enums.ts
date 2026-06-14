export enum UserRole {
  USER = 'USER',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  INSURANCE_ADMIN = 'INSURANCE_ADMIN',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const USER_ROLE_VALUES = Object.values(UserRole);

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export const USER_STATUS_VALUES = Object.values(UserStatus);

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  ALL = 'ALL',
}

export const GENDER_VALUES = Object.values(Gender);

export enum InstitutionType {
  HOSPITAL = 'HOSPITAL',
  CLINIC = 'CLINIC',
  PHYSICAL_EXAM_CENTER = 'PHYSICAL_EXAM_CENTER',
  HEALTH_CENTER = 'HEALTH_CENTER',
}

export const INSTITUTION_TYPE_VALUES = Object.values(InstitutionType);

export enum InstitutionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export const INSTITUTION_STATUS_VALUES = Object.values(InstitutionStatus);

export enum PackageType {
  GENERAL = 'GENERAL',
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  DIABETES = 'DIABETES',
  CANCER_SCREENING = 'CANCER_SCREENING',
  WOMEN_HEALTH = 'WOMEN_HEALTH',
  MEN_HEALTH = 'MEN_HEALTH',
  GERIATRIC = 'GERIATRIC',
  PEDIATRIC = 'PEDIATRIC',
  CUSTOM = 'CUSTOM',
}

export const PACKAGE_TYPE_VALUES = Object.values(PackageType);

export enum PackageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export const PACKAGE_STATUS_VALUES = Object.values(PackageStatus);

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export const BOOKING_STATUS_VALUES = Object.values(BookingStatus);

export enum SyncStatus {
  NOT_SYNCED = 'NOT_SYNCED',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

export const SYNC_STATUS_VALUES = Object.values(SyncStatus);

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUNDED = 'PARTIAL_REFUNDED',
}

export const PAYMENT_STATUS_VALUES = Object.values(PaymentStatus);

export enum InsuranceProductType {
  CRITICAL_ILLNESS = 'CRITICAL_ILLNESS',
  HOSPITALIZATION = 'HOSPITALIZATION',
  ACCIDENT = 'ACCIDENT',
  LIFE = 'LIFE',
  HEALTH = 'HEALTH',
  COMPREHENSIVE = 'COMPREHENSIVE',
}

export const INSURANCE_PRODUCT_TYPE_VALUES = Object.values(InsuranceProductType);

export enum InsuranceOrderStatus {
  PENDING_ASSESSMENT = 'PENDING_ASSESSMENT',
  UNDERWRITING = 'UNDERWRITING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  CLAIMED = 'CLAIMED',
}

export const INSURANCE_ORDER_STATUS_VALUES = Object.values(InsuranceOrderStatus);

export enum UnderwritingDecision {
  STANDARD = 'STANDARD',
  SUBSTANDARD = 'SUBSTANDARD',
  EXCLUSION = 'EXCLUSION',
  DECLINE = 'DECLINE',
}

export const UNDERWRITING_DECISION_VALUES = Object.values(UnderwritingDecision);

export enum OcrStatus {
  NOT_STARTED = 'NOT_STARTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export const OCR_STATUS_VALUES = Object.values(OcrStatus);

export enum IndicatorStatus {
  NORMAL = 'NORMAL',
  ABNORMAL = 'ABNORMAL',
  CRITICAL = 'CRITICAL',
}

export const INDICATOR_STATUS_VALUES = Object.values(IndicatorStatus);

export enum AbnormalLevel {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL',
}

export const ABNORMAL_LEVEL_VALUES = Object.values(AbnormalLevel);

export enum SettlementStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export const SETTLEMENT_STATUS_VALUES = Object.values(SettlementStatus);

export enum AuditAction {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  CREATE_BOOKING = 'CREATE_BOOKING',
  CANCEL_BOOKING = 'CANCEL_BOOKING',
  UPDATE_BOOKING_STATUS = 'UPDATE_BOOKING_STATUS',
  CREATE_INSURANCE_ORDER = 'CREATE_INSURANCE_ORDER',
  CANCEL_INSURANCE_ORDER = 'CANCEL_INSURANCE_ORDER',
  UPLOAD_REPORT = 'UPLOAD_REPORT',
  RISK_ANALYSIS = 'RISK_ANALYSIS',
  ADMIN_APPROVE_INSTITUTION = 'ADMIN_APPROVE_INSTITUTION',
  ADMIN_APPROVE_INSURANCE_COMPANY = 'ADMIN_APPROVE_INSURANCE_COMPANY',
}

export const AUDIT_ACTION_VALUES = Object.values(AuditAction);

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export const RISK_LEVEL_VALUES = Object.values(RiskLevel);
