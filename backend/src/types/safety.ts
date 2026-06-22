export type GuardianRelationStatus = 'pending' | 'active' | 'suspended' | 'terminated';

export type WhistleEventType =
  | 'heartbeat_missed'
  | 'manual_alert'
  | 'location_anomaly'
  | 'voice_anomaly'
  | 'activity_end_delay'
  | 'emergency_triggered';

export interface GuardianRelation {
  id: string;
  guarderId: string;
  guardianId: string;
  relationName: string;
  status: GuardianRelationStatus;
  mutual: boolean;
  permissionLevel: 'basic' | 'location' | 'full';
  createdAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  lastCheckInAt?: Date;
}

export interface SafetySession {
  id: string;
  userId: string;
  activityId?: string;
  guardianIds: string[];
  startTime: Date;
  endTime: Date;
  checkInInterval: number;
  status: 'active' | 'completed' | 'alarm' | 'emergency';
  heartbeatLogs: HeartbeatLog[];
  alerts: WhistleAlert[];
  aiComfortLogs: AIComfortLog[];
}

export interface HeartbeatLog {
  id: string;
  sessionId: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  batteryLevel: number;
  signalStrength: number;
  isManual: boolean;
}

export interface WhistleAlert {
  id: string;
  sessionId: string;
  eventType: WhistleEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNote?: string;
  emergencyContactNotified: boolean;
  aiVoiceInitiated: boolean;
  details: Record<string, unknown>;
}

export interface AIComfortLog {
  id: string;
  sessionId: string;
  alertId: string;
  triggeredAt: Date;
  conversationSummary: string;
  userMood: 'calm' | 'anxious' | 'scared' | 'unknown';
  escalationRecommended: boolean;
  callDuration: number;
  transcript: Array<{
    speaker: 'ai' | 'user';
    content: string;
    timestamp: Date;
  }>;
}

export interface GuardianRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  relationName: string;
  permissionLevel: GuardianRelation['permissionLevel'];
  mutual: boolean;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
}
