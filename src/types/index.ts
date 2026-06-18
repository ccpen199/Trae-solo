
export interface Metric {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: 'green' | 'blue' | 'amber' | 'slate';
}

export interface TraceBatch {
  id: string;
  traceCode: string;
  productName: string;
  category: string;
  specification: string;
  producer: string;
  origin: string;
  productionDate: string;
  shelfLife: number;
  status: string;
  blockchainHash: string;
  blockHeight: number;
  qualityResult: string;
}

export interface TimelineItem {
  id: string;
  stage: string;
  operator: string;
  eventTime: string;
  location: string;
  description: string;
  temperature?: number;
  humidity?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  wholesalePrice: number;
  moq: number;
  specification: string;
  traceCode: string;
  seller: string;
  origin: string;
  stock: number;
  sales: number;
  imageUrl: string;
  channel: 'b2b' | 'b2c';
}

export interface OrderRow {
  id: string;
  buyer: string;
  seller: string;
  amount: number;
  status: string;
  progress: number;
  logistics: string;
  createdAt: string;
}

export interface ContractRow {
  id: string;
  title: string;
  counterparty: string;
  amount: number;
  status: string;
  blockchainHash: string;
  signedAt: string;
}

export interface QuestionRow {
  id: string;
  title: string;
  category: string;
  expert: string;
  status: string;
  answers: number;
  responseTime: string;
}

export interface WeatherAlert {
  id: string;
  region: string;
  level: string;
  alertType: string;
  suggestion: string;
  startsAt: string;
}

export interface QualityTrendItem {
  month: string;
  passRate: number;
  sampling: number;
  risk: number;
}

export interface DashboardData {
  metrics: Metric[];
  qualityTrend: QualityTrendItem[];
  alerts: WeatherAlert[];
}

export interface TraceResult {
  batch: TraceBatch;
  timeline: TimelineItem[];
}

export interface RegulatoryReport {
  id: string;
  title: string;
  risk: string;
  sampleCount: number;
  passRate: number;
}
