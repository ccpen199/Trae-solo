export type UserRole = 'enterprise' | 'jobseeker' | 'admin';

export interface User {
  id: number;
  email: string;
  password?: string;
  role: UserRole;
  name?: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  companies?: Company[];
  resumes?: Resume[];
  posts?: CommunityPost[];
}

export interface Company {
  id: number;
  userId: number;
  companyName: string;
  industry?: string;
  scale?: string;
  address?: string;
  licenseNo?: string;
  description?: string;
  certifications?: Record<string, unknown>;
  status: string;
  createdAt: Date;
  user?: User;
  jobs?: Job[];
  credits?: CompanyCredit[];
  interviews?: InterviewSchedule[];
}

export interface Job {
  id: number;
  companyId: number;
  title: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  workLocation?: string;
  jobType?: string;
  processRequirements?: {
    printingMethod?: string;
    colorGroupRequirement?: string;
    precisionRequirement?: string;
    [key: string]: unknown;
  };
  equipmentModels?: {
    heidelberg?: string[];
    komori?: string[];
    roland?: string[];
    other?: string[];
    [key: string]: unknown;
  };
  materialStandards?: {
    paperType?: string;
    inkStandard?: string;
    laminationRequirement?: string;
    [key: string]: unknown;
  };
  requiredSkills?: string[];
  experienceYears?: string;
  education?: string;
  description?: string;
  status: string;
  createdAt: Date;
  company?: Company;
  interviews?: InterviewSchedule[];
  matches?: JobMatch[];
}

export interface Resume {
  id: number;
  userId: number;
  name: string;
  gender?: string;
  age?: number;
  phone: string;
  email: string;
  education?: string;
  workExperience?: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    gravureExperienceYears?: number;
    offsetExperienceYears?: number;
    flexoExperienceYears?: number;
    description?: string;
    [key: string]: unknown;
  }>;
  skills?: Array<{
    name?: string;
    psPlateSoftwareProficiency?: number;
    ctpOperationProficiency?: number;
    colorManagementProficiency?: number;
    [key: string]: unknown;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    isoCertificationExperience?: string;
    [key: string]: unknown;
  }>;
  expectedSalary?: number;
  expectedPosition?: string;
  portfolio?: Array<{
    title?: string;
    description?: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    [key: string]: unknown;
  }>;
  aiParsedData?: Record<string, unknown>;
  parseScore?: number;
  updatedAt: Date;
  user?: User;
  portfolios?: Portfolio[];
  matches?: JobMatch[];
}

export type SkillCategory = 'prepress' | 'printing' | 'postpress' | 'management';

export interface Skill {
  id: number;
  name: string;
  category: SkillCategory;
  description?: string;
  relatedSkills?: string[];
}

export interface CommunityPost {
  id: number;
  userId: number;
  title: string;
  content: string;
  tags?: string[];
  images?: string[];
  likes: number;
  commentsCount: number;
  status: string;
  createdAt: Date;
  user?: User;
  comments?: PostComment[];
}

export interface PostComment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  user?: User;
}

export interface InterviewSchedule {
  id: number;
  jobId: number;
  jobseekerId: number;
  companyId: number;
  interviewTime: Date;
  location?: string;
  interviewer?: string;
  status: string;
  calendarSynced: boolean;
  icsData?: string;
  createdAt: Date;
  job?: Job;
  jobseeker?: User;
  company?: Company;
}

export interface CompanyCredit {
  id: number;
  companyId: number;
  complianceScore?: number;
  socialSecurityRate?: number;
  turnoverRate?: number;
  salaryOnTimeRate?: number;
  overtimeCompliance?: number;
  overallRating?: number;
  evaluationPeriod?: string;
  createdAt: Date;
  company?: Company;
}

export type SensitiveWordCategory = 'salary_promise' | 'overtime_culture' | 'false_publicity' | 'other';

export interface SensitiveWord {
  id: number;
  word: string;
  category: SensitiveWordCategory;
  riskLevel: string;
  replacement?: string;
  enabled: boolean;
}

export type PortfolioType = 'prepress' | 'printing' | 'postpress';

export interface Portfolio {
  id: number;
  resumeId: number;
  type: PortfolioType;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  createdAt: Date;
  resume?: Resume;
}

export interface JobMatch {
  id: number;
  jobId: number;
  resumeId: number;
  similarityScore?: number;
  skillMatchScore?: number;
  experienceMatchScore?: number;
  recommendedAt: Date;
  status: string;
  job?: Job;
  resume?: Resume;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecommendationResponse {
  jobId: number;
  jobTitle: string;
  totalCandidates: number;
  recommendations: Array<{
    resumeId: number;
    resume: Resume;
    similarityScore: number;
    skillMatch: number;
    experienceMatch: number;
    matchedSkills: string[];
  }>;
}
