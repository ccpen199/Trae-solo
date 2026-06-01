import client from './client'
import type { LoginRequest, LoginResponse, User } from '../types'

export function login(payload: LoginRequest) {
  return client.post<LoginResponse>('/auth/login', payload).then((r) => r.data)
}

export function getCurrentUser() {
  return client.get<User>('/auth/me').then((r) => r.data)
}
