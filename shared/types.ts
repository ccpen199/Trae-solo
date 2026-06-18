export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'reviewer' | 'brand' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Reviewer {
  id: number;
  userId: number;
  realName: string;
  qualifications: string[];
  professionalFields: string[];
  qualityScore: number;
  auditStatus: 'pending' | 'approved' | 'rejected';
  totalReports: number;
}

export interface Brand {
  id: number;
  name: string;
  category: string;
  businessLicense: string;
  contactName: string;
  contactPhone: string;
  auditStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface EvaluationCategory {
  code: string;
  name: string;
  description: string;
}

export interface EvaluationIndicator {
  id: number;
  name: string;
  code: string;
  weight: number;
  category: string;
  description: string;
}

export interface DataSource {
  id: string;
  indicatorScoreId: number;
  name: string;
  type: 'ecommerce' | 'government' | 'complaint' | 'review' | 'sampling';
  collectedAt: string;
  rawValue: number;
  normalizedValue: number;
  verified: boolean;
}

export interface EvaluationReport {
  id: number;
  targetId: number;
  reviewerId: number;
  title: string;
  summary: string;
  overallScore: number;
  dimensionScores: DimensionScore[];
  indicatorScores: IndicatorScore[];
  status: 'draft' | 'submitted' | 'reviewing' | 'cross_validating' | 'approved' | 'rejected' | 'published';
  pdfUrl?: string;
  createdAt: string;
  publishedAt?: string;
  reviewer?: Reviewer;
  target?: EvaluationTarget;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  weight: number;
}

export interface IndicatorScore {
  id?: number;
  indicatorId: number;
  indicatorName?: string;
  indicatorCode?: string;
  score: number;
  weight: number;
  dataSources: DataSource[];
}

export interface EvaluationTarget {
  id: number;
  name: string;
  category: 'consumer' | 'education' | 'medical' | 'travel';
  city: string;
  brandId?: number;
  brandName?: string;
  description: string;
  coverImage?: string;
}

export interface Ranking {
  id: number;
  category: string;
  categoryName?: string;
  city: string;
  period: string;
  items: RankingItem[];
  createdAt: string;
}

export interface RankingItem {
  id?: number;
  rank: number;
  targetId: number;
  targetName: string;
  overallScore: number;
  previousRank?: number;
  changeTrend: 'up' | 'down' | 'stable';
  reportId: number;
  category?: string;
  city?: string;
  dimensionScores?: DimensionScore[];
}

export interface ReviewTask {
  id: number;
  planId: number;
  targetId: number;
  targetName?: string;
  title: string;
  description: string;
  deadline: string;
  status: 'open' | 'assigned' | 'completed';
  requiredQualifications: string[];
  reward: number;
  reviewerId?: number;
}

export interface Appeal {
  id: number;
  brandId: number;
  reportId: number;
  reason: string;
  evidence: string[];
  status: 'pending' | 'processing' | 'upheld' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processorNote?: string;
  reportTitle?: string;
  brandName?: string;
}

export interface WeightConfig {
  category: string;
  dimensions: WeightDimension[];
}

export interface WeightDimension {
  name: string;
  weight: number;
  indicators: { code: string; weight: number }[];
}

export interface EvaluationPlan {
  id: number;
  name: string;
  category: string;
  city: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  tasks?: ReviewTask[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CompareResult {
  targets: EvaluationTarget[];
  reports: EvaluationReport[];
  indicatorComparison: {
    indicatorCode: string;
    indicatorName: string;
    scores: { targetId: number; score: number; rank: number }[];
  }[];
  analysis: string;
}

export interface ReputationData {
  overallScore: number;
  trend: { date: string; score: number }[];
  complaints: { date: string; count: number }[];
  sentimentDistribution: { positive: number; neutral: number; negative: number };
  competitorComparison: { name: string; score: number }[];
}
