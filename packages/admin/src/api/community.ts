import { get, post, put, del } from './request'

interface ContentQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  type?: string
}

export function getContentList(params: ContentQuery) {
  return get('/admin/community/contents', { params })
}

export function getContentDetail(id: string) {
  return get(`/admin/community/contents/${id}`)
}

export function auditContent(id: string, status: string, reason?: string) {
  return put(`/admin/community/contents/${id}/audit`, { status, reason })
}

export function deleteContent(id: string) {
  return del(`/admin/community/contents/${id}`)
}

export function getCommentList(params: ContentQuery) {
  return get('/admin/community/comments', { params })
}

export function deleteComment(id: string) {
  return del(`/admin/community/comments/${id}`)
}
