import type { User, NameProposal, CaseStudy, PaginatedResponse } from '../../shared/types'
import { users, favorites, generateId, paginate } from '../db/index.js'
import { cases as seedCases } from '../data/cases.js'

function rowToUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar || undefined,
    role: row.role,
    membershipExpireAt: row.membershipExpireAt,
    createdAt: row.createdAt
  }
}

export function login(phone: string, code: string): { token: string; user: User } | null {
  if (code !== '1234') return null

  let userRow = users.find(u => u.phone === phone)

  if (!userRow) {
    const userId = generateId('user')
    const nickname = `用户${phone.slice(-4)}`
    const now = new Date().toISOString()
    userRow = {
      id: userId,
      phone,
      nickname,
      role: 'user',
      createdAt: now,
      updatedAt: now
    }
    users.push(userRow)
  }

  const token = `token-${userRow.id}-${Date.now()}`
  return { token, user: rowToUser(userRow) }
}

export function adminLogin(username: string, password: string): { token: string; user: User } | null {
  if (username !== 'admin' || password !== 'admin123') return null

  const userRow = users.find(u => u.id === 'admin-001')
  if (!userRow) return null

  const token = `admin-token-${userRow.id}-${Date.now()}`
  return { token, user: rowToUser(userRow) }
}

export function getFavorites(userId: string): {
  names: NameProposal[]
  cases: CaseStudy[]
} {
  const nameFavorites: NameProposal[] = []
  const caseFavorites: CaseStudy[] = []

  const rows = favorites.filter(f => f.userId === userId)

  for (const fav of rows) {
    if (fav.targetType === 'case') {
      const seedCase = seedCases.find(c => c.id === fav.targetId)
      if (seedCase) caseFavorites.push(seedCase)
    }
  }

  return {
    names: nameFavorites,
    cases: caseFavorites
  }
}

export function toggleFavorite(
  userId: string,
  type: 'name' | 'case' | 'master',
  targetId: string
): { success: boolean; favorited: boolean } {
  const existing = favorites.find(
    f => f.userId === userId && f.targetType === type && f.targetId === targetId
  )

  if (existing) {
    const idx = favorites.indexOf(existing)
    if (idx > -1) favorites.splice(idx, 1)
    return { success: true, favorited: false }
  } else {
    const id = generateId('fav')
    favorites.push({
      id,
      userId,
      targetType: type,
      targetId,
      createdAt: new Date().toISOString()
    })
    return { success: true, favorited: true }
  }
}

export function getUsers(
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<User> {
  const sorted = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const result = paginate(sorted, page, pageSize)

  return {
    items: result.items.map(rowToUser),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  }
}
