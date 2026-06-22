export interface RiskEvent {
  id: string;
  userId: string;
  eventType: RiskEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: RiskEventDetails;
  detectedAt: Date;
  status: 'pending' | 'reviewing' | 'resolved' | 'escalated';
  actions: RiskAction[];
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type RiskEventType =
  | 'sensitive_word_detected'
  | 'high_frequency_match'
  | 'credit_score_drop'
  | 'abnormal_location'
  | 'multiple_account_suspicion'
  | 'report_submitted'
  | 'scam_keyword_detected'
  | 'age_verification_failed'
  | 'impersonation_suspicion';

export interface RiskEventDetails {
  messageContent?: string;
  matchCount?: number;
  timeWindowMinutes?: number;
  reportedBy?: string;
  reportReason?: string;
  locationDeviationKm?: number;
  keywordsFound?: string[];
  accountIds?: string[];
}

export interface RiskAction {
  type: RiskActionType;
  executedAt: Date;
  executedBy: 'system' | 'admin';
  note: string;
  metadata?: Record<string, unknown>;
}

export type RiskActionType =
  | 'warn_user'
  | 'temporary_match_block'
  | 'credit_deduction'
  | 'message_censored'
  | 'account_suspension'
  | 'manual_review_required'
  | 'activity_blocked'
  | 'bubble_room_blocked';

export interface SensitiveWordHit {
  word: string;
  category: 'violence' | 'pornography' | 'scam' | 'harassment' | 'politics' | 'profanity';
  position: {
    start: number;
    end: number;
  };
}

export interface RiskReport {
  id: string;
  reporterId: string;
  targetUserId: string;
  category: 'harassment' | 'scam' | 'fake_profile' | 'inappropriate_content' | 'other';
  description: string;
  evidence: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface HighFrequencyMonitor {
  userId: string;
  windowStart: Date;
  matchCount: number;
  messageCount: number;
  roomJoinCount: number;
}
