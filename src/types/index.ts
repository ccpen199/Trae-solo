export type SceneMode = 'visa' | 'medical' | 'legal' | 'general' | 'education'

export type ProjectCategory = 'economic' | 'education' | 'tourism' | 'technology'

export type ProjectStage = 'planning' | 'negotiation' | 'implementation' | 'completed'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  nameZh: string
  nameIt: string
  role: string
  avatar?: string
}

export interface ProjectPartner {
  id: string
  nameZh: string
  nameIt: string
  organization: string
  role: string
  email: string
  phone?: string
}

export interface ProjectAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export interface Project {
  id: string
  titleZh: string
  titleIt: string
  category: ProjectCategory
  stage: ProjectStage
  descriptionZh: string
  descriptionIt: string
  budget: number
  currency: string
  startDate: string
  endDate?: string
  locationZh: string
  locationIt: string
  partners: ProjectPartner[]
  attachments: ProjectAttachment[]
  createdAt: string
  updatedAt: string
  authorId: string
}

export interface NewsItem {
  id: string
  titleZh: string
  titleIt: string
  summaryZh: string
  summaryIt: string
  contentZh: string
  contentIt: string
  category: ProjectCategory | 'general'
  coverImage?: string
  source: string
  publishedAt: string
  author: string
  views: number
}

export interface TermItem {
  id: string
  zh: string
  it: string
  category: 'economic' | 'education' | 'medical' | 'legal' | 'general'
  exampleZh?: string
  exampleIt?: string
}

export interface TranslateRequest {
  text: string
  source: 'zh' | 'it'
  target: 'zh' | 'it'
  scene?: SceneMode
}

export interface TranslateResponse {
  text: string
  detectedTerms?: TermItem[]
  confidence?: number
}

export interface ContentReview {
  id: string
  contentId: string
  contentType: 'project' | 'news' | 'translation'
  originalZh: string
  originalIt: string
  reviewerId: string
  status: ReviewStatus
  comments?: string
  reviewedAt: string
}

export interface TranslationHistoryItem {
  id: string
  sourceText: string
  targetText: string
  source: 'zh' | 'it'
  target: 'zh' | 'it'
  scene?: SceneMode
  timestamp: string
  userId?: string
}
