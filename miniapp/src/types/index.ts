export interface CitizenTag {
  id: string;
  name: string;
  category: 'demographic' | 'behavior' | 'preference' | 'life-event';
  weight: number;
  source: string;
}

export interface CitizenProfile {
  id: string;
  name: string;
  idCard: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  avatar?: string;
  district: string;
  address: string;
  tags: CitizenTag[];
  totalServices: number;
  lastServiceDate: string;
  successRate: number;
  favoriteCategories: string[];
  commonServices: string[];
  recentHotspots: { key: string; count: number }[];
  familyMembers?: { id: string; name: string; relation: string; idCard: string }[];
}

export interface ReminderItem {
  id: string;
  type: 'pension' | 'idcard' | 'social' | 'medical' | 'education' | 'tax' | 'license' | 'policy' | 'application';
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  deadline?: string;
  serviceId?: string;
  policyId?: string;
  applicationId?: string;
}

export interface GovernmentService {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: string;
  department: string;
  description: string;
  icon: string;
  color: string;
  hotLevel: number;
  handlingTime: string;
  onlineAvailable: boolean;
  materialsCount: number;
  conditionsCount: number;
  successRate: number;
  isFavorite?: boolean;
  tags: string[];
  relatedPolicies: string[];
  relatedServices: string[];
}

export interface ServiceCategory {
  key: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface Policy {
  id: string;
  code: string;
  title: string;
  category: string;
  issuingDepartment: string;
  issueDate: string;
  effectiveDate: string;
  summary: string;
  keywords: string[];
  targetAudience: string[];
  relatedServices: string[];
  relatedPolicies: string[];
  views: number;
  matchScore?: number;
  matchReasons?: string[];
}

export interface ServiceApplication {
  id: string;
  serviceId: string;
  serviceName: string;
  applyTime: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'supplementing' | 'processing' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  statusText: string;
  currentStep: number;
  totalSteps: number;
  steps: { step: number; name: string; status: string; time?: string }[];
  estimatedDate: string;
  dept: string;
  staff?: string;
  feedback?: { rating: number; done: boolean };
}

export interface Certificate {
  id: string;
  name: string;
  type: 'identity' | 'social' | 'housing' | 'education' | 'medical' | 'property';
  code: string;
  issuer: string;
  issueDate: string;
  expireDate: string;
  status: 'valid' | 'expiring' | 'expired';
  qrCodeUrl?: string;
  cachedOffline: boolean;
}

export interface FeedbackTag {
  id: string;
  name: string;
  type: 'positive' | 'negative';
}

export interface QAMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  related?: { policyIds: string[]; serviceIds: string[] };
}

export type FontScale = 'standard' | 'large' | 'extra-large';
export type ColorFilter = 'none' | 'red-green' | 'blue-yellow';

export interface AccessibilityConfig {
  enabled: boolean;
  highContrast: boolean;
  largeFont: boolean;
  fontScale: FontScale;
  colorFilter: ColorFilter;
  voiceNavigation: boolean;
  speakRate: number;
  autoReadContent: boolean;
  operationConfirm: boolean;
  largeButton: boolean;
  reduceAnimation: boolean;
}

export interface AppState {
  accessibility: AccessibilityConfig;
  offlineMode: boolean;
  offlinePackageVersion?: string;
  lastSyncTime?: string;
}

export interface DashboardData {
  todayOnline: number;
  todayServices: number;
  satisfaction: number;
  pendingApplications: number;
}
