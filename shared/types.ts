export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface RealtimeBoxOffice {
  totalBoxOffice: number;
  totalShowCount: number;
  totalAudience: number;
  avgOccupancy: number;
  avgTicketPrice: number;
  perShowAudience: number;
  updateTime: string;
  boxOfficeChange: number;
}

export interface TrendPoint {
  time: string;
  boxOffice: number;
  samePeriodLastYear: number;
  samePeriodLastMonth: number;
}

export type BoxOfficeTrend = TrendPoint[];

export interface FilmRankItem {
  rank: number;
  filmId: string;
  filmName: string;
  poster: string;
  boxOffice: number;
  totalBoxOffice: number;
  boxOfficeRatio: number;
  showCountRatio: number;
  occupancy: number;
  changeIndicator: 'up' | 'down' | 'flat';
  changeValue: number;
}

export interface PipelineStatus {
  webhookName: string;
  source: string;
  status: 'online' | 'offline' | 'degraded';
  latencyMs: number;
  eventsPerSecond: number;
  lastEventTime: string;
  errorCount24h: number;
}

export interface SchedulePredictionRes {
  expectedTotalBoxOffice: number;
  confidenceInterval: [number, number];
  perTheaterPrediction: {
    theaterId: string;
    theaterName: string;
    expectedBoxOffice: number;
    expectedOccupancy: number;
    suggestion: string;
  }[];
}

export interface CompetitorInfo {
  filmId: string;
  filmName: string;
  type: string;
  castLevel: 'S' | 'A' | 'B' | 'C';
  marketingBudget: number;
  expectedOpening: number;
  radarScores: {
    story: number;
    cast: number;
    marketing: number;
    schedule: number;
    wordOfMouth: number;
  };
}

export interface CityHeatmapItem {
  cityCode: string;
  cityName: string;
  province: string;
  occupancy: number;
  boxOffice: number;
  lat: number;
  lng: number;
  value: [number, number, number];
}

export interface TheaterHeatmapItem {
  theaterId: string;
  theaterName: string;
  address: string;
  totalScreens: number;
  avgOccupancy: number;
  totalBoxOffice: number;
  rankInCity: number;
  hourlyOccupancy: Record<string, number>;
}

export interface ScreenHeatmap {
  screenId: string;
  screenName: string;
  seatCount: number;
  timeMatrix: {
    timeSlot: string;
    weekdayOccupancy: number;
    weekendOccupancy: number;
  }[];
  goldenShows: string[];
}

export interface AudienceFilterReq {
  gender?: ('male' | 'female')[];
  ageRange?: [number, number];
  regions?: string[];
  frequency?: ('low' | 'medium' | 'high' | 'extreme')[];
  preferredTypes?: string[];
}

export interface AudienceProfile {
  totalUsers: number;
  genderRatio: { male: number; female: number };
  ageDistribution: { range: string; ratio: number }[];
  regionTop10: { region: string; ratio: number }[];
  frequencyDistribution: { level: string; ratio: number; avgTimes: number }[];
  preferredTypes: { type: string; score: number }[];
  radarProfile: {
    consumption: number;
    frequency: number;
    diversity: number;
    social: number;
    loyalty: number;
    decisionCycle: number;
  };
}

export interface MigrationNode {
  id: string;
  name: string;
  value: number;
  category: 'source' | 'target';
}

export interface MigrationLink {
  source: string;
  target: string;
  value: number;
  overlapRatio: number;
}

export interface AudienceMigration {
  nodes: MigrationNode[];
  links: MigrationLink[];
}

export interface MatchMatrixItem {
  candidateId: string;
  candidateName: string;
  avatar: string;
  role: string;
  position: string;
  matchScore: number;
  dimensionScores: {
    roleFit: number;
    positionFit: number;
    scheduleFit: number;
    creditLevel: number;
  };
  credits: string[];
  verifiedBadges: string[];
}

export interface CertificateInfo {
  candidateId: string;
  realNameVerified: boolean;
  issuerVerifications: {
    issuerName: string;
    issuerLogo: string;
    cooperationCount: number;
    creditScore: number;
    verifiedDate: string;
  }[];
  pastWorks: {
    title: string;
    role: string;
    releaseYear: number;
    boxOffice: number;
    rating: number;
  }[];
  overallCreditLevel: 'AAA' | 'AA' | 'A' | 'BBB';
}

export interface PermissionLevel {
  level: 'public' | 'subscription' | 'custom';
  name: string;
  description: string;
  modules: string[];
  apiQuota: string;
  exportLimit: string;
  price: string;
}

export interface RolePermission {
  roleId: string;
  roleName: string;
  permissionLevel: string;
  customPermissions: Record<string, boolean>;
}

export interface ExportAuditLog {
  logId: string;
  userId: string;
  userName: string;
  userRole: string;
  operationTime: string;
  dataType: string;
  dataScope: string;
  purpose: string;
  format: 'Excel' | 'PDF' | 'CSV' | 'API';
  status: 'approved' | 'pending' | 'rejected';
  fileHash: string;
}

export interface ReportInfo {
  reportId: string;
  reportType: string;
  title: string;
  generatedAt: string;
  downloadUrl: string;
  status: 'generating' | 'ready' | 'failed';
  fileSize: string;
}
