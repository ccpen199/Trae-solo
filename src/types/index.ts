export type UserRole = 'seeker' | 'hr' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: string
}

export interface ResumeSection {
  id: string
  type: 'personal' | 'education' | 'experience' | 'skills' | 'projects' | 'custom'
  order: number
  content: Record<string, unknown>
}

export interface KeywordDensity {
  keywords: { word: string; count: number; density: number }[]
  atsScore: number
}

export interface Resume {
  id: string
  userId: string
  title: string
  lang: 'zh' | 'en'
  templateId: string
  sections: ResumeSection[]
  keywordDensity: KeywordDensity
  createdAt: string
  updatedAt: string
}

export interface GrammarError {
  text: string
  offset: number
  length: number
  message: string
  suggestion: string
}

export interface FitnessScore {
  overall: number
  dimensions: { name: string; score: number; benchmark: number }[]
}

export interface Suggestion {
  priority: 'high' | 'medium' | 'low'
  category: string
  content: string
}

export interface DiagnosisResult {
  resumeId: string
  jdMatchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  grammarErrors: GrammarError[]
  fitnessScore: FitnessScore
  suggestions: Suggestion[]
}

export interface CaseSection {
  id: string
  type: 'personal' | 'education' | 'experience' | 'skills' | 'projects' | 'custom'
  title: string
  content: Record<string, unknown>
}

export interface ResumeCase {
  id: string
  industry: string
  level: string
  company: string
  summary: string
  highlights: string[]
  sections: CaseSection[]
  tags: string[]
}

export interface Interview {
  id: string
  date: string
  type: 'phone' | 'technical' | 'onsite' | 'hr'
  notes: string
}

export interface Offer {
  baseSalary: number
  bonus: string
  benefits: string[]
  equity: string
  deadline: string
}

export interface Application {
  id: string
  userId: string
  company: string
  position: string
  status: 'todo' | 'applied' | 'interview' | 'offer' | 'rejected'
  resumeId: string
  appliedAt: string
  interviews: Interview[]
  offer?: Offer
  notes: string
}

export interface ScoringCriteria {
  dimensions: { name: string; weight: number }[]
  thresholds: { autoReject: number; autoAdvance: number }
}

export interface CompanyTemplate {
  id: string
  companyId: string
  name: string
  sections: ResumeSection[]
  scoringCriteria: ScoringCriteria
}

export interface ComplianceSettings {
  dataMinimization: boolean
  encryptedStorage: boolean
  retentionDays: number
  noExternalTraining: boolean
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  timestamp: string
  details: string
}
