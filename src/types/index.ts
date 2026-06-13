export type AuthMethod = 'idcard' | 'socialcard' | 'medicalcard' | 'phone' | 'face';

export type City = 'chengdu' | 'deyang' | 'meishan' | 'ziyang';

export type CityCode = City;

export type RecordStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'overdue';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type Relation = 'parent' | 'spouse' | 'child' | 'sibling' | 'other';

export type Category =
  | '人社'
  | '卫健'
  | '医疗保障'
  | '公积金'
  | '公安'
  | '不动产'
  | '市场监管'
  | '教育'
  | '民政'
  | '税务'
  | '住建'
  | '生态环境'
  | '文化广电旅游'
  | '体育'
  | '科技'
  | '经信'
  | '商务'
  | '农业农村'
  | '水务'
  | '水利'
  | '环保'
  | '应急'
  | '司法'
  | '退役军人'
  | '退役军人事务'
  | '审计'
  | '统计'
  | '交通';

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'radio' | 'checkbox';

export interface AccessibilitySettings {
  highContrast: boolean;
  largeFont: boolean;
  screenReader: boolean;
  textToSpeech: boolean;
  simplifiedMode: boolean;
  readAloud: boolean;
}

export interface UserInfo {
  id: string;
  name: string;
  idNumber: string;
  authMethod: AuthMethod;
  phone?: string;
  avatar?: string;
}

export interface LoginParams {
  idNumber: string;
  password: string;
  authMethod: AuthMethod;
}

export interface User {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  city: City;
  district: string;
  address: string;
  authMethod: AuthMethod;
  lastLoginTime: string;
  isRealNameVerified: boolean;
  avatar?: string;
}

export interface CityOption {
  value: City;
  label: string;
  pinyin: string;
  districts: string[];
}

export interface ServiceStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  required: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'radio' | 'checkbox';
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: Array<{ label: string; value: string }>;
}

export type ServiceStatus = 'normal' | 'maintenance';

export interface ServiceItem {
  id: string;
  name: string;
  category: Category;
  bureau: string;
  description: string;
  city: City[];
  avgDuration: string;
  avgDurationHours: number;
  processingTime: number;
  isHot: boolean;
  requiredMaterials: string[];
  steps: ServiceStep[];
  forms: FormField[];
  fee: string;
  onlineAvailable: boolean;
  prerequisites?: string[];
  status?: ServiceStatus;
}

export interface ServiceRecord {
  id: string;
  userId: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  category: Category;
  bureau: string;
  city: City;
  district: string;
  status: RecordStatus;
  submitTime: string;
  completeTime?: string;
  actualDuration?: string;
  actualDurationHours?: number;
  rating?: number;
  reviewText?: string;
  sentiment?: Sentiment;
  handler: string;
  rejectReason?: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relation: Relation;
  relationText: string;
  idCard: string;
  phone?: string;
  birthDate: string;
  isVerified: boolean;
}

export interface DistrictHeat {
  city: City;
  cityName: string;
  district: string;
  count: number;
}

export interface AgeHeat {
  ageGroup: string;
  minAge: number;
  maxAge: number;
  count: number;
  maleCount: number;
  femaleCount: number;
}

export interface TimeSlotHeat {
  hour: number;
  timeSlot: string;
  timeRange?: string;
  count: number;
  avgWaitMinutes: number;
}

export interface TopService {
  rank?: number;
  serviceName: string;
  category: Category;
  count: number;
  trend: 'up' | 'down' | 'flat';
}

export interface HeatmapData {
  districtHeats: DistrictHeat[];
  ageHeats: AgeHeat[];
  timeSlotHeats: TimeSlotHeat[];
  topServices: TopService[];
  lastUpdated: string;
}

export interface TrendPoint {
  date: string;
  count: number;
  completedCount: number;
  avgDurationHours: number;
}

export interface BureauOverdue {
  bureau: string;
  totalCount: number;
  overdueCount: number;
  overdueRate: number;
}

export interface SentimentStat {
  sentiment: Sentiment;
  label: string;
  count: number;
  percentage: number;
}

export interface BureauStatus {
  bureau: string;
  isConnected: boolean;
  responseTimeMs: number;
  lastUpdateTime: string;
  serviceCount: number;
}

export interface LowReview {
  id: string;
  serviceName: string;
  userName: string;
  rating: number;
  reviewText: string;
  submitTime: string;
  bureau: string;
  city: City;
  sentiment: Sentiment;
}

export interface DashboardData {
  todayCount: number;
  todayCompletedCount: number;
  avgDurationHours: number;
  onTimeRate: number;
  satisfactionRate: number;
  trendPoints: TrendPoint[];
  bureauOverdues: BureauOverdue[];
  sentimentStats: SentimentStat[];
  bureauStatuses: BureauStatus[];
  lowReviews: LowReview[];
  lastUpdated: string;
}
