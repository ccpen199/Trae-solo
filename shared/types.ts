export interface User {
  id: string;
  phone: string;
  name: string;
  age: number;
  role: 'elder' | 'family' | 'auditor' | 'admin';
  avatar?: string;
  accessibilityConfig: AccessibilityConfig;
  chronicDiseases: string[];
  createdAt: string;
  lastActiveAt: string;
}

export interface AccessibilityConfig {
  fontSize: 'normal' | 'large' | 'xlarge';
  contrast: 'normal' | 'high';
  voiceEnabled: boolean;
  voiceSpeed: number;
}

export interface FamilyBinding {
  id: string;
  elderId: string;
  familyId: string;
  elderName?: string;
  familyName?: string;
  relation: string;
  status: 'pending' | 'active' | 'inactive';
  notificationEnabled: boolean;
  createdAt: string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weather: string;
  weatherIcon: string;
  uvIndex: number;
  carWashIndex: string;
  dressingAdvice: string;
  umbrellaReminder: boolean;
  forecast: DailyForecast[];
}

export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  high: number;
  low: number;
  weather: string;
  weatherIcon: string;
}

export interface LunarCalendar {
  solarDate: string;
  lunarDate: string;
  lunarYear: string;
  lunarMonth: string;
  lunarDay: string;
  ganZhi: string;
  zodiac: string;
  solarTerm: string | null;
  yi: string[];
  ji: string[];
  healthTips: string[];
  anniversaries: Anniversary[];
}

export interface Anniversary {
  id: string;
  date: string;
  title: string;
  type: 'birthday' | 'festival' | 'memorial';
  remindDays: number;
}

export interface HealthContent {
  id: string;
  type: 'recipe' | 'exercise' | 'medication';
  title: string;
  description: string;
  imageUrl: string;
  ageGroups: string[];
  chronicDiseases: string[];
  content: any;
  audioUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  accessibilityLevel: number;
  createdAt: string;
}

export interface MedicationReminder {
  id: string;
  userId: string;
  medicineName: string;
  dosage: string;
  times: string[];
  days: number[];
  enabled: boolean;
  note: string;
}

export interface Alert {
  id: string;
  type: 'inactivity' | 'health' | 'system';
  elderId: string;
  familyId: string;
  elderName?: string;
  message: string;
  level: 'info' | 'warning' | 'danger';
  read: boolean;
  createdAt: string;
}

export interface ContentReview {
  id: string;
  contentId: string;
  reviewerId: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string;
  accessibilityLevel: number;
  reviewedAt: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  page: string;
  duration: number;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
