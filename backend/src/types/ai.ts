export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'voice' | 'system';
  content: string;
  riskFlagged: boolean;
  riskReason?: string;
  createdAt: Date;
  read: boolean;
  readAt?: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: Date;
  updatedAt: Date;
  unreadCount: Record<string, number>;
  isMutualMatch: boolean;
}

export interface FriendRelationship {
  id: string;
  userA: string;
  userB: string;
  status: 'pending' | 'accepted' | 'blocked' | 'removed';
  mutualMatches: number;
  activitiesTogether: number;
  friendshipScore: number;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface ChatMemoryEntry {
  id: string;
  conversationId: string;
  userId: string;
  topic: string;
  entities: string[];
  mentionedInterests: string[];
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'excited' | 'anxious';
  timestamp: Date;
  summary: string;
}

export interface TopicSuggestion {
  id: string;
  suggestion: string;
  category: 'interest_based' | 'activity_based' | 'memory_based' | 'icebreaker' | 'deep_talk';
  confidence: number;
  reasoning: string;
  referencedMemoryIds?: string[];
}

export interface AIChatContext {
  conversationId: string;
  participants: {
    userId: string;
    profileSummary: string;
    interests: string[];
  }[];
  recentMemories: ChatMemoryEntry[];
  commonTopics: string[];
  suggestedTopics: TopicSuggestion[];
  lastGeneratedAt: Date;
}
