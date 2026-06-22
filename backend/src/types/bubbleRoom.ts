export type BubbleRoomType = 'single' | 'youth' | 'fate_redpacket';

export type BubbleRoomStatus = 'waiting' | 'active' | 'closed';

export interface BubbleRoomMember {
  userId: string;
  joinedAt: Date;
  isHost: boolean;
  isReady: boolean;
  lastHeartbeat: Date;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

export interface BubbleRoom {
  id: string;
  hostId: string;
  roomType: BubbleRoomType;
  title: string;
  description: string;
  theme?: string;
  maxMembers: number;
  status: BubbleRoomStatus;
  members: BubbleRoomMember[];
  city: string;
  ageRange: {
    min: number;
    max: number;
  };
  genderPreference: 'any' | 'male_only' | 'female_only' | 'balanced';
  minCreditScore: number;
  tags: string[];
  redPacketRules?: RedPacketRules;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  closedAt?: Date;
  autoCloseAt: Date;
  messages: BubbleMessage[];
}

export interface RedPacketRules {
  totalAmount: number;
  packetCount: number;
  distributionType: 'random' | 'equal' | 'fate';
  minPerPacket: number;
  maxPerPacket: number;
  claimTimeout: number;
  conditions?: {
    mutualLike: boolean;
    tagMatch: number;
    creditScoreThreshold: number;
  };
}

export interface RedPacket {
  id: string;
  roomId: string;
  senderId: string;
  totalAmount: number;
  packetCount: number;
  distributionType: 'random' | 'equal' | 'fate';
  status: 'pending' | 'distributing' | 'distributed' | 'refunded';
  packets: IndividualPacket[];
  createdAt: Date;
  expiresAt: Date;
  encryptionKey: string;
}

export interface IndividualPacket {
  id: string;
  amount: number;
  claimerId?: string;
  claimedAt?: Date;
  revealed: boolean;
  encryptedAmount: string;
}

export type BubbleMessageType = 'text' | 'image' | 'redpacket' | 'system' | 'voice';

export interface BubbleMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: BubbleMessageType;
  content: string;
  redPacketId?: string;
  riskFlagged: boolean;
  riskReason?: string;
  createdAt: Date;
}

export interface BubbleRoomCreateInput {
  roomType: BubbleRoomType;
  title: string;
  description: string;
  theme?: string;
  maxMembers?: number;
  city: string;
  ageRange?: BubbleRoom['ageRange'];
  genderPreference?: BubbleRoom['genderPreference'];
  minCreditScore?: number;
  tags?: string[];
  redPacketRules?: RedPacketRules;
  autoCloseHours?: number;
}
