export interface User {
  id: number;
  phone: string;
  role: 'student' | 'parent' | 'teacher' | 'expert' | 'admin';
  name: string;
  avatar?: string;
  schoolName?: string;
  province?: string;
  relationship?: string;
  expertCertified?: boolean;
  createdAt: string;
}

export interface StudentProfile {
  id: number;
  userId: number;
  score: number;
  rank: number;
  province: string;
  subjects: string[];
  batch: string;
  targetCities: string[];
  createdAt: string;
}

export interface AssessmentResult {
  id: number;
  userId: number;
  holland: { R: number; I: number; A: number; S: number; E: number; C: number };
  mbti: string;
  createdAt: string;
}

export interface University {
  id: number;
  name: string;
  shortName: string;
  province: string;
  city: string;
  level: string;
  type: string;
  subjects: string[];
  masterPoints: number;
  doctorPoints: number;
  employmentRate: number;
  logoUrl?: string;
  description?: string;
  createdAt: string;
}

export interface Major {
  id: number;
  name: string;
  code: string;
  category: string;
  subjectRequirements: string[];
  employmentRate: number;
  avgSalary: number;
  courses: string[];
  description?: string;
  createdAt: string;
}

export interface AdmissionScore {
  id: number;
  universityId: number;
  majorId: number;
  year: number;
  province: string;
  minScore: number;
  maxScore?: number;
  avgScore?: number;
  minRank?: number;
  planCount?: number;
  createdAt: string;
}

export interface RecommendItem {
  id: number;
  universityId: number;
  majorId: number;
  probability: number;
  tier: 'reach' | 'stable' | 'safe';
  score: number;
  matchReasons: string[];
  createdAt: string;
}

export interface PlanItem {
  id: number;
  planId: number;
  universityId: number;
  majorId: number;
  order: number;
  tier: 'reach' | 'stable' | 'safe';
  probability: number;
  matchReasons?: string[];
  createdAt: string;
}

export interface VolunteerPlan {
  id: number;
  userId: number;
  name: string;
  items: PlanItem[];
  riskLevel: 'low' | 'medium' | 'high';
  slipRisk?: number;
  adjustmentRisk?: number;
  conflictWarnings: string[];
  createdAt: string;
}

export interface CollaborationSpace {
  id: number;
  ownerId: number;
  name: string;
  planId?: number;
  createdAt: string;
}

export interface CollaborationMember {
  id: number;
  spaceId: number;
  userId: number;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: string;
}

export interface DiscussionMessage {
  id: number;
  spaceId: number;
  userId: number;
  content: string;
  itemId?: number;
  createdAt: string;
}

export interface QAQuestion {
  id: number;
  userId: number;
  title: string;
  content: string;
  category?: string;
  status: 'pending' | 'approved' | 'rejected' | 'answered' | 'resolved' | 'closed';
  viewCount: number;
  createdAt: string;
}

export interface QAAnswer {
  id: number;
  questionId: number;
  userId: number;
  content: string;
  isExpert: boolean;
  likeCount: number;
  createdAt: string;
}

export interface LiveSession {
  id: number;
  expertId: number;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'live' | 'ended';
  streamUrl?: string;
  playbackUrl?: string;
  createdAt: string;
}

export interface LiveReservation {
  id: number;
  sessionId: number;
  userId: number;
  createdAt: string;
}

export interface AdminStatistics {
  totalUsers: number;
  totalPlans: number;
  totalQuestions: number;
  totalLiveSessions: number;
  userRoleBreakdown: Record<string, number>;
  recentActivity: {
    last7DaysNewUsers: number;
    last7DaysNewPlans: number;
    last7DaysNewQuestions: number;
  };
}

export interface HeatmapData {
  date: string;
  searchCount: number;
  applyCount: number;
}

export interface GenerateRecommendRequest {
  profile: StudentProfile;
  assessment: AssessmentResult;
  preferences: {
    universityWeight: number;
    majorWeight: number;
    cityWeight: number;
    employmentWeight: number;
    familyWishes?: string;
  };
}

export interface GenerateRecommendResponse {
  success: boolean;
  data: {
    reach: RecommendItem[];
    stable: RecommendItem[];
    safe: RecommendItem[];
    conflictWarnings: string[];
  };
}

export interface GetAdmissionScoresResponse {
  success: boolean;
  data: {
    university: University;
    scores: Array<{
      year: number;
      major: Major;
      minScore: number;
      minRank?: number;
    }>;
  };
}

export interface AnalyzePlanRequest {
  planItems: Array<{
    universityId: number;
    majorId: number;
    order: number;
  }>;
  studentProfile: StudentProfile;
}

export interface AnalyzePlanResponse {
  success: boolean;
  data: {
    overallProbability: number;
    slipRisk: number;
    adjustmentRisk: number;
    conflicts: string[];
    suggestions: string[];
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}
