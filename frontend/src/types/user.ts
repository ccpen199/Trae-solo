export interface UserInfo {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  avatar: string;
  gender: 'male' | 'female';
  birthDate: string;
  address: string;
  realNameVerified: boolean;
  faceVerified: boolean;
  ecardActivated: boolean;
}

export interface InsuranceInfo {
  type: string;
  status: 'normal' | 'suspended' | 'terminated';
  insuredDate: string;
  paymentMonths: number;
  personalAccount: number;
  overallAccount: number;
  lastPaymentDate: string;
}

export interface UserProfile {
  age: number;
  occupation: string;
  insuredArea: string;
  annualIncome: number;
  familyMembers: number;
  healthStatus: string;
  tags: string[];
}

export interface UserProfileUpdateParams {
  name?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  insuredArea?: string;
  healthStatus?: string;
  tags?: string[];
}

export interface BehaviorRecord {
  id: string;
  type: 'browse' | 'search' | 'apply' | 'view';
  target: string;
  targetId: string;
  timestamp: string;
  duration: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  token: string;
  userInfo: UserInfo | null;
  loginTime: string;
  expireTime: string;
}

export interface RealNameAuthParams {
  name: string;
  idCard: string;
  idCardFront: string;
  idCardBack: string;
}

export interface FaceAuthParams {
  faceImage: string;
  liveAction: string;
}

export interface LoginParams {
  phone?: string;
  code?: string;
  idCard?: string;
  password?: string;
}
