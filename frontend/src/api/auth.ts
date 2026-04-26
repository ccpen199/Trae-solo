import { request } from '@/utils/request'
import type { LoginResult, User, Role } from '@/types'

export const authApi = {
  login(username: string, password: string): Promise<LoginResult> {
    return request.post('/auth/login', { username, password })
  },

  register(data: {
    username: string
    password: string
    realName: string
    phone: string
    email?: string
    role: Role
  }): Promise<User> {
    return request.post('/auth/register', data)
  },

  getProfile(): Promise<User> {
    return request.get('/auth/profile')
  },
}
