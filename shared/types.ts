export type UserRole = 'student' | 'enterprise' | 'mentor' | 'admin'

export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  role: UserRole
  avatar?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface StudentProfile {
  id: number
  user_id: number
  real_name: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  school: string
  major: string
  grade: string
  gpa?: number
  skills?: string
  resume_url?: string
  self_intro?: string
  target_position?: string
  target_city?: string
  expected_salary?: string
  created_at: string
  updated_at: string
}

export interface EnterpriseProfile {
  id: number
  user_id: number
  company_name: string
  industry?: string
  scale?: string
  logo_url?: string
  website?: string
  description?: string
  address?: string
  contact_name?: string
  contact_phone?: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface Mentor {
  id: number
  user_id: number
  real_name: string
  company: string
  position: string
  expertise?: string
  experience_years?: number
  bio?: string
  avatar_url?: string
  rating?: number
  created_at: string
  updated_at: string
}

export type JobStatus = 'open' | 'closed' | 'paused'
export type JobType = 'intern' | 'fulltime' | 'parttime'

export interface Job {
  id: number
  enterprise_id: number
  title: string
  type: JobType
  department?: string
  city: string
  salary_min?: number
  salary_max?: number
  description: string
  requirements?: string
  benefits?: string
  status: JobStatus
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
}

export type ApplicationStatus = 'pending' | 'reviewed' | 'interview' | 'offer' | 'rejected'

export interface Application {
  id: number
  job_id: number
  student_id: number
  enterprise_id: number
  status: ApplicationStatus
  cover_letter?: string
  resume_snapshot?: string
  created_at: string
  updated_at: string
}

export type ReferralStatus = 'available' | 'claimed' | 'expired'

export interface Referral {
  id: number
  mentor_id: number
  company_id: number
  company_name: string
  position: string
  bonus?: string
  description?: string
  status: ReferralStatus
  claimed_by?: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: number
  author_id: number
  author_name: string
  title: string
  content: string
  tags?: string
  views_count: number
  answers_count: number
  likes_count: number
  created_at: string
  updated_at: string
}

export interface Answer {
  id: number
  question_id: number
  author_id: number
  author_name: string
  content: string
  likes_count: number
  is_accepted: boolean
  created_at: string
  updated_at: string
}

export interface CompanyRadar {
  id: number
  company_id?: number
  company_name: string
  industry: string
  overall_score: number
  culture_score: number
  growth_score: number
  salary_score: number
  work_life_score: number
  reviews_count: number
  description?: string
  updated_at: string
}

export interface JournalEntry {
  id: number
  student_id: number
  title: string
  content: string
  mood?: string
  tags?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface AssessmentReport {
  id: number
  student_id: number
  report_type: string
  title: string
  summary?: string
  scores?: string
  details?: string
  suggestions?: string
  created_at: string
}

export interface Certificate {
  id: number
  student_id: number
  title: string
  issuer: string
  issue_date: string
  certificate_url?: string
  description?: string
  created_at: string
}

export interface Project {
  id: number
  student_id: number
  name: string
  role?: string
  start_date?: string
  end_date?: string
  description?: string
  tech_stack?: string
  link?: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role: UserRole
}

export interface JwtPayload {
  userId: number
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
