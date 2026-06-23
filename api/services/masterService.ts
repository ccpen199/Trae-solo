import type { Master, PaginatedResponse } from '../../shared/types'
import { masterProfiles, users, caseStudies, masterReviews, generateId, paginate } from '../db/index.js'

function rowToMaster(mp: any, userAvatar: string): Master {
  const caseCount = caseStudies.filter(c => c.masterId === mp.id).length
  const reviews = masterReviews.filter(r => r.masterId === mp.id)
  const reviewCount = reviews.length
  const rating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0

  return {
    id: mp.id,
    name: mp.name,
    avatar: userAvatar || '',
    title: mp.title || '',
    specialties: mp.specialties ? JSON.parse(mp.specialties) : [],
    experience: mp.experienceYears || 0,
    introduction: mp.introduction || '',
    certificates: mp.certificates ? JSON.parse(mp.certificates) : [],
    caseCount,
    rating: Math.round(rating * 100) / 100,
    reviewCount,
    status: mp.status
  }
}

export function getMasters(
  page: number = 1,
  pageSize: number = 10,
  filters?: { status?: string; specialty?: string }
): PaginatedResponse<Master> {
  let filtered = masterProfiles.filter(mp => mp.status === 'approved')

  if (filters?.specialty) {
    filtered = filtered.filter(mp => {
      const specialties: string[] = mp.specialties ? JSON.parse(mp.specialties) : []
      return specialties.some(s => s.includes(filters.specialty!))
    })
  }

  filtered = filtered.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))

  const result = paginate(filtered, page, pageSize)

  return {
    items: result.items.map(mp => {
      const user = users.find(u => u.id === mp.userId)
      return rowToMaster(mp, user?.avatar || '')
    }),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  }
}

export function getMasterById(id: string): Master | null {
  const mp = masterProfiles.find(m => m.id === id)

  if (!mp) return null

  const user = users.find(u => u.id === mp.userId)
  return rowToMaster(mp, user?.avatar || '')
}

export function applyForMaster(data: {
  userId: string
  name: string
  title?: string
  specialties?: string[]
  experience?: number
  introduction?: string
  certificates?: string[]
}): { id: string; status: string } {
  const id = generateId('mp')
  const status = 'pending'

  masterProfiles.push({
    id,
    userId: data.userId,
    name: data.name,
    title: data.title,
    specialties: data.specialties ? JSON.stringify(data.specialties) : undefined,
    experienceYears: data.experience || 0,
    introduction: data.introduction,
    certificates: data.certificates ? JSON.stringify(data.certificates) : undefined,
    status,
    appliedAt: new Date().toISOString()
  })

  return { id, status }
}

export function reviewMaster(
  id: string,
  action: 'approve' | 'reject',
  note?: string
): { success: boolean } {
  const mp = masterProfiles.find(m => m.id === id)
  if (!mp) return { success: false }

  mp.status = action === 'approve' ? 'approved' : 'rejected'
  mp.reviewedAt = new Date().toISOString()

  return { success: true }
}

export function getPendingMasters(): Master[] {
  const filtered = masterProfiles
    .filter(mp => mp.status === 'pending')
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))

  return filtered.map(mp => {
    const user = users.find(u => u.id === mp.userId)
    return rowToMaster(mp, user?.avatar || '')
  })
}
