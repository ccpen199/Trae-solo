export interface License {
  id: string;
  type: LicenseType;
  name: string;
  licenseNumber: string;
  holderName: string;
  holderIdCard: string;
  issueDate: string;
  validFrom: string;
  validTo: string;
  status: LicenseStatus;
  issuer: string;
  issuerCode: string;
  verifyCode: string;
  qrCode: string;
  frontImage?: string;
  backImage?: string;
  electronicSignature?: string;
  usageRecords: LicenseUsageRecord[];
  verifyRecords: LicenseVerifyRecord[];
}

export type LicenseType = 
  | 'social_security_card'
  | 'professional_qualification'
  | 'title_certificate'
  | 'pension_certificate'
  | 'unemployment_certificate'
  | 'labor_contract'
  | 'other';

export type LicenseStatus = 
  | 'valid'
  | 'expiring'
  | 'expired'
  | 'revoked'
  | 'pending';

export interface LicenseUsageRecord {
  id: string;
  usageScene: string;
  usageTime: string;
  usageLocation: string;
  operator: string;
  result: 'success' | 'failed';
}

export interface LicenseVerifyRecord {
  id: string;
  verifier: string;
  verifyTime: string;
  verifyLocation: string;
  verifyMethod: 'qrcode' | 'manual' | 'online';
  result: 'valid' | 'invalid' | 'expired';
}

export interface LicenseVerifyParams {
  licenseNumber: string;
  verifyCode: string;
  holderName?: string;
  holderIdCard?: string;
}

export interface LicenseIssueParams {
  type: LicenseType;
  holderName: string;
  holderIdCard: string;
  issueReason: string;
  supportingMaterials: string[];
}

export interface ECardInfo {
  cardNumber: string;
  bankName: string;
  bankCardNumber: string;
  activated: boolean;
  activateDate?: string;
  balance: number;
  medicalBalance: number;
  pensionBalance: number;
  unemploymentBalance: number;
  workInjuryBalance: number;
  maternityBalance: number;
  status: 'normal' | 'locked' | 'lost' | 'cancelled';
  qrCode: string;
  paymentRecords: ECardPaymentRecord[];
}

export interface ECardPaymentRecord {
  id: string;
  type: 'medical' | 'pharmacy' | 'other';
  amount: number;
  personalPayment: number;
  accountPayment: number;
  time: string;
  location: string;
  merchant: string;
}

export interface ECardApplyParams {
  name: string;
  idCard: string;
  phone: string;
  deliveryMethod: 'self_pickup' | 'mail';
  deliveryAddress?: string;
  bankName: string;
  bankCardNumber: string;
}
