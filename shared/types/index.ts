export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserRole = 'super_admin' | 'government' | 'scenic_admin' | 'enterprise' | 'editor' | 'professional' | 'tourist';

export interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  role: UserRole;
  organization: string;
  avatar: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLoginAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  permissions: string[];
}

export type ContentType = 'article' | 'video' | 'vr' | 'infographic';
export type ContentStatus = 'draft' | 'pending_audit' | 'auditing' | 'approved' | 'rejected' | 'published' | 'offline';

export interface Content {
  id: string;
  title: string;
  type: ContentType;
  authorId: string;
  authorName: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
  category: string;
  region: string;
  status: ContentStatus;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  copyright?: CopyrightInfo;
  watermark?: WatermarkConfig;
  auditTrail?: AuditRecord[];
  scheduledPublishAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CopyrightInfo {
  owner: string;
  registrationNo: string;
  authorizedUse: string[];
  watermarkEnabled: boolean;
}

export interface WatermarkConfig {
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
}

export interface AuditRecord {
  id: string;
  contentId: string;
  auditorId: string;
  auditorName: string;
  level: 1 | 2 | 3;
  action: 'submit' | 'approve' | 'reject';
  opinion: string;
  createdAt: string;
}

export interface ScenicSpotFlow {
  id: string;
  scenicSpotId: string;
  scenicSpotName: string;
  region: string;
  visitorCount: number;
  maxCapacity: number;
  saturation: number;
  realTimeData: boolean;
  timestamp: string;
}

export interface OTABookingData {
  id: string;
  platform: string;
  scenicSpotId: string;
  scenicSpotName: string;
  bookingCount: number;
  bookingAmount: number;
  checkInDate: string;
  dataDate: string;
}

export interface IntangibleHeritage {
  id: string;
  name: string;
  category: string;
  level: 'national' | 'provincial' | 'municipal';
  region: string;
  inheritor: string;
  description: string;
  certificationDate: string;
}

export interface CouponConsumption {
  id: string;
  couponBatchId: string;
  couponName: string;
  totalAmount: number;
  usedAmount: number;
  usedCount: number;
  writeOffRate: number;
  region: string;
  statisticsDate: string;
}

export interface InvestmentProject {
  id: string;
  name: string;
  type: string;
  region: string;
  totalInvestment: number;
  description: string;
  contactPerson: string;
  contactPhone: string;
  status: 'pending' | 'negotiating' | 'signed' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface FestivalActivity {
  id: string;
  name: string;
  organizer: string;
  region: string;
  startDate: string;
  endDate: string;
  venue: string;
  expectedScale: number;
  description: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'ongoing' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface GuideCertification {
  id: string;
  userId: string;
  realName: string;
  idCard: string;
  qualificationNo: string;
  qualificationLevel: 'primary' | 'intermediate' | 'senior';
  certificateImage: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardWidget[];
  ownerId: string;
  isPublic: boolean;
  sharedRoles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'map' | 'table' | 'card' | 'gauge';
  title: string;
  dataSource: string;
  dimensions: string[];
  measures: string[];
  filters: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export interface OpenApi {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  category: string;
  requestParams: ApiParam[];
  responseParams: ApiParam[];
  rateLimit: number;
  isPublic: boolean;
}

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
}

export interface ApiApplication {
  id: string;
  name: string;
  description: string;
  appKey: string;
  appSecret: string;
  ownerId: string;
  subscribedApis: string[];
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface DistributionRule {
  id: string;
  name: string;
  contentTags: string[];
  targetRegions: string[];
  targetUserGroups: string[];
  priority: number;
  channels: string[];
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

export interface DistributionRecord {
  id: string;
  contentId: string;
  ruleId?: string;
  channel: string;
  targetUserId?: string;
  targetRegion?: string;
  deliveredAt: string;
  viewedAt?: string;
  clickedAt?: string;
}

export interface ContentSecurityCheckRequest {
  contentId: string;
  content: string;
  type: ContentType;
  mediaUrls?: string[];
}

export interface ContentSecurityCheckResponse {
  passed: boolean;
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
  sensitiveKeywords: string[];
  suggestions: string[];
  checkTime: string;
}

export interface SentimentAnalysis {
  id: string;
  contentId: string;
  totalMentions: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  sentimentScore: number;
  hotTopics: string[];
  keyOpinionLeaders: string[];
  analysisDate: string;
}

export interface PropagationNode {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  platform: string;
  shareCount: number;
  viewCount: number;
  level: number;
  parentId?: string;
  timestamp: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  module: string;
  action: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  requestParams?: Record<string, any>;
  responseResult?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  category: string;
  useCount: number;
}

export interface Media {
  id: string;
  contentId?: string;
  type: string;
  url: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  width?: number;
  height?: number;
  watermarked: boolean;
  createdAt: string;
}

export interface ScenicSpot {
  id: string;
  name: string;
  level: string;
  region: string;
  address: string;
  image: string;
  ticketPrice: number;
  rating: number;
  maxCapacity: number;
  currentVisitorCount: number;
  saturation: number;
  latitude?: number;
  longitude?: number;
  description: string;
}

export type OTABooking = OTABookingData;
export type Heritage = IntangibleHeritage;

export interface AuditActionRequest {
  contentId: string;
  level: 1 | 2 | 3;
  action: 'approve' | 'reject';
  opinion: string;
}

export interface PropagationPath {
  id: string;
  contentId: string;
  contentTitle: string;
  totalShares: number;
  totalViews: number;
  nodes: PropagationNode[];
  analysisDate: string;
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentTrend {
  date: string;
  sentimentScore: number;
  totalMentions: number;
}

export interface CouponBatch {
  id: string;
  name: string;
  totalAmount: number;
  totalCount: number;
  region: string;
  validFrom: string;
  validTo: string;
}
