import type { CaseStudy, PaginatedResponse } from '../../shared/types'
import { caseStudies as dbCaseStudies } from '../db/index.js'
import { cases as seedCases } from '../data/cases.js'
import { masters } from '../data/masters.js'

function getSeedCaseById(id: string): CaseStudy | undefined {
  return seedCases.find(c => c.id === id)
}

function mergeWithSeed(row: any): CaseStudy {
  const seedCase = getSeedCaseById(row.id)
  if (seedCase) return seedCase
  return {
    id: row.id,
    name: row.finalName,
    babyInfo: { gender: 'neutral', birthDate: row.createdAt },
    inputSummary: '',
    baziSummary: '',
    alternatives: [],
    finalName: row.finalName,
    explanation: row.explanation || '',
    masterId: row.masterId,
    masterName: masters.find(m => m.id === row.masterId)?.name,
    isAuthorized: !!row.isAuthorized,
    likes: row.likes || 0,
    createdAt: row.createdAt
  }
}

export function getCases(
  page: number = 1,
  pageSize: number = 10,
  filters?: { masterId?: string; gender?: string }
): PaginatedResponse<CaseStudy> {
  const publishedCases = seedCases.filter(c => c.isAuthorized)

  let filtered = [...publishedCases]
  if (filters?.masterId) {
    filtered = filtered.filter(c => c.masterId === filters.masterId)
  }
  if (filters?.gender) {
    filtered = filtered.filter(c => c.babyInfo.gender === filters.gender)
  }

  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return {
    items,
    total: filtered.length,
    page,
    pageSize
  }
}

export function getCaseById(id: string): CaseStudy | null {
  return getSeedCaseById(id) || null
}

export function authorizeCase(caseId: string, userId: string): { success: boolean } {
  const row = dbCaseStudies.find(c => c.id === caseId)
  if (!row) return { success: false }
  row.isAuthorized = 1
  return { success: true }
}

export function reviewCase(
  id: string,
  action: 'publish' | 'reject'
): { success: boolean } {
  const row = dbCaseStudies.find(c => c.id === id)
  if (!row) return { success: false }
  row.status = action === 'publish' ? 'published' : 'rejected'
  return { success: true }
}

export function getPendingCases(): CaseStudy[] {
  return dbCaseStudies
    .filter(c => c.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(mergeWithSeed)
}
