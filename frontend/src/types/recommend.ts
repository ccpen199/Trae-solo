export interface RecommendService {
  id: string;
  serviceCode: string;
  serviceName: string;
  serviceType: string;
  category: string;
  description: string;
  reason: string;
  reasonType: 'user_profile' | 'behavior' | 'hot' | 'similar' | 'location';
  confidence: number;
  matchTags: string[];
  userMatchScore: number;
  hotLevel: number;
  satisfaction: number;
  applyCount: number;
  averageDuration: number;
  isOnline: boolean;
  isCrossProvince: boolean;
  icon?: string;
  banner?: string;
}

export interface RecommendConfig {
  enabled: boolean;
  personalized: boolean;
  hotServices: boolean;
  similarServices: boolean;
  locationBased: boolean;
  updateFrequency: 'realtime' | 'hourly' | 'daily';
}

export interface RecommendFeedback {
  recommendId: string;
  serviceCode: string;
  action: 'click' | 'apply' | 'collect' | 'share' | 'ignore';
  timestamp: string;
  rating?: number;
  comment?: string;
}

export interface UserBehaviorAnalysis {
  userId: string;
  analysisTime: string;
  recentBehaviors: BehaviorSummary[];
  interestedCategories: string[];
  uninterestedCategories: string[];
  serviceNeeds: ServiceNeed[];
  licenseStatus: {
    expiringSoon: string[];
    needRenewal: string[];
  };
  insuranceStatus: {
    normal: string[];
    needAttention: string[];
  };
  recommendedTags: string[];
}

export interface BehaviorSummary {
  type: string;
  count: number;
  lastTime: string;
  categories: string[];
}

export interface ServiceNeed {
  serviceType: string;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
  suggestedTime?: string;
}
