export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: 'policy' | 'livelihood' | 'culture' | 'general';
  type: 'article' | 'video' | 'live';
  videoUrl?: string;
  tags: string[];
  source: string;
  publishTime: string;
  views: number;
  likes: number;
}

export interface WorkOrderProgress {
  time: string;
  status: string;
  operator: string;
  remark: string;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  title: string;
  category: string;
  description: string;
  images?: string[];
  status: 'pending' | 'assigned' | 'processing' | 'completed';
  responsibleDept: string;
  submitTime: string;
  deadline: string;
  progress: WorkOrderProgress[];
  rating?: number;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  type: 'typhoon' | 'rainstorm' | 'high_temp' | 'earthquake' | 'other';
  content: string;
  publishTime: string;
  effectiveTime: string;
  scope: string;
}

export interface ServiceOutlet {
  id: string;
  name: string;
  type: 'water' | 'electricity' | 'gas' | 'health';
  address: string;
  lat: number;
  lng: number;
  phone: string;
  openHours: string;
  queueCount: number;
  queueWaitTime: number;
}

export interface OpinionTrendPoint {
  time: string;
  count: number;
}

export interface PublicOpinion {
  id: string;
  keyword: string;
  sentimentScore: number;
  spreadCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  relatedArticles: string[];
  trend: OpinionTrendPoint[];
}

export interface HotspotCluster {
  id: string;
  title: string;
  articleCount: number;
  trend: 'up' | 'down' | 'stable';
  heat: number;
  category: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: ServiceItem[];
}

export interface ServiceItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiredDocs: string[];
  handlingTime: string;
  fee: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
