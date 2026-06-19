export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HardSkill {
  id: string;
  name: string;
  category: string;
  priority: 'must' | 'important' | 'nice';
  targetLevel: 1 | 2 | 3 | 4 | 5;
  description: string;
}

export interface SoftSkill {
  id: string;
  name: string;
  dimension: 'communication' | 'leadership' | 'thinking' | 'execution' | 'emotional';
  targetLevel: 1 | 2 | 3 | 4 | 5;
  behavioralIndicators: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedHours: number;
  relevance: number;
}

export interface CompetencyModel {
  jobId: string;
  jobName: string;
  jobLevel: 'entry' | 'junior' | 'middle' | 'senior' | 'expert' | 'lead';
  hardSkills: HardSkill[];
  softSkills: SoftSkill[];
  certifications: Certification[];
  yearsOfExperience: { min: number; ideal: number };
  educationRequirement: string;
  industryKnowledge: string[];
}

export interface PromotionNode {
  id: string;
  jobName: string;
  level: string;
  estimatedMonths: number;
  keyThresholds: string[];
  avgSalaryRange: [number, number];
}

export interface PromotionPath {
  fromJobId: string;
  nodes: PromotionNode[];
  totalEstimatedMonths: number;
}

export interface SelfAssessment {
  targetJobId: string;
  targetJobLevel: string;
  hardSkillRatings: Record<string, 1 | 2 | 3 | 4 | 5>;
  softSkillRatings: Record<string, 1 | 2 | 3 | 4 | 5>;
  yearsOfExperience: number;
  certificationsHeld: string[];
  salaryExpectation: [number, number];
  preferredCities: string[];
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedAction: string;
}

export interface DiagnosisReport {
  id: string;
  createdAt: string;
  targetJob: { id: string; name: string; level: string };
  overallMatchScore: number;
  radarDimensions: {
    dimension: string;
    current: number;
    target: number;
  }[];
  hardSkillGaps: SkillGap[];
  softSkillGaps: SkillGap[];
  certificationRecommendations: Certification[];
  promotionPath: PromotionPath;
  estimatedReadinessMonths: number;
  learningPlan: {
    phase: string;
    durationWeeks: number;
    tasks: string[];
  }[];
}

export interface GrowthTags {
  hasTrainingSystem: boolean;
  hasRotationProgram: boolean;
  techStackEvolution: 'stable' | 'growing' | 'leading';
  mentorshipProgram: boolean;
  promotionPathClear: boolean;
  learningBudget: boolean;
}

export interface ImplicitSignals {
  techBlogFrequency: 'none' | 'low' | 'medium' | 'high';
  openSourceContributions: number;
  employeeLevelDistribution: {
    entry: number;
    junior: number;
    middle: number;
    senior: number;
    expert: number;
    lead: number;
  };
  avgTenureMonths: number;
  internalPromotionRate: number;
}

export interface JobPost {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    size: string;
    industry: string;
    logo: string;
  };
  requiredCompetencyModelId: string;
  salaryRange: [number, number];
  city: string;
  description: string;
  growthTags: GrowthTags;
  implicitSignals: ImplicitSignals;
  matchScore?: number;
  matchBreakdown?: {
    competency: number;
    growth: number;
    preference: number;
    implicit: number;
  };
  publishedAt: string;
}

export interface WorkflowStep {
  title: string;
  description: string;
  duration: string;
  tools: string[];
}

export interface Interview {
  id: string;
  jobName: string;
  intervieweeName: string;
  yearsOfExperience: number;
  currentLevel: string;
  audioUrl: string;
  durationSeconds: number;
  transcript: string;
  keyInsights: string[];
  tags: string[];
}

export interface EntryThresholdStep {
  step: number;
  title: string;
  description: string;
  estimatedMonths: number;
  typicalObstacles: string[];
}

export interface EncyclopediaEntry {
  jobId: string;
  jobName: string;
  category: string;
  overview: string;
  avgSalaryDistribution: { city: string; avg: number }[];
  workflow: WorkflowStep[];
  workflowVideoUrl: string;
  interviews: Interview[];
  entryThresholdLadder: EntryThresholdStep[];
  careerProspects: string;
}

export interface EncyclopediaJobCard {
  id: string;
  name: string;
  industry: string;
  category: string;
  overview: string;
  avgSalary: number;
  entryDifficulty: 1 | 2 | 3 | 4 | 5;
  demandGrowth: number;
  avatarUrls: string[];
}

export interface InterviewCard {
  id: string;
  jobId: string;
  jobName: string;
  intervieweeName: string;
  avatar: string;
  yearsOfExperience: number;
  currentLevel: string;
  city?: string;
  quote: string;
  tags: string[];
}

export interface CertificationCard {
  id: string;
  name: string;
  issuer: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedHours: number;
  passRate: number;
  relevance: number;
  relatedJobs: string[];
}

export interface CareerDirection {
  id: string;
  title: string;
  type: 'vertical' | 'horizontal' | 'expert' | 'management';
  description: string;
  targetRoles: string[];
  typicalYears: number;
  avgSalary: [number, number];
}

export interface WorkflowStepDetail extends WorkflowStep {
  timeOfDay: string;
}

export interface SalaryTrendPoint {
  level: string;
  avgSalary: number;
}

export interface PractitionerInterview {
  id: string;
  intervieweeName: string;
  avatar: string;
  jobName: string;
  currentLevel: string;
  yearsOfExperience: number;
  city: string;
  audioUrl: string;
  durationSeconds: number;
  transcript: string;
  coreInsights: { text: string; highlight: boolean }[];
  tags: string[];
}

export interface GrowthAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface GrowthTimelineNode {
  date: string;
  type: 'diagnosis' | 'skill-up' | 'certification' | 'interview' | 'job-offer';
  title: string;
  description: string;
  relatedSkill?: string;
}

export interface UserProfile {
  id: string;
  role: 'jobseeker' | 'hr' | 'admin';
  name: string;
  email: string;
  avatar: string;
  jobseekerProfile?: {
    currentJob?: string;
    currentLevel?: string;
    yearsOfExperience: number;
    skills: { id: string; name: string; level: number }[];
    certifications: { id: string; name: string; date: string }[];
    targetJobId?: string;
    resumeUrl?: string;
  };
  hrProfile?: {
    companyId: string;
    companyName: string;
    position: string;
    verified: boolean;
  };
  growthTimeline: GrowthTimelineNode[];
  achievements: GrowthAchievement[];
}

export type PotentialLevel = 'S' | 'A' | 'B' | 'C';

export interface TalentPoolEntry {
  id: string;
  userId: string;
  userSummary: {
    name: string;
    avatar: string;
    currentJob: string;
    yearsOfExperience: number;
    keySkills: string[];
    matchScore: number;
  };
  potentialLevel: PotentialLevel;
  tags: string[];
  status: 'new' | 'contacted' | 'screening' | 'interview' | 'offer' | 'archived';
  lastFollowUpAt?: string;
  nextFollowUpAt?: string;
  notes: string;
  addedAt: string;
  matchJobs: { jobId: string; jobTitle: string; score: number }[];
}

export interface FollowUpReminder {
  id: string;
  talentId: string;
  scheduledAt: string;
  type: 'call' | 'email' | 'interview' | 'check-in';
  note: string;
  completed: boolean;
}

export interface JobWarning {
  id: string;
  jobPostId: string;
  jobTitle: string;
  type: 'competition-intensified' | 'prolonged-hiring' | 'skill-shortage' | 'market-shift';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestion: string;
  dataPoint: Record<string, any>;
  detectedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role?: 'jobseeker' | 'hr';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'jobseeker' | 'hr';
  companyName?: string;
  position?: string;
  companySize?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface TagTalentRequest {
  potentialLevel: PotentialLevel;
  tags?: string[];
}

export interface CreateFollowUpRequest {
  talentId: string;
  scheduledAt: string;
  type: 'call' | 'email' | 'interview' | 'check-in';
  note: string;
}

export interface JobFilters {
  keyword?: string;
  cities?: string[];
  salaryMin?: number;
  salaryMax?: number;
  industries?: string[];
  growthTags?: (keyof GrowthTags)[];
  jobLevels?: string[];
  sortBy?: 'match' | 'salary' | 'published' | 'growth';
}

export type JobLevel = 'entry' | 'junior' | 'middle' | 'senior' | 'expert' | 'lead';
export type SkillPriority = 'must' | 'important' | 'nice';
export type SkillLevel = 1 | 2 | 3 | 4 | 5;
export type SoftSkillDimension = 'communication' | 'leadership' | 'thinking' | 'execution' | 'emotional';
export type CertificationDifficulty = 'basic' | 'intermediate' | 'advanced';
export type GapPriority = 'critical' | 'high' | 'medium' | 'low';
export type TechStackEvolution = 'stable' | 'growing' | 'leading';
export type FrequencyLevel = 'none' | 'low' | 'medium' | 'high';
export type UserRole = 'jobseeker' | 'hr' | 'admin';
export type GrowthTimelineType = 'diagnosis' | 'skill-up' | 'certification' | 'interview' | 'job-offer';
export type TalentStatus = 'new' | 'contacted' | 'screening' | 'interview' | 'offer' | 'archived';
export type FollowUpType = 'call' | 'email' | 'interview' | 'check-in';
export type WarningType = 'competition-intensified' | 'prolonged-hiring' | 'skill-shortage' | 'market-shift';
export type WarningSeverity = 'info' | 'warning' | 'critical';

export interface JobRole {
  id: string;
  name: string;
  level: JobLevel;
  avgSalary: number;
  hotness: number;
}

export interface JobCategory {
  id: string;
  name: string;
  jobs: JobRole[];
}

export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  categories: JobCategory[];
}

export interface MatchBreakdown {
  competency: number;
  growth: number;
  preference: number;
  implicit: number;
}
