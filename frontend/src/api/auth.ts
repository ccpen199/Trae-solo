import request from '@/utils/request'
import type { ApiResponse } from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  expireTime: number
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  phone: string
  avatar: string
  roleType: number
  roleName: string
  merchantId: number
  storeId: number
  storeName: string
}

export function login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  return request.post('/api/auth/login', data)
}

export function logout(): Promise<ApiResponse<null>> {
  return request.post('/api/auth/logout')
}

export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return request.get('/api/auth/userinfo')
}

export function updatePassword(data: { oldPassword: string; newPassword: string }): Promise<ApiResponse<null>> {
  return request.post('/api/auth/update-password', data)
}
