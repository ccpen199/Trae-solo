import type { GeoLocation } from './common';

export type TenantStatus = 'active' | 'suspended' | 'pending';

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  fullName?: string;
  logo?: string;
  description?: string;
  status: TenantStatus;
  location?: GeoLocation;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  radiusKm?: number;
  propertyCompanyId?: string;
  samlConfig?: SamlConfig;
  settings?: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  callbackUrl: string;
  cert: string;
  privateKey?: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  nameIdFormat?: string;
  authnContext?: string[];
  attributeMap?: Record<string, string>;
}

export interface TenantSettings {
  enableTopic?: boolean;
  enableMarketplace?: boolean;
  enableSecondhand?: boolean;
  enableRedPacket?: boolean;
  enablePartner?: boolean;
  topicSensitiveWordFilter?: boolean;
  topicRequireGeoTag?: boolean;
  dailyWithdrawLimit?: number;
  singleWithdrawLimit?: number;
  amlTransactionThreshold?: number;
  maxPartnerLevels?: number;
  commissionRates?: number[];
}

export interface PropertyCompany {
  id: string;
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  businessLicense?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityBuilding {
  id: string;
  tenantId: string;
  buildingNo: string;
  unitNo?: string;
  totalFloors?: number;
  totalHouseholds?: number;
  createdAt: Date;
}
