export type PartnerLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'terminated';

export type SettlementStatus = 'pending' | 'processing' | 'settled' | 'failed';

export interface Partner {
  id: string;
  userId: string;
  tenantId: string;
  partnerCode: string;
  storeName?: string;
  storeLogo?: string;
  storeDescription?: string;
  level: PartnerLevel;
  status: PartnerStatus;
  inviterId?: string;
  invitePath: string;
  totalInvited: number;
  totalSales: number;
  totalCommission: number;
  withdrawableCommission: number;
  frozenCommission: number;
  settledCommission: number;
  joinedAt: Date;
  statusChangedAt?: Date;
  idCardVerified: boolean;
  businessLicense?: string;
}

export interface PartnerInviteRelation {
  id: string;
  tenantId: string;
  ancestorId: string;
  descendantId: string;
  depth: number;
  createdAt: Date;
}

export interface PartnerStore {
  id: string;
  partnerId: string;
  tenantId: string;
  name: string;
  description?: string;
  logo?: string;
  banners?: string[];
  category?: string;
  status: 'active' | 'inactive' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerProduct {
  id: string;
  storeId: string;
  partnerId: string;
  productId: string;
  commissionRate: number;
  isActive: boolean;
  addedAt: Date;
}

export interface CommissionRecord {
  id: string;
  partnerId: string;
  orderId: string;
  orderItemId?: string;
  fromPartnerId?: string;
  depth: number;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'available' | 'settled' | 'cancelled';
  availableAt?: Date;
  settledAt?: Date;
  createdAt: Date;
}

export interface PartnerSettlement {
  id: string;
  partnerId: string;
  tenantId: string;
  settlementNo: string;
  periodStart: Date;
  periodEnd: Date;
  totalSales: number;
  totalCommission: number;
  deductionAmount: number;
  netAmount: number;
  status: SettlementStatus;
  paidAt?: Date;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
