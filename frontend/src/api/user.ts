import { request } from '@/utils/request'
import type { User, Role } from '@/types'

export const userApi = {
  getCurrentUser(): Promise<User> {
    return request.get('/users/me')
  },

  updateCurrentUser(data: {
    realName?: string
    phone?: string
    email?: string
    avatar?: string
  }): Promise<User> {
    return request.put('/users/me', data)
  },

  getList(role?: Role): Promise<User[]> {
    const params = role ? { role } : {}
    return request.get('/users', { params })
  },

  getFarmers(activeOnly = true): Promise<User[]> {
    return request.get('/users/farmers', { params: { activeOnly } })
  },

  getBuyers(activeOnly = true): Promise<User[]> {
    return request.get('/users/buyers', { params: { activeOnly } })
  },

  getById(id: string): Promise<User> {
    return request.get(`/users/${id}`)
  },

  updateStatus(id: string, isActive: boolean): Promise<User> {
    return request.put(`/users/${id}/status`, { isActive })
  },
}
