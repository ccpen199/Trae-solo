export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  age: number;
  bio: string;
  phone?: string;
  location: {
    city: string;
    district: string;
    latitude: number;
    longitude: number;
  };
  verification: {
    verified: boolean;
    faceVerified: boolean;
  };
  education: {
    school: string;
    level: string;
    major: string;
    graduationYear: number;
    verified: boolean;
  };
  career: {
    company: string;
    position: string;
    industry: string;
    yearsOfExperience: number;
    verified: boolean;
  };
  interestTags: string[];
  creditScore: number;
  creditRecords?: CreditRecord[];
  emergencyContact?: { name: string; phone: string; relationship: string };
  privacySettings: {
    showRealName: boolean;
    showEducation: boolean;
    showCareer: boolean;
    showLocation: boolean;
    allowMatch: boolean;
  };
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  lastActiveAt: string;
}

export interface CreditRecord {
  id: string;
  type: string;
  scoreChange: number;
  reason: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  location: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  startTime: string;
  endTime: string;
  meetingTime: string;
  maxParticipants: number;
  minParticipants: number;
  feePerPerson: number;
  genderPreference: string;
  ageRange: { min: number; max: number };
  minCreditScore: number;
  status: 'draft' | 'recruiting' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  participants: ActivityParticipant[];
  images: string[];
  createdAt: string;
}

export interface ActivityParticipant {
  userId: string;
  status: string;
  appliedAt: string;
  feedbackScore?: number;
  nickname?: string;
  avatar?: string;
  user?: User;
}

export interface BubbleRoom {
  id: string;
  hostId: string;
  roomType: 'single' | 'youth' | 'fate_redpacket';
  title: string;
  city: string;
  maxMembers: number;
  currentMembers?: number;
  status: 'waiting' | 'active' | 'closed';
  tags: string[];
  theme?: string;
  minCreditScore?: number;
  host?: { id: string; nickname: string; avatar: string };
  members?: BubbleMember[];
  redPacketRules?: {
    totalAmount: number;
    packetCount: number;
    distributionType: string;
  };
  messages?: BubbleMessage[];
}

export interface BubbleMember {
  userId: string;
  joinedAt: string;
  isHost: boolean;
  micEnabled: boolean;
  user?: {
    id: string;
    nickname: string;
    avatar: string;
    creditScore: number;
  };
}

export interface BubbleMessage {
  id: string;
  senderId: string;
  type: 'text' | 'image' | 'redpacket' | 'system' | 'voice';
  content: string;
  createdAt: string;
  redPacketId?: string;
  sender?: { id: string; nickname: string; avatar: string };
}

export interface MatchResult {
  targetUserId: string;
  overallScore: number;
  scoreBreakdown: {
    location: number;
    education: number;
    career: number;
    interests: number;
    credit: number;
  };
  matchingTags: string[];
  reasons: string[];
  user?: User;
}

export interface MatchCardData {
  user: {
    id: string;
    nickname: string;
    avatar: string;
    age: number;
    gender: string;
    city: string;
    school: string;
    industry: string;
    position?: string;
    interests: string[];
    creditScore: number;
    verified: boolean;
    bio: string;
  };
  matchScore: number;
  reasons: string[];
}

export interface SafetySession {
  id: string;
  userId: string;
  guardianIds: string[];
  startTime: string;
  endTime: string;
  checkInInterval: number;
  status: 'active' | 'completed' | 'alarm' | 'emergency';
  alerts?: WhistleAlert[];
  guardianProfiles?: { id: string; nickname: string; avatar: string; phone: string }[];
}

export interface WhistleAlert {
  id: string;
  sessionId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: string;
  acknowledged: boolean;
  resolved: boolean;
  emergencyContactNotified: boolean;
  aiVoiceInitiated: boolean;
  details: Record<string, unknown>;
}

export interface GuardianRelation {
  relation: {
    id: string;
    guarderId: string;
    guardianId: string;
    relationName: string;
    status: string;
    permissionLevel: string;
    mutual: boolean;
  };
  user: {
    id: string;
    nickname: string;
    avatar: string;
    age: number;
    city: string;
    phone: string;
  } | null;
  direction: 'i_guard' | 'guards_me';
}

export interface TopicSuggestion {
  id: string;
  suggestion: string;
  category: string;
  confidence: number;
  reasoning: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  updatedAt: string;
  otherUser?: {
    id: string;
    nickname: string;
    avatar: string;
    age: number;
    city: string;
    creditScore: number;
    online: boolean;
  };
  unread: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  type: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Coupon {
  id: string;
  externalId: string;
  merchantName: string;
  category: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  city: string;
  tags: string[];
  validFrom: string;
  validUntil: string;
  stock: number;
  soldCount: number;
  averageRating: number;
}

export interface CouponOrder {
  id: string;
  userId: string;
  couponId: string;
  externalOrderId: string;
  activityId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  redemptionCode: string;
  redemptionStatus: 'pending' | 'redeemed' | 'expired' | 'refunded';
  expiresAt: string;
  createdAt: string;
  coupon?: Coupon;
}

export interface RiskStatus {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  monitor?: {
    userId: string;
    matchCount: number;
    messageCount: number;
  };
  openEvents: number;
  recommendations: string[];
}

export interface ActivityCreateInput {
  title: string;
  description: string;
  category: string;
  tags: string[];
  location: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  startTime: string;
  endTime: string;
  meetingTime: string;
  maxParticipants: number;
  minParticipants: number;
  feePerPerson: number;
  genderPreference: string;
  ageRange: { min: number; max: number };
  minCreditScore: number;
  linkedCouponIds: string[];
}

