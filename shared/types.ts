export interface SocialSecurityAccount {
  id: string;
  name: string;
  idCard: string;
  housingFund: {
    balance: number;
    monthlyContribution: number;
    lastDepositDate: string;
    status: "normal" | "suspended";
    unit: string;
  };
  socialInsurance: {
    pension: { months: number; status: string; base: number };
    medical: { months: number; status: string; base: number };
    unemployment: { months: number; status: string; base: number };
    workInjury: { months: number; status: string; base: number };
    maternity: { months: number; status: string; base: number };
  };
  contributionHistory: Array<{
    month: string;
    housingFund: number;
    pension: number;
    medical: number;
    unemployment: number;
  }>;
}

export type TrafficEventType = "accident" | "metro_delay" | "bus_abnormal" | "road_condition";
export type Severity = "info" | "warning" | "danger";

export interface TrafficEvent {
  id: string;
  type: TrafficEventType;
  source: string;
  title: string;
  description: string;
  location: { lat: number; lng: number; address: string };
  severity: Severity;
  timestamp: string;
  expiresAt?: string;
}

export interface BusPrediction {
  routeId: string;
  routeName: string;
  stopName: string;
  predictions: Array<{ plateNumber: string; minutes: number; distance: string }>;
}

export type PaymentCategory = "water" | "electric" | "gas" | "heating" | "broadband";
export type PaymentStatus = "unpaid" | "paid" | "overdue";

export interface PaymentAccount {
  id: string;
  category: PaymentCategory;
  categoryName: string;
  district: string;
  accountNumber: string;
  accountName: string;
  amountDue: number;
  dueDate: string;
  status: PaymentStatus;
}

export interface PaymentRecord {
  id: string;
  accountId: string;
  amount: number;
  status: "pending" | "success" | "failed";
  orderNo: string;
  paidAt?: string;
  createdAt: string;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  content: string;
  board: string;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  sentiment: Sentiment;
  sentimentScore: number;
  opinionLevel: 1 | 2 | 3 | 4 | 5;
  keywords: string[];
  publishedAt: string;
}

export interface OpinionDashboard {
  totalPosts: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  trend: Array<{ date: string; positive: number; neutral: number; negative: number }>;
  topKeywords: Array<{ word: string; count: number }>;
  highRiskPosts: string[];
}

export type PoiType = "scenic" | "restaurant" | "medical";

export interface PointOfInterest {
  id: string;
  type: PoiType;
  name: string;
  rating: string;
  level?: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  source: string;
  tags: string[];
  description?: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  department: string;
  category: string;
  summary: string;
  content: string;
  publishedAt: string;
  effectiveFrom: string;
  cached: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  district: string;
  address: string;
  accuracy: number;
}

export interface WeatherInfo {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  aqi: number;
  aqiLevel: string;
  wind: string;
}

export interface ServiceEntry {
  id: string;
  name: string;
  icon: string;
  path: string;
  category: "government" | "traffic" | "life" | "community" | "policy";
  score: number;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  idCard?: string;
  verified: boolean;
  district?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  targetType: "poi" | "bus_route" | "policy" | "service";
  targetId: string;
  targetData: string;
  createdAt: string;
}
