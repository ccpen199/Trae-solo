import { post } from './request'
import type { UserInfo, ApiResponse } from '@/types'

interface LoginData {
  username: string
  password: string
}

interface LoginResult {
  token: string
  userInfo: UserInfo
}

export function login(data: LoginData) {
  return post<LoginResult>('/admin/auth/login', data)
}

export function logout() {
  return post<void>('/admin/auth/logout')
}

export function getCurrentUser() {
  return post<UserInfo>('/admin/auth/profile')
}
