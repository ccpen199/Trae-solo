export type SentimentType = 'positive' | 'neutral' | 'negative';
export type SourceLevel = 'national' | 'provincial' | 'city' | 'industry' | 'self-media';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceLevel: SourceLevel;
  sourceAuthority: number;
  publishDate: string;
  sentiment: SentimentType;
  sentimentScore: number;
  keywords: string[];
  relatedCompanies: string[];
  relatedCompaniesNames: string[];
  readCount: number;
  forwardCount: number;
  commentCount: number;
  heat: number;
  url?: string;
  author?: string;
}

export interface SentimentStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positiveRate: number;
  negativeRate: number;
}

export interface SourceDistributionItem {
  level: SourceLevel;
  name: string;
  count: number;
  ratio: number;
}

export interface HotKeyword {
  keyword: string;
  count: number;
  heat: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SentimentTrendItem {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface SentimentFilter {
  sentiment?: SentimentType[];
  sourceLevel?: SourceLevel[];
  dateRange?: [string, string];
  keyword?: string;
  companyId?: string;
  minAuthority?: number;
}
