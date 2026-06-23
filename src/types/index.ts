export type FontSize = "base" | "large" | "xlarge";
export type ContrastMode = "normal" | "high";
export type UserRole = "elder" | "family" | "admin";

export interface AccessibilityConfig {
  fontSize: FontSize;
  contrast: ContrastMode;
  voiceEnabled: boolean;
  voiceGender: "male" | "female";
  voiceRate: number;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  age: number;
  role: UserRole;
  accessibilityConfig: AccessibilityConfig;
  createdAt: string;
  lastLogin: string;
}

export interface WeatherCurrent {
  city: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  icon: string;
  humidity: number;
  windDirection: string;
  windSpeed: number;
  airQuality: {
    level: string;
    aqi: number;
    description: string;
  };
  uvIndex: {
    level: string;
    value: number;
    suggestion: string;
  };
  carWashIndex: {
    level: string;
    suggestion: string;
  };
  dressingAdvice: string;
  umbrellaAdvice: {
    need: boolean;
    reason: string;
  };
}

export interface WeatherHourly {
  time: string;
  temperature: number;
  condition: string;
  icon: string;
}

export interface WeatherDaily {
  date: string;
  dayCondition: string;
  nightCondition: string;
  dayIcon: string;
  nightIcon: string;
  highTemp: number;
  lowTemp: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
}

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  yearAnimal: string;
  lunarMonthName: string;
  lunarDayName: string;
  isLeap: boolean;
}

export interface YiJiItem {
  name: string;
  description: string;
}

export interface SolarTerm {
  name: string;
  date: string;
  healthTips: string[];
  dietTips: string[];
  acupressureTips: string[];
}

export interface MemorialDay {
  id: string;
  name: string;
  date: string;
  type: "birthday" | "anniversary" | "festival" | "other";
  isLunar: boolean;
  daysUntil?: number;
}

export interface CalendarData {
  lunar: LunarDate;
  solarDate: string;
  weekDay: string;
  yi: YiJiItem[];
  ji: YiJiItem[];
  currentSolarTerm?: SolarTerm;
  nextSolarTerm?: SolarTerm;
  memorialDays: MemorialDay[];
}

export type ChronicDisease =
  | "diabetes"
  | "hypertension"
  | "heart_disease"
  | "gastric"
  | "none";

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  suitableDiseases: ChronicDisease[];
  suitableAges: string;
  ingredients: { name: string; amount: string }[];
  steps: { step: number; description: string }[];
  nutritionTags: string[];
  cookTime: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  moves: { name: string; description: string; tip?: string }[];
  benefits: string[];
  suitableFor: string;
}

export interface MedicineReminder {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  enabled: boolean;
  takenToday: boolean[];
  instructions: string;
  sideEffects: string[];
}

export interface HealthProfile {
  userId: string;
  chronicDiseases: ChronicDisease[];
  dietPreference: string;
  exerciseLevel: number;
  allergies: string[];
}

export interface FamilyBind {
  id: string;
  elderId: string;
  elderName: string;
  elderAge: number;
  familyId: string;
  relation: string;
  receiveAlerts: boolean;
  createdAt: string;
}

export interface ActivityLog {
  date: string;
  durationMinutes: number;
  featuresUsed: string[];
  hasActivity: boolean;
}

export type AlertType = "inactivity" | "health" | "medicine";

export interface Alert {
  id: string;
  bindId: string;
  type: AlertType;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
  elderName: string;
}

export type ContentType = "recipe" | "exercise" | "article" | "audio";
export type ContentStatus = "pending" | "approved" | "rejected";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  status: ContentStatus;
  accessibilityScore?: number;
  submittedAt: string;
  preview?: string;
  author?: string;
}

export interface ReviewRecord {
  id: string;
  contentId: string;
  reviewerId: string;
  reviewerName: string;
  result: "approved" | "rejected";
  comment?: string;
  reviewedAt: string;
}
