export interface MatchCriteria {
  userId: string;
  location?: {
    city: string;
    radiusKm: number;
  };
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: 'male' | 'female' | 'any';
  educationLevels?: string[];
  industries?: string[];
  interestTags?: string[];
  minCreditScore?: number;
  verifiedOnly?: boolean;
  maxMatches?: number;
  activityId?: string;
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
    custom: number;
  };
  matchingTags: string[];
  reasons: string[];
  matchedAt: Date;
  expiresAt: Date;
}

export interface MatchHistory {
  id: string;
  userId: string;
  criteria: MatchCriteria;
  results: MatchResult[];
  createdAt: Date;
}

export interface MutualMatch {
  id: string;
  userA: string;
  userB: string;
  userALiked: boolean;
  userBLiked: boolean;
  matched: boolean;
  matchedAt?: Date;
  createdAt: Date;
}
