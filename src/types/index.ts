export interface NewsSource {
  id: string;
  name: string;
  type: 'news' | 'rss' | 'weather';
  url: string;
  status: 'active' | 'inactive';
  lastSync: string;
  description: string;
  newsCount?: number;
  syncInterval?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceType: 'news' | 'rss' | 'weather';
  publishTime: string;
  content: string;
  summary: string;
  keywords: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  url: string;
  read: boolean;
  views: number;
  shares: number;
  comments: number;
  hotScore: number;
}

export interface Keyword {
  id: string;
  word: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  monitorStatus: 'active' | 'paused';
  matchCount: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  level: 'province' | 'city' | 'district';
  monitorStatus: 'active' | 'paused';
  newsCount?: number;
  lat?: number;
  lng?: number;
}

export interface SubscriptionTopic {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  regions: string[];
  sources: string[];
  notifyMethods: ('email' | 'sms' | 'app')[];
  createdAt: string;
  newsCount?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  keywords: string[];
  riskThreshold: 'low' | 'medium' | 'high' | 'critical';
  regions: string[];
  notifyMethods: ('email' | 'sms' | 'app')[];
  enabled: boolean;
  alertCount?: number;
}

export interface AlertRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  newsId: string;
  newsTitle: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alertTime: string;
  status: 'unread' | 'read' | 'processed';
  processedBy?: string;
  processedTime?: string;
  processedNote?: string;
}

export interface WeatherData {
  id: string;
  region: string;
  date: string;
  temperature: {
    max: number;
    min: number;
    current: number;
  };
  weather: string;
  humidity: number;
  wind: string;
  aqi: number;
  aqiLevel: '优' | '良' | '轻度污染' | '中度污染' | '重度污染' | '严重污染';
  warning?: {
    type: string;
    level: string;
    description: string;
  };
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface SentimentTrendData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

export interface SourceSentimentDistribution {
  name: string;
  positive: number;
  neutral: number;
  negative: number;
  positivePercent: number;
  negativePercent: number;
}

export interface RegionSentimentDistribution {
  region: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positivePercent: number;
  negativePercent: number;
}

export interface RiskTrendData {
  date: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface TopicDistribution {
  topic: string;
  count: number;
  positive: number;
  negative: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SourceDistribution {
  name: string;
  type: 'news' | 'rss' | 'weather';
  count: number;
  percent: number;
}

export interface KeywordTrend {
  word: string;
  data: { date: string; count: number }[];
  trend: 'up' | 'down' | 'stable';
}

export interface HotEvent {
  id: string;
  title: string;
  keywords: string[];
  newsCount: number;
  startDate: string;
  hotScore: number;
  trend: 'rising' | 'stable' | 'falling';
  region: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'news' | 'alert' | 'system';
  level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealTimeStream {
  id: string;
  time: string;
  title: string;
  source: string;
  type: 'news' | 'alert' | 'weather';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComparisonData {
  period: string;
  totalNews: number;
  positiveNews: number;
  negativeNews: number;
  criticalAlerts: number;
  avgSentiment: number;
}

export interface DashboardData {
  todayStats: {
    totalNews: number;
    positiveNews: number;
    neutralNews: number;
    negativeNews: number;
    criticalAlerts: number;
    activeSources: number;
    monitoredKeywords: number;
    activeSubscriptions: number;
  };
  comparisonStats: {
    daily: {
      previous: ComparisonData;
      current: ComparisonData;
    };
    weekly: {
      previous: ComparisonData;
      current: ComparisonData;
    };
    monthly: {
      previous: ComparisonData;
      current: ComparisonData;
    };
  };
  trendData: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }[];
  hourlyTrend: {
    hour: string;
    count: number;
  }[];
  topKeywords: {
    word: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
  }[];
  keywordTrends: KeywordTrend[];
  regionDistribution: {
    region: string;
    count: number;
    lat: number;
    lng: number;
    positive: number;
    negative: number;
  }[];
  riskDistribution: {
    level: string;
    count: number;
    percent: number;
  }[];
  sentimentAnalysis: SentimentAnalysis;
  sentimentTrendData: SentimentTrendData[];
  sourceDistribution: SourceDistribution[];
  sourceSentimentDistribution: SourceSentimentDistribution[];
  regionSentimentDistribution: RegionSentimentDistribution[];
  riskTrendData: RiskTrendData[];
  topicDistribution: TopicDistribution[];
  sourceTrendData: {
    date: string;
    [key: string]: string | number;
  }[];
  hotEvents: HotEvent[];
  timelineEvents: TimelineEvent[];
  realTimeStreams: RealTimeStream[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: {
    id: string;
    title: string;
    type: 'summary' | 'statistics' | 'news_list' | 'alerts' | 'charts';
    enabled: boolean;
  }[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

export interface SystemStatus {
  lastSyncTime: string;
  nextSyncTime: string;
  activeSources: number;
  totalNewsToday: number;
  alertsToday: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}
