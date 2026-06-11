export type CardStatus = 'normal' | 'lost' | 'frozen' | 'expired' | 'pending';

export type CardProgressStage = 'collected' | 'manufactured' | 'shipped' | 'delivered';

export interface CardProgressNode {
  stage: CardProgressStage;
  label: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface SocialCard {
  id: string;
  cardNumber: string;
  holderName: string;
  idNumber: string;
  status: CardStatus;
  issuedDate: string;
  validUntil: string;
  bankName: string;
  bankAccount: string;
  photoUrl?: string;
  progress?: CardProgressNode[];
}

export interface InsuranceRecord {
  type: 'pension' | 'medical' | 'injury';
  typeName: string;
  totalMonths: number;
  accountBalance: number;
  lastPaymentDate: string;
  status: 'normal' | 'stopped';
}

export interface BenefitStatement {
  id: string;
  generatedAt: string;
  period: string;
  holderName: string;
  idNumber: string;
  records: InsuranceRecord[];
  totalContributionMonths: number;
  totalBalance: number;
}

export interface UnemploymentPrecheck {
  id: string;
  name: string;
  idNumber: string;
  stopReason: string;
  stopReasonCode: string;
  contributionMonths: number;
  isLocalResident: boolean;
  eligible: boolean;
  estimatedBenefit: number;
  estimatedMonths: number;
  reasons: string[];
}

export interface CityConfig {
  id: string;
  cityCode: string;
  cityName: string;
  localizedServices: LocalizedService[];
  updatedAt: string;
  updatedBy: string;
}

export interface LocalizedService {
  id: string;
  name: string;
  description: string;
  linkUrl: string;
  icon: string;
  enabled: boolean;
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  sourceLaw: string;
  sourceArticle: string;
  keywords: string[];
  views: number;
  updatedAt: string;
}

export interface FundAlert {
  id: string;
  alertType: 'withdrawal_spike' | 'abnormal_pattern' | 'balance_warning';
  alertLevel: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  city: string;
  amount?: number;
  count?: number;
  triggeredAt: string;
  isHandled: boolean;
}

export interface UserInfo {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'city_admin' | 'province_admin';
  cityCode: string;
  cityName: string;
}
