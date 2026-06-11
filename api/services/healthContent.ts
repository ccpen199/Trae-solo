import { HealthContent, ContentReview } from '../../shared/types'
import { healthContentDB, contentReviewDB } from '../db/index'

export interface ContentQueryOptions {
  type?: HealthContent['type']
  status?: HealthContent['status']
  ageGroup?: string
  chronicDisease?: string
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function createContent(content: Omit<HealthContent, 'id' | 'createdAt'>): HealthContent {
  return healthContentDB.create({
    ...content,
    status: content.status || 'pending'
  })
}

export function getContentById(id: string): HealthContent | null {
  return healthContentDB.findById(id)
}

export function getContents(options: ContentQueryOptions = {}): PaginatedResult<HealthContent> {
  const page = options.page || 1
  const pageSize = options.pageSize || 10
  const offset = (page - 1) * pageSize

  const items = healthContentDB.findAll({
    type: options.type,
    status: options.status || 'approved',
    ageGroup: options.ageGroup,
    chronicDisease: options.chronicDisease,
    limit: pageSize,
    offset
  })

  const total = healthContentDB.count({
    type: options.type,
    status: options.status || 'approved'
  })

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export function updateContent(id: string, updates: Partial<Omit<HealthContent, 'id' | 'createdAt'>>): HealthContent | null {
  return healthContentDB.update(id, updates)
}

export function deleteContent(id: string): boolean {
  return healthContentDB.delete(id)
}

export function filterByTags(
  tags: string[],
  options: Omit<ContentQueryOptions, 'ageGroup' | 'chronicDisease'> = {}
): PaginatedResult<HealthContent> {
  const page = options.page || 1
  const pageSize = options.pageSize || 10

  let contents = healthContentDB.findAll({
    type: options.type,
    status: options.status || 'approved'
  })

  if (tags.length > 0) {
    contents = contents.filter(content => {
      const allTags = [...content.ageGroups, ...content.chronicDiseases]
      return tags.some(tag => allTags.includes(tag))
    })
  }

  const total = contents.length
  const startIndex = (page - 1) * pageSize
  const items = contents.slice(startIndex, startIndex + pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export function getRecommendedContent(
  age: number,
  chronicDiseases: string[],
  limit: number = 5
): HealthContent[] {
  let ageGroup: string
  if (age >= 70) {
    ageGroup = '70+'
  } else if (age >= 60) {
    ageGroup = '60-70'
  } else if (age >= 50) {
    ageGroup = '50-60'
  } else {
    ageGroup = '60-70'
  }

  const contents = healthContentDB.findAll({
    status: 'approved'
  })

  const scored = contents.map(content => {
    let score = 0

    if (content.ageGroups.includes(ageGroup)) {
      score += 3
    }

    const diseaseMatch = content.chronicDiseases.filter(d => chronicDiseases.includes(d)).length
    score += diseaseMatch * 2

    if (content.accessibilityLevel >= 2) {
      score += 1
    }

    return { content, score }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(item => item.content)
}

export function reviewContent(
  contentId: string,
  reviewerId: string,
  status: HealthContent['status'],
  comment: string,
  accessibilityLevel: number
): ContentReview | null {
  const content = healthContentDB.findById(contentId)
  if (!content) {
    return null
  }

  healthContentDB.update(contentId, { status, accessibilityLevel })

  return contentReviewDB.create({
    contentId,
    reviewerId,
    status,
    comment,
    accessibilityLevel
  })
}

export function getContentReviews(contentId: string): ContentReview[] {
  return contentReviewDB.findByContentId(contentId)
}

export function getPendingContents(page: number = 1, pageSize: number = 10): PaginatedResult<HealthContent> {
  return getContents({
    status: 'pending',
    page,
    pageSize
  })
}

export default {
  createContent,
  getContentById,
  getContents,
  updateContent,
  deleteContent,
  filterByTags,
  getRecommendedContent,
  reviewContent,
  getContentReviews,
  getPendingContents
}
