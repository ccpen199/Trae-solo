import { storage } from './storage'
import type { User, LoginResponse } from '@/types'

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRES_KEY = 'token_expires'
const USER_KEY = 'user_info'

export function setToken(token: string, expiresIn?: number): void {
  const options = expiresIn ? { expires: expiresIn } : undefined
  storage.set(TOKEN_KEY, token, options)
  if (expiresIn) {
    storage.set(TOKEN_EXPIRES_KEY, Date.now() + expiresIn * 1000)
  }
}

export function getToken(): string | undefined {
  return storage.get<string>(TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  storage.set(REFRESH_TOKEN_KEY, token)
}

export function getRefreshToken(): string | undefined {
  return storage.get<string>(REFRESH_TOKEN_KEY)
}

export function setUserInfo(user: User): void {
  storage.set(USER_KEY, user)
}

export function getUserInfo(): User | undefined {
  return storage.get<User>(USER_KEY)
}

export function setAuthData(data: LoginResponse): void {
  setToken(data.token, data.expiresIn)
  setRefreshToken(data.refreshToken)
  setUserInfo(data.user)
}

export function clearAuth(): void {
  storage.remove(TOKEN_KEY)
  storage.remove(REFRESH_TOKEN_KEY)
  storage.remove(TOKEN_EXPIRES_KEY)
  storage.remove(USER_KEY)
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false
  const expiresAt = storage.get<number>(TOKEN_EXPIRES_KEY)
  if (expiresAt && Date.now() > expiresAt) {
    clearAuth()
    return false
  }
  return true
}

export function isTokenExpired(): boolean {
  const expiresAt = storage.get<number>(TOKEN_EXPIRES_KEY)
  if (!expiresAt) return true
  return Date.now() > expiresAt
}

export function getTokenRemainingTime(): number {
  const expiresAt = storage.get<number>(TOKEN_EXPIRES_KEY)
  if (!expiresAt) return 0
  const remaining = expiresAt - Date.now()
  return remaining > 0 ? remaining : 0
}

export function hasRole(role: string | string[]): boolean {
  const user = getUserInfo()
  if (!user) return false
  if (Array.isArray(role)) {
    return role.includes(user.role)
  }
  return user.role === role
}

export function isCitizen(): boolean {
  return hasRole('citizen')
}

export function isEnterprise(): boolean {
  return hasRole('enterprise')
}

export function isDepartmentAdmin(): boolean {
  return hasRole('department_admin')
}

export function isPlatformAdmin(): boolean {
  return hasRole('platform_admin')
}

export function isAdmin(): boolean {
  return hasRole(['department_admin', 'platform_admin'])
}

export function isVerified(): boolean {
  const user = getUserInfo()
  return user?.verified ?? false
}
