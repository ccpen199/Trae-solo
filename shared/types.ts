export type ContentChannel = 'politics' | 'livelihood' | 'culture' | 'education';

export type ContentTier = 'city' | 'district' | 'street';

export type ContentStatus = 'draft' | 'pending' | 'published' | 'rejected';

export type ContentSource = 'rss' | 'api' | 'manual';

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  channel: ContentChannel;
  tier: ContentTier;
  status: ContentStatus;
  source: ContentSource;
  viewCount: number;
  publishTime?: string;
  createTime: string;
  updateTime: string;
  creatorId: string;
  creatorName: string;
}

export interface ContentListResponse {
  list: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SensitiveWordMatch {
  word: string;
  position: number;
  category: string;
}

export interface AIAnalysisResult {
  score: number;
  level: 'safe' | 'warning' | 'danger';
  tags: string[];
  description: string;
}

export interface AuditResult {
  contentId: string;
  sensitiveWords: SensitiveWordMatch[];
  aiAnalysis: AIAnalysisResult;
  status: 'pending' | 'passed' | 'rejected';
  auditor?: string;
  auditTime?: string;
  rejectReason?: string;
}

export interface SensitiveWord {
  id: string;
  word: string;
  category: string;
  level: 'low' | 'medium' | 'high';
  createTime: string;
}

export type AppealStatus = 'pending' | 'processing' | 'transferred' | 'feedback' | 'resolved' | 'closed' | 'overdue';

export type EmergencyUrgency = 'normal' | 'urgent' | 'critical';

export interface AppealLog {
  id: string;
  action: string;
  operator: string;
  remark: string;
  time: string;
}

export interface TransferRecord {
  id: string;
  appealId: string;
  transferTime: string;
  platform12345Id: string;
  status12345: 'processing' | 'resolved' | 'closed';
  feedbackResult?: string;
  satisfaction?: number;
  feedbackTime?: string;
  handler: string;
}

export interface Appeal {
  id: string;
  title: string;
  content: string;
  category: string;
  status: AppealStatus;
  urgency: EmergencyUrgency;
  citizenName: string;
  citizenPhone: string;
  address: string;
  district: string;
  platform12345Id?: string;
  transferTime?: string;
  resolveTime?: string;
  satisfaction?: number;
  processingDurationHours?: number;
  feedbackResult?: string;
  handler?: string;
  createTime: string;
  logs: AppealLog[];
}

export interface AppealListResponse {
  list: Appeal[];
  total: number;
  page: number;
  pageSize: number;
}

export type EmergencyLevel = 'normal' | 'yellow' | 'orange' | 'red';

export type EmergencyStatus = 'draft' | 'published' | 'expired';

export interface EmergencyInfo {
  id: string;
  title: string;
  content: string;
  level: EmergencyLevel;
  type: string;
  targetAreas: string[];
  isPinned: boolean;
  status: EmergencyStatus;
  publishTime?: string;
  expireTime?: string;
  createTime: string;
  creatorId: string;
  creatorName: string;
  reachCount: number;
  feedbackCount?: number;
}

export interface EmergencyListResponse {
  list: EmergencyInfo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HotTopic {
  topic: string;
  heat: number;
  trend: number;
}

export interface PublicOpinionSummary {
  heatIndex: number;
  trend: 'up' | 'down' | 'stable';
  hotTopics: HotTopic[];
  totalMentions: number;
  positiveRate: number;
}

export interface HeatTrendItem {
  date: string;
  heat: number;
}

export type SpreadNodeType = 'source' | 'relay' | 'comment';

export interface SpreadNode {
  id: string;
  name: string;
  type: SpreadNodeType;
  value: number;
  x?: number;
  y?: number;
}

export interface SpreadLink {
  source: string;
  target: string;
  value: number;
}

export interface SpreadGraph {
  nodes: SpreadNode[];
  links: SpreadLink[];
}

export type UserTier = 'city' | 'district' | 'street';

export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  roleId: string;
  tier: UserTier;
  district?: string;
  street?: string;
  status: UserStatus;
  createTime: string;
  avatar?: string;
}

export interface UserListResponse {
  list: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  createTime: string;
}

export interface DisposalTimelineItem {
  id: string;
  time: string;
  action: string;
  operator: string;
  remark: string;
}

export interface MapLayerItem {
  id: string;
  name: string;
  type: 'water' | 'power' | 'gas' | 'construction';
  status: 'normal' | 'warning' | 'danger' | 'resolved';
  address: string;
  district: string;
  startTime: string;
  endTime: string;
  description: string;
  lng: number;
  lat: number;
  affectedArea: number;
  affectedHouseholds: number;
  responsibleUnit: string;
  contactPerson: string;
  contactPhone: string;
  disposalTimeline: DisposalTimelineItem[];
}

export interface DashboardStats {
  totalUsers: number;
  todayPublished: number;
  pendingAppeals: number;
  emergencyLevel: EmergencyLevel;
  userTrend: number;
  contentTrend: number;
  appealTrend: number;
}

export const channelLabels: Record<ContentChannel, string> = {
  politics: '时政新闻',
  livelihood: '民生服务',
  culture: '文化教育',
  education: '教育资讯',
};

export const tierLabels: Record<ContentTier, string> = {
  city: '市级',
  district: '区县级',
  street: '街道级',
};

export const statusLabels: Record<ContentStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  rejected: '已驳回',
};

export const emergencyLevelLabels: Record<EmergencyLevel, string> = {
  normal: '一般',
  yellow: '黄色预警',
  orange: '橙色预警',
  red: '红色预警',
};

export const appealStatusLabels: Record<AppealStatus, string> = {
  pending: '待受理',
  processing: '处理中',
  transferred: '已转办12345',
  feedback: '待反馈',
  resolved: '已办结',
  closed: '已关闭',
  overdue: '超时预警',
};

export const urgencyLabels: Record<EmergencyUrgency, string> = {
  normal: '普通',
  urgent: '紧急',
  critical: '特急',
};

export const districts = [
  '鼓楼区',
  '云龙区',
  '贾汪区',
  '泉山区',
  '铜山区',
  '丰县',
  '沛县',
  '睢宁县',
  '邳州市',
  '新沂市',
];

export const appealCategories = [
  '市政设施',
  '环境卫生',
  '交通出行',
  '供水供电',
  '教育医疗',
  '物业管理',
  '噪音扰民',
  '其他问题',
];
