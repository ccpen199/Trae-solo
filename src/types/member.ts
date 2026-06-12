export type MemberLevel = 1 | 2 | 3 | 4 | 5;

export interface MemberBenefit {
  id: string;
  type: 'discount' | 'free_service' | 'priority_channel' | 'points_multiplier' | 'birthday_gift';
  name: string;
  description: string;
  icon: string;
  minLevel: MemberLevel;
}

export interface MemberProfile {
  ownerId: string;
  level: MemberLevel;
  levelName: string;
  growthValue: number;
  nextLevelGrowth: number;
  points: number;
  totalSpent: number;
  memberSince: string;
  benefits: MemberBenefit[];
}

export interface PointsTransaction {
  id: string;
  ownerId: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  relatedId?: string;
  createdAt: string;
}

export type ConsultType = 'text' | 'video';
export type ConsultStatus = 'waiting' | 'in_progress' | 'completed' | 'expired';

export interface ConsultMessage {
  id: string;
  sessionId: string;
  senderType: 'owner' | 'veterinarian' | 'system';
  senderId: string;
  messageType: 'text' | 'image' | 'prescription' | 'record';
  content: string;
  createdAt: string;
  relatedRecordId?: string;
}

export interface ConsultSession {
  id: string;
  orderNo: string;
  ownerId: string;
  veterinarianId: string;
  petId: string;
  type: ConsultType;
  status: ConsultStatus;
  question: string;
  images?: string[];
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  amount: number;
  isPriorityChannel: boolean;
  messages: ConsultMessage[];
}
