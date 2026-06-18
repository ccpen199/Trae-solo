export type UserRole = 'resident' | 'property_staff' | 'property_admin' | 'tenant_admin' | 'platform_admin';

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'banned';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type IdCardType = 'id_card' | 'passport' | 'hk_macau' | 'taiwan';

export interface User {
  id: string;
  tenantId: string;
  phone: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  realName?: string;
  idCardType?: IdCardType;
  idCardNumber?: string;
  idCardFrontImage?: string;
  idCardBackImage?: string;
  faceImage?: string;
  verificationStatus: VerificationStatus;
  verificationRemark?: string;
  status: UserStatus;
  role: UserRole;
  samlIdentityId?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: Date;
  signature?: string;
  tags?: string[];
}

export interface Household {
  id: string;
  userId: string;
  tenantId: string;
  buildingId: string;
  roomNo: string;
  householdType: 'owner' | 'tenant' | 'family';
  relationship?: string;
  moveInDate?: Date;
  isPrimary: boolean;
  createdAt: Date;
}

export interface AccessCard {
  id: string;
  userId: string;
  tenantId: string;
  cardNumber: string;
  cardType: 'physical' | 'virtual' | 'nfc' | 'ble';
  deviceId?: string;
  deviceInfo?: Record<string, any>;
  status: 'active' | 'inactive' | 'revoked';
  validFrom?: Date;
  validTo?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface AccessRecord {
  id: string;
  userId: string;
  tenantId: string;
  cardId?: string;
  deviceId: string;
  deviceName?: string;
  accessType: 'entry' | 'exit';
  accessPoint: string;
  accessResult: 'success' | 'denied' | 'error';
  accessMethod: 'card' | 'face' | 'qr' | 'app' | 'manual';
  remark?: string;
  createdAt: Date;
}
