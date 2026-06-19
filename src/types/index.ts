export type Field = '汽车制造' | '零部件' | '新能源' | '智能驾驶'
export type SkillCategory = '硬技能' | '软技能' | '认证'
export type SkillLevel = '初级' | '中级' | '高级' | '专家'
export type JobStatus = '草稿' | '招聘中' | '已关闭'
export type ConstraintType = '车型项目经验' | '试验场测试经历' | 'IATF16949内审员' | '功能安全认证' | 'ASPICE认证'

export interface SkillTag {
  id: string
  name: string
  category: SkillCategory
  level: SkillLevel
  verified: boolean
}

export interface Certification {
  id: string
  name: string
  issuer: string
  validUntil: string
  mappedLevel: string
}

export interface ProjectExperience {
  id: string
  title: string
  company: string
  vehicleModel: string
  duration: string
  description: string
  skills: string[]
}

export interface Talent {
  id: string
  name: string
  email: string
  phone: string
  currentCompany: string
  experience: number
  field: Field
  skills: SkillTag[]
  certifications: Certification[]
  projectExperience: ProjectExperience[]
  location: string
  alumniNetwork: string[]
  previousCompanies: string[]
  createdAt: string
}

export interface SkillRequirement {
  id: string
  name: string
  category: SkillCategory
  required: boolean
  preferredLevel: string
}

export interface HardConstraint {
  id: string
  type: ConstraintType
  value: string
  required: boolean
}

export interface FunnelData {
  totalResumes: number
  screened: number
  interviewed: number
  offered: number
}

export interface Job {
  id: string
  title: string
  company: string
  field: Field
  location: string
  salaryMin: number
  salaryMax: number
  description: string
  skillRequirements: SkillRequirement[]
  hardConstraints: HardConstraint[]
  funnel: FunnelData
  status: JobStatus
  createdAt: string
}

export interface MatchResult {
  id: string
  talentId: string
  jobId: string
  talentName: string
  talentField: Field
  talentLocation: string
  talentCompany: string
  overallScore: number
  semanticScore: number
  networkScore: number
  regionScore: number
  matchedSkills?: string[]
  missingSkills?: string[]
  matchedConstraintTypes?: string[]
  sharedAlumniCount?: number
  sharedCompanies?: number
  talentExperience?: number
  clusterName?: string
  sameRegion?: boolean
}

export interface MatchDetail {
  overallScore: number
  semanticScore: number
  networkScore: number
  regionScore: number
  skillMatch: SkillMatchDetail[]
  networkOverlap: NetworkDetail
  regionAdvantage: RegionDetail
}

export interface SkillMatchDetail {
  skill: string
  jobRequired: string
  talentLevel: string
  matchScore: number
}

export interface NetworkDetail {
  sharedAlumni: number
  sharedCompanies: number
  warmthScore: number
}

export interface RegionDetail {
  talentLocation: string
  jobLocation: string
  clusterScore: number
  clusterName: string
}

export interface AnalyticsOverview {
  totalJobs: number
  totalTalents: number
  activeJobs: number
  totalMatches: number
  fieldDistribution: { field: string; count: number }[]
  locationDistribution: { location: string; count: number }[]
}

export interface FunnelAnalytics {
  total: { stage: string; count: number; rate: number }[]
  byField: { field: string; data: { stage: string; count: number; rate: number }[] }[]
}

export interface FillCycleData {
  monthly: { month: string; avgDays: number }[]
  byField: { field: string; avgDays: number }[]
}

export interface HeadhunterROI {
  byField: { field: string; recommendations: number; interviews: number; hires: number; cost: number; roi: number }[]
  overall: { totalCost: number; totalHires: number; avgCostPerHire: number }
  jobDetails: { jobId: string; jobTitle: string; recommendations: number; interviews: number; hires: number; cost: number }[]
}

export interface SkillNode {
  id: string
  name: string
  category: string
  level: number
  relatedSkills: string[]
  relatedCerts: string[]
  hotJobs: number
}

export interface CertMapping {
  id: string
  certification: string
  jobLevels: string[]
  requiredFor: string[]
}

export interface GapAnalysis {
  matched: { skill: string; jobLevel: string; talentLevel: string; score: number }[]
  unmatched: { skill: string; jobLevel: string }[]
  coverage: number
}
