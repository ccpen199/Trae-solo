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
export type AccidentStatus = "dispatched" | "on_site" | "processing" | "cleared";
export type AccidentSource = "police_patrol" | "citizen_report" | "monitor_auto";
export type MetroStatus = "delayed" | "recovered" | "normal";
export type MetroDelayReason = "equipment_failure" | "passenger_control" | "emergency" | "maintenance";
export type MetroMeasure = "bus_shuttle" | "extra_trains" | "staff_guidance";
export type BusStatus = "normal" | "rerouted" | "delayed" | "suspended";
export type BusCrowdLevel = "empty" | "moderate" | "crowded";
export type MapLayer = "events" | "congestion" | "bus_live";

export interface TrafficEvent {
  id: string;
  type: TrafficEventType;
  source: string;
  title: string;
  description: string;
  location: { lat: number; lng: number; address: string; district?: string };
  severity: Severity;
  timestamp: string;
  expiresAt?: string;
}

export interface AccidentEvent extends TrafficEvent {
  type: "accident";
  accidentNo: string;
  status: AccidentStatus;
  sourceType: AccidentSource;
  expectedRecovery: string;
  progress: { received: boolean; dispatched: boolean; onSite: boolean; processing: boolean; cleared: boolean };
  tracked?: boolean;
  casualties?: number;
  vehiclesInvolved?: number;
}

export interface MetroDelayEvent extends TrafficEvent {
  type: "metro_delay";
  lineName: string;
  lineColor: string;
  status: MetroStatus;
  delayDirection: string;
  affectedStations: string[];
  delayDuration: number;
  expectedRecovery: string;
  reason: MetroDelayReason;
  measures: MetroMeasure[];
  recoveredAt?: string;
  totalDelayMinutes?: number;
}

export interface BusAbnormalEvent extends TrafficEvent {
  type: "bus_abnormal";
  routeName: string;
  status: BusStatus;
  affectedStops: string[];
  detourRoute?: string;
  expectedRecovery?: string;
}

export interface TrafficOverview {
  todayAccidents: number;
  yesterdayAccidents: number;
  accidentTrend: "up" | "down" | "same";
  delayedMetroLines: number;
  metroStatus: "normal" | "partial_delay" | "major_delay";
  abnormalBusRoutes: number;
  busStatus: "normal" | "partial_abnormal";
  lastUpdated: string;
}

export interface BusPrediction {
  routeId: string;
  routeName: string;
  stopName: string;
  status: BusStatus;
  crowdLevel: BusCrowdLevel;
  currentStationIndex: number;
  totalStations: number;
  stations: string[];
  predictions: Array<{
    plateNumber: string;
    minutes: number;
    distance: string;
    crowdLevel: BusCrowdLevel;
    currentStation: string;
  }>;
  isFavorite?: boolean;
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
