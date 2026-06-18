export interface ScenicArea {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  center?: { lat: number; lng: number };
  radius?: number;
  status?: 'active' | 'inactive';
  createdAt: string;
  visitorCount?: number;
  arLaunchCount?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  openTime?: string;
  closeTime?: string;
  ticketPrice?: number;
  rating?: number;
  images?: string[];
  province?: string;
  city?: string;
  level?: string;
  poiCount?: number;
  routeCount?: number;
}

export interface POIPoint {
  id: string;
  scenicId: string;
  name: string;
  description: string;
  lat?: number;
  lng?: number;
  triggerRadius?: number;
  arContentId?: string | null;
  order: number;
  latitude?: number;
  longitude?: number;
  category?: string;
  audioUrl?: string;
  images?: string[];
}

export interface ARContent {
  id: string;
  poiId: string;
  scenicId?: string;
  name?: string;
  title?: string;
  description?: string;
  type?: 'model' | 'scene' | 'image';
  modelUrl?: string;
  modelScale?: number;
  modelHeight?: number;
  audioTracks?: AudioTrack[];
  interactions?: InteractionNode[];
  timeline: TimelineSegment[];
  historyImages?: HistoryImage[];
  waveform?: number[];
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AudioTrack {
  id: string;
  language: 'zh-CN' | 'en-US' | 'ja-JP';
  name: string;
  audioUrl: string;
  duration: number;
  waveform: number[];
}

export interface TimelineSegment {
  id: string;
  type: 'audio' | 'model-animation' | 'interaction' | 'image' | 'intro' | 'annotation' | 'scene' | 'detail';
  startTime: number;
  endTime: number;
  label?: string;
  payload?: Record<string, unknown>;
}

export interface InteractionNode {
  id: string;
  triggerTime: number;
  type: 'quiz' | 'hotspot' | 'share';
  question?: string;
  options?: { text: string; correct: boolean }[];
}

export interface HistoryImage {
  id: string;
  url: string;
  year: string;
  caption: string;
}

export interface TourRoute {
  id: string;
  scenicId: string;
  name: string;
  poiIds: string[];
  estimatedDuration: number;
  description: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  isActive?: boolean;
  updatedAt?: string;
}

export interface VisitorBehavior {
  id: string;
  scenicId: string;
  sessionId?: string;
  poiId?: string;
  poiName?: string;
  eventType: string;
  timestamp: string;
  stayDuration?: number;
  duration?: number;
  durationSec?: number;
  location?: { lat: number; lng: number };
  deviceType?: 'ios' | 'android' | 'other';
  webArSupported?: boolean;
  visitorId?: string;
  metadata?: Record<string, unknown>;
  shareChannel?: 'wechat_moments' | 'wechat_friends' | 'weibo' | 'qq' | 'link';
  interactionCompleted?: boolean;
  interactionType?: string;
}

export interface OverviewMetrics {
  totalVisitors: number;
  arLaunchCount?: number;
  avgStayDuration?: number;
  interactionRate?: number;
  visitorTrend?: { date: string; count: number }[];
  topScenics?: { id: string; name: string; visitors: number }[];
  todayVisitors?: number;
  avgDwellTime?: number;
  arUsageRate?: number;
  satisfaction?: number;
  peakHour?: number;
  revenue?: number;
}

export interface HeatmapPoint {
  id?: string;
  lat?: number;
  lng?: number;
  intensity?: number;
  latitude?: number;
  longitude?: number;
  count?: number;
  poiName?: string;
  poiId?: string;
}

export interface ABTestMetrics {
  variantAImpressions: number;
  variantBImpressions: number;
  variantAConversions: number;
  variantBConversions: number;
  variantAConversionRate: number;
  variantBConversionRate: number;
}

export interface ABTest {
  id: string;
  scenicId: string;
  name: string;
  description: string;
  variantA: string;
  variantB: string;
  status: 'running' | 'completed' | 'pending';
  startDate: string;
  endDate?: string;
  metrics: ABTestMetrics;
  createdAt: string;
}
