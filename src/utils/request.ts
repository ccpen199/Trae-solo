import { get, post, put, del, upload } from '../api/client'
import type { PaginationParams, PagedResponse } from '../types'

interface RequestOptions {
  showLoading?: boolean
  showError?: boolean
  successMessage?: string
}

const defaultOptions: RequestOptions = {
  showLoading: true,
  showError: true,
  successMessage: ''
}

const requestWrapper = async <T>(
  requestFn: () => Promise<T>,
  options?: RequestOptions
): Promise<T> => {
  const opts = { ...defaultOptions, ...options }

  try {
    if (opts.showLoading) {
      // TODO: 集成全局 loading
      console.log('Loading...')
    }

    const result = await requestFn()

    if (opts.successMessage) {
      // TODO: 集成全局 message
      console.log('Success:', opts.successMessage)
    }

    return result
  } catch (error) {
    if (opts.showError) {
      const errorMessage = error instanceof Error ? error.message : '请求失败'
      // TODO: 集成全局 message
      console.error('Error:', errorMessage)
    }
    throw error
  } finally {
    if (opts.showLoading) {
      // TODO: 关闭全局 loading
      console.log('Loading done')
    }
  }
}

export const useGet = <T = any>(
  url: string,
  params?: any,
  options?: RequestOptions
): Promise<T> => {
  return requestWrapper(() => get<T>(url, params), options)
}

export const usePost = <T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> => {
  return requestWrapper(() => post<T>(url, data), options)
}

export const usePut = <T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> => {
  return requestWrapper(() => put<T>(url, data), options)
}

export const useDelete = <T = any>(
  url: string,
  params?: any,
  options?: RequestOptions
): Promise<T> => {
  return requestWrapper(() => del<T>(url, params), options)
}

export const useUpload = <T = any>(
  url: string,
  formData: FormData,
  options?: RequestOptions
): Promise<T> => {
  return requestWrapper(() => upload<T>(url, formData), options)
}

export const buildPaginationParams = (params: PaginationParams): PaginationParams => {
  return {
    page: params.page || 1,
    pageSize: params.pageSize || 10
  }
}

export const usePagedGet = <T = any>(
  url: string,
  params?: any & PaginationParams,
  options?: RequestOptions
): Promise<PagedResponse<T>> => {
  const pagedParams = {
    ...params,
    ...buildPaginationParams(params || {})
  }
  return useGet<PagedResponse<T>>(url, pagedParams, options)
}

export interface UseRequestResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  run: (...args: any[]) => Promise<T>
  refresh: () => Promise<T>
}

export function useRequest<T = any>(
  requestFn: (...args: any[]) => Promise<T>,
  options?: {
    manual?: boolean
    defaultParams?: any[]
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
): UseRequestResult<T> {
  // TODO: 集成 React Query 或 SWR
  console.warn('useRequest hook is a placeholder. Consider using React Query or SWR.')
  
  return {
    data: null,
    loading: false,
    error: null,
    run: requestFn,
    refresh: () => requestFn()
  }
}

export default {
  get: useGet,
  post: usePost,
  put: usePut,
  delete: useDelete,
  upload: useUpload,
  pagedGet: usePagedGet,
  useRequest
}
