export type CreditEvent = {
  userId: string;
  eventType: CreditEventType;
  score: number;
  reason: string;
  relatedType?: string;
  relatedId?: string;
  metadata?: Record<string, unknown>;
};

export type CreditEventType =
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'LATE_ARRIVAL'
  | 'EARLY_ARRIVAL'
  | 'POSITIVE_REVIEW'
  | 'NEUTRAL_REVIEW'
  | 'NEGATIVE_REVIEW'
  | 'NO_SHOW'
  | 'COMPLAINT'
  | 'COMPLAINT_RESOLVED'
  | 'REFERENCE_BONUS'
  | 'FIRST_ORDER_BONUS'
  | 'CONSECUTIVE_ORDERS_BONUS';

export type CreditLevel = {
  level: string;
  name: string;
  minScore: number;
  maxScore: number;
  benefits: CreditBenefit[];
  penalties: CreditPenalty[];
};

export type CreditBenefit = {
  type: 'DISCOUNT_RATE' | 'PRIORITY_MATCH' | 'REDUCED_PLATFORM_FEE' | 'CREDIT_LIMIT';
  value: number;
  description: string;
};

export type CreditPenalty = {
  type: 'INCREASED_PLATFORM_FEE' | 'DELAYED_PAYOUT' | 'RESTRICTED_FEATURES';
  value: number;
  description: string;
};

export type CreditResult = {
  userId: string;
  previousScore: number;
  newScore: number;
  change: number;
  previousLevel: string;
  newLevel: string;
  levelChanged: boolean;
  event: CreditEvent;
};

export type CreditHistoryItem = {
  id: string;
  userId: string;
  change: number;
  reason: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: Date;
};
