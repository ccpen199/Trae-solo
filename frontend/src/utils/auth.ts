import api from './api'

const TOKEN_KEY = 'city_life_token'
const USER_KEY = 'city_life_user'

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) return token
  setDemoAdmin()
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export interface User {
  id: number
  username: string
  nickname: string
  email: string
  avatar?: string
  bio?: string
  role: string
  city?: string
  creator_level?: number
  creator_score?: number
  author_level?: number
  author_level_name?: string
  author_score?: number
  author_certified?: number
  is_certified?: boolean
  certified_at?: string
  follower_count?: number
  following_count?: number
  content_count?: number
  like_count?: number
  total_earnings?: number
  monthly_earnings?: number
  available_earnings?: number
  status?: string
  created_at?: string
  updated_at?: string
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(USER_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  setDemoAdmin()
  return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export async function fetchCurrentUser(): Promise<User | null> {
  if (!isAuthenticated()) return null
  try {
    const res = await api.get('/api/auth/me')
    if (res.data.code === 0) {
      setCurrentUser(res.data.data)
      return res.data.data
    }
    return null
  } catch {
    return null
  }
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

function setDemoAdmin(): void {
  if (localStorage.getItem(TOKEN_KEY)) return
  setToken('local-demo-admin')
  setCurrentUser({
    id: 1,
    username: 'demo-admin',
    nickname: '演示管理员',
    email: 'demo-admin@example.com',
    role: 'admin',
    city: '北京',
    status: 'active'
  })
}
