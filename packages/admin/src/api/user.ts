import { get, post, put, del } from './request'
import type { UserProfile, PageResult } from '@/types'

interface UserQuery {
  page?: number
  pageSize?: number
  keyword?: string
  level?: string
  tag?: string
}

export function getUserList(params: UserQuery) {
  return get<PageResult<UserProfile>>('/admin/users', { params })
}

export function getUserDetail(id: string) {
  return get<UserProfile>(`/admin/users/${id}`)
}

export function updateUserTags(id: string, tags: string[]) {
  return put<UserProfile>(`/admin/users/${id}/tags`, { tags })
}

export function getUserStatistics() {
  return get('/admin/users/statistics')
}
