export interface NewsSource {
  id: string;
  name: string;
  type: 'news' | 'rss' | 'weather';
  url: string;
  status: 'active' | 'inactive';
  lastSync: string;
  description: string;
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
  url: string;
  read: boolean;
}

export interface Keyword {
  id: string;
  word: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  monitorStatus: 'active' | 'paused';
  matchCount: number;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  level: 'province' | 'city' | 'district';
  monitorStatus: 'active' | 'paused';
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
}

export interface AlertRule {
  id: string;
  name: string;
  keywords: string[];
  riskThreshold: 'low' | 'medium' | 'high' | 'critical';
  regions: string[];
  notifyMethods: ('email' | 'sms' | 'app')[];
  enabled: boolean;
}

export interface Alert {
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
  warning?: {
    type: string;
    level: string;
    description: string;
  };
}

export interface DashboardData {
  todayStats: {
    totalNews: number;
    positiveNews: number;
    neutralNews: number;
    negativeNews: number;
    criticalAlerts: number;
  };
  trendData: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
  topKeywords: {
    word: string;
    count: number;
  }[];
  regionDistribution: {
    region: string;
    count: number;
  }[];
  riskDistribution: {
    level: string;
    count: number;
  }[];
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
}
