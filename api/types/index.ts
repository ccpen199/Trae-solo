export type UserRole = 'student' | 'parent' | 'teacher' | 'expert' | 'admin'

export type PlanTier = 'reach' | 'stable' | 'safe'

export type RiskLevel = 'low' | 'medium' | 'high'

export type QuestionStatus = 'pending' | 'approved' | 'rejected' | 'answered' | 'resolved' | 'closed'

export type LiveStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

export type UniversityLevel = '985' | '211' | '双一流' | '普通本科' | '专科'

export type UniversityType = '综合' | '理工' | '师范' | '医药' | '农林' | '财经' | '政法' | '语言' | '艺术' | '体育'

export type MajorCategory = '工学' | '理学' | '医学' | '文学' | '经济学' | '管理学' | '法学' | '教育学' | '历史学' | '哲学' | '农学' | '艺术学'

export interface User {
  id: number
  phone: string
  role: UserRole
  name: string
  password_hash: string
  avatar?: string
  school_name?: string
  province?: string
  relationship?: string
  expert_certified: boolean
  created_at: string
}

export interface StudentProfile {
  id: number
  user_id: number
  score: number
  rank: number
  province: string
  subjects: string
  batch: string
  target_cities?: string
  created_at: string
}

export interface AssessmentResult {
  id: number
  user_id: number
  holland_scores: string
  mbti_type?: string
  created_at: string
}

export interface University {
  id: number
  name: string
  short_name?: string
  province: string
  city: string
  level?: UniversityLevel
  type?: UniversityType
  subjects?: string
  master_points: number
  doctor_points: number
  employment_rate?: number
  logo_url?: string
  description?: string
  created_at: string
}

export interface Major {
  id: number
  name: string
  code: string
  category?: MajorCategory
  subject_requirements?: string
  employment_rate?: number
  avg_salary?: number
  courses?: string
  description?: string
  created_at: string
}

export interface AdmissionScore {
  id: number
  university_id: number
  major_id: number
  year: number
  province: string
  min_score: number
  max_score?: number
  avg_score?: number
  min_rank?: number
  plan_count?: number
  created_at: string
}

export interface VolunteerPlan {
  id: number
  user_id: number
  name: string
  slip_risk?: number
  adjustment_risk?: number
  conflict_warnings?: string
  created_at: string
}

export interface PlanItem {
  id: number
  plan_id: number
  university_id: number
  major_id: number
  order_index: number
  tier: PlanTier
  probability: number
  match_reasons?: string
  created_at: string
}

export interface CollaborationSpace {
  id: number
  owner_id: number
  name: string
  plan_id?: number
  created_at: string
}

export interface CollaborationMember {
  id: number
  space_id: number
  user_id: number
  role: string
  created_at: string
}

export interface DiscussionMessage {
  id: number
  space_id: number
  user_id: number
  content: string
  item_id?: number
  created_at: string
}

export interface QaQuestion {
  id: number
  user_id: number
  title: string
  content: string
  category?: string
  status: QuestionStatus
  view_count: number
  created_at: string
}

export interface QaAnswer {
  id: number
  question_id: number
  user_id: number
  content: string
  is_expert: boolean
  like_count: number
  created_at: string
}

export interface LiveSession {
  id: number
  expert_id: number
  title: string
  description?: string
  scheduled_at: string
  duration: number
  status: LiveStatus
  stream_url?: string
  playback_url?: string
  created_at: string
}

export interface LiveReservation {
  id: number
  session_id: number
  user_id: number
  created_at: string
}

export interface ProvinceHeatmap {
  id: number
  province: string
  university_id?: number
  search_count: number
  application_count: number
  date: string
  created_at: string
}

export interface HollandScores {
  R: number
  I: number
  A: number
  S: number
  E: number
  C: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
  }
}

export interface JwtPayload {
  userId: number
  role: UserRole
  phone: string
}

export interface StudentProfileInput {
  score: number
  rank: number
  province: string
  subjects: string[]
  batch: string
  targetCities?: string[]
}

export interface GenerateRecommendRequest {
  profile: StudentProfileInput
  assessment: {
    holland: HollandScores
    mbti: string
  }
  preferences: {
    universityWeight: number
    majorWeight: number
    cityWeight: number
    employmentWeight: number
    familyWishes?: string
  }
}

export interface RecommendItemResult {
  universityId: number
  universityName: string
  majorId: number
  majorName: string
  probability: number
  tier: PlanTier
  score: number
  matchReasons: string[]
}

export interface GenerateRecommendResponse {
  reach: RecommendItemResult[]
  stable: RecommendItemResult[]
  safe: RecommendItemResult[]
  conflictWarnings: string[]
}

export interface AnalyzePlanResponse {
  overallProbability: number
  slipRisk: number
  adjustmentRisk: number
  conflicts: string[]
  suggestions: string[]
}

export type DatabaseRow =
  | User
  | StudentProfile
  | AssessmentResult
  | University
  | Major
  | AdmissionScore
  | VolunteerPlan
  | PlanItem
  | CollaborationSpace
  | CollaborationMember
  | DiscussionMessage
  | QaQuestion
  | QaAnswer
  | LiveSession
  | LiveReservation
  | ProvinceHeatmap
