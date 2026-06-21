export type UserRole = 'lawyer' | 'admin' | 'enterprise' | 'operator';

export interface LicenseInfo {
  licenseNumber: string;
  licenseImage: string;
  issuingAuthority: string;
  issueDate: string;
  verifiedAt: string;
}

export interface FirmInfo {
  firmId: string;
  firmName: string;
  position: string;
  joinedAt: string;
}

export interface EnterpriseInfo {
  enterpriseId: string;
  enterpriseName: string;
  creditCode: string;
  contactName: string;
  contactPhone: string;
  verifiedAt: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  role: UserRole;
  creditScore: number;
  verified: boolean;
  licenseInfo?: LicenseInfo;
  firmInfo?: FirmInfo;
  enterpriseInfo?: EnterpriseInfo;
  createdAt: string;
}

export interface LoginParams {
  phone: string;
  code?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
