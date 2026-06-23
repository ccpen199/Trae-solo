import type { User, Master, CaseStudy, NamingInput, BaZiResult, NameProposal } from '../../shared/types'
import { masters as seedMasters } from '../data/masters.js'
import { cases as seedCases } from '../data/cases.js'

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): { items: T[]; total: number; page: number; pageSize: number } {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize
  }
}

interface UserRow {
  id: string
  phone: string
  nickname: string
  avatar?: string
  role: 'user' | 'member' | 'master' | 'admin'
  passwordHash?: string
  createdAt: string
  updatedAt: string
}

interface Membership {
  id: string
  userId: string
  plan: string
  expireAt: string
  createdAt: string
}

interface MasterProfile {
  id: string
  userId: string
  name: string
  title?: string
  specialties?: string
  experienceYears: number
  introduction?: string
  certificates?: string
  status: 'pending' | 'approved' | 'rejected' | 'disabled'
  appliedAt: string
  reviewedAt?: string
}

interface NamingHistory {
  id: string
  userId: string | null
  inputJson: string
  baziResultJson: string | null
  createdAt: string
}

interface NameProposalRow {
  id: string
  namingHistoryId: string
  fullName: string
  pinyin: string
  overallScore: number
  auspiciousnessScore: number
  uniquenessScore: number
  writingScore: number
  phoneticScore: number
  charactersJson: string
  phoneticAnalysisJson: string
  duplicateTotal: number
  explanation: string
}

interface Favorite {
  id: string
  userId: string
  targetType: string
  targetId: string
  createdAt: string
}

interface CaseStudyRow {
  id: string
  masterId?: string
  namingHistoryId?: string
  finalName: string
  explanation?: string
  isAuthorized: number
  likes: number
  status: 'pending' | 'published' | 'rejected'
  createdAt: string
}

interface MasterReview {
  id: string
  masterId: string
  userId: string
  rating: number
  content?: string
  createdAt: string
}

interface PdfReport {
  id: string
  namingHistoryId?: string
  userId: string
  filePath: string
  selectedNamesJson?: string
  createdAt: string
}

export const users: UserRow[] = []
export const memberships: Membership[] = []
export const masterProfiles: MasterProfile[] = []
export const namingHistories: NamingHistory[] = []
export const nameProposals: NameProposalRow[] = []
export const favorites: Favorite[] = []
export const caseStudies: CaseStudyRow[] = []
export const masterReviews: MasterReview[] = []
export const pdfReports: PdfReport[] = []

function initData() {
  const now = new Date().toISOString()

  users.push({
    id: 'user-001',
    phone: '13800000000',
    nickname: '测试用户',
    role: 'user',
    createdAt: now,
    updatedAt: now
  })

  users.push({
    id: 'admin-001',
    phone: 'admin',
    nickname: '系统管理员',
    role: 'admin',
    createdAt: now,
    updatedAt: now
  })

  for (let i = 0; i < seedMasters.length; i++) {
    const master = seedMasters[i]
    const userId = `master-user-${i + 1}`
    users.push({
      id: userId,
      phone: `13800000${String(i + 1).padStart(3, '0')}`,
      nickname: master.name,
      avatar: master.avatar || '',
      role: 'master',
      createdAt: now,
      updatedAt: now
    })

    masterProfiles.push({
      id: master.id,
      userId,
      name: master.name,
      title: master.title,
      specialties: JSON.stringify(master.specialties),
      experienceYears: master.experience,
      introduction: master.introduction,
      certificates: JSON.stringify(master.certificates),
      status: master.status,
      appliedAt: now
    })
  }

  for (const caseItem of seedCases) {
    caseStudies.push({
      id: caseItem.id,
      masterId: caseItem.masterId,
      finalName: caseItem.finalName,
      explanation: caseItem.explanation,
      isAuthorized: caseItem.isAuthorized ? 1 : 0,
      likes: caseItem.likes,
      status: 'published',
      createdAt: caseItem.createdAt
    })
  }
}

initData()
