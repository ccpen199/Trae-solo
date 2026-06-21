import { type PageData } from './response.js'

export interface PaginationParams {
  page: number
  pageSize: number
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(query.page as string || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize as string || '10', 10) || 10))
  return { page, pageSize }
}

export function paginate<T>(list: T[], params: PaginationParams): PageData<T> {
  const { page, pageSize } = params
  const total = list.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    list: list.slice(start, end),
    total,
    page,
    pageSize,
    totalPages,
  }
}
