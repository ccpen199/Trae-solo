export interface GeoPoint {
  lat: number;
  lng: number;
}

export type ServiceCategory =
  | '餐饮'
  | '家政'
  | '维修'
  | '快递'
  | '保洁'
  | '搬家'
  | '美容'
  | '教育';

export interface ServiceGrid {
  id: string;
  code: string;
  name: string;
  center: GeoPoint;
  bounds: [number, number, number, number];
  categories: ServiceCategory[];
  providerIds: string[];
  heatLevel: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  content: string;
  date: string;
  tags: string[];
}

export interface ServiceProvider {
  id: string;
  name: string;
  avatar: string;
  category: ServiceCategory;
  gridId: string;
  location: GeoPoint;
  address: string;
  starLevel: 1 | 2 | 3 | 4 | 5;
  orderCount: number;
  goodRate: number;
  responseSpeed: number;
  trafficWeight: number;
  description: string;
  priceRange: string;
  reviews: Review[];
  distance?: number;
  matchScore?: number;
}

export interface ServiceDemand {
  id: string;
  category: string;
  description: string;
  location: GeoPoint;
  address: string;
  expectedTime: string;
  status: 'pending' | 'matched' | 'completed';
  matchedProviders: string[];
  createdAt: string;
}

export type DisputeType = 'service_quality' | 'delay' | 'overcharge' | 'damage';
export type DisputeStatus = 'submitted' | 'reviewing' | 'resolved';

export interface Evidence {
  id: string;
  type: 'image' | 'video';
  url: string;
  name?: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  type: DisputeType;
  typeLabel: string;
  description: string;
  evidences: Evidence[];
  status: DisputeStatus;
  statusLabel: string;
  compensationStandard: string;
  compensationAmount: number;
  result: string;
  createdAt: string;
  csAgent?: string;
}

export type VirtualResourceType = 'ar_clothing' | 'vr_house' | 'shop_360';

export interface VirtualResource {
  id: string;
  type: VirtualResourceType;
  title: string;
  thumbnail: string;
  resourceUrl: string;
  providerId: string;
  providerName: string;
  address?: string;
  price?: string;
  tags: string[];
}

export interface GrowthTrendItem {
  date: string;
  value: number;
}

export interface GrowthRadarItem {
  dimension: string;
  value: number;
  fullMark: number;
}

export interface GrowthMetrics {
  providerId: string;
  orderTrend: GrowthTrendItem[];
  rateTrend: GrowthTrendItem[];
  speedTrend: GrowthTrendItem[];
  radar: GrowthRadarItem[];
}

export interface StarLevelRule {
  star: number;
  orderCount: number;
  goodRate: number;
  responseSpeed: number;
  trafficWeight: number;
  privileges: string[];
}

export interface CompensationRule {
  type: DisputeType;
  typeLabel: string;
  ratio: string;
  maxAmount: number;
  description: string;
}
