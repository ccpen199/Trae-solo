import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios'
import type {
  SubmitData,
  ListParams,
  ListResponse,
  FeedbackItem,
  FeedbackDetail,
  StatusLog,
  Comment,
  StatsOverview,
  HotIssue,
  VersionQuality,
  ResponseTimeData,
  SatisfactionData,
  RiskItem,
  DefectItem,
} from '@/types'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

request.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data && response.data.success === true) {
      return response.data.data
    }
    return Promise.reject(response.data?.error || response.data?.message || '请求失败')
  },
  (error) => {
    return Promise.reject(error.message || '网络错误')
  }
)

const http = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.get(url, config) as unknown as Promise<T>,
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    request.post(url, data, config) as unknown as Promise<T>,
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    request.put(url, data, config) as unknown as Promise<T>,
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.delete(url, config) as unknown as Promise<T>,
}

export const submitFeedback = (data: SubmitData, files: File[] = []) => {
  const formData = new FormData()
  Object.keys(data).forEach((key) => {
    const value = (data as unknown as Record<string, unknown>)[key]
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    }
  })
  files.forEach((file) => {
    formData.append('files', file)
  })
  return http.post<{ id: string }>('/feedbacks', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const getFeedbacks = (params: ListParams) => {
  return http.get<ListResponse<FeedbackItem>>('/feedbacks', { params })
}

export const getFeedback = (id: string) => {
  return http.get<FeedbackDetail>(`/feedbacks/${id}`)
}

export const updateStatus = (
  id: string,
  status: string,
  operator: string,
  remark?: string,
  extra?: { assignee?: string; verifier?: string; close_reason?: string }
) => {
  return http.put<StatusLog>(`/feedbacks/${id}/status`, {
    status,
    operator,
    remark,
    ...extra,
  })
}

export const addComment = (id: string, author: string, content: string) => {
  return http.post<Comment>(`/feedbacks/${id}/comments`, { author, content })
}

export const mergeFeedbacks = (parentId: string, childIds: string[]) => {
  return http.post<void>('/feedbacks/merge', { parentId, childIds })
}

export const linkDefect = (id: string, defectId: string) => {
  return http.post<void>(`/feedbacks/${id}/link-defect`, { defectId })
}

export const getStatsOverview = () => {
  return http.get<StatsOverview>('/stats/overview')
}

export const getHotIssues = () => {
  return http.get<HotIssue[]>('/stats/hot-issues')
}

export const getVersionQuality = () => {
  return http.get<VersionQuality[]>('/stats/version-quality')
}

export const getResponseTime = () => {
  return http.get<ResponseTimeData[]>('/stats/response-time')
}

export const getSatisfaction = () => {
  return http.get<SatisfactionData[]>('/stats/satisfaction')
}

export const getRisks = () => {
  return http.get<RiskItem[]>('/stats/risks')
}

export const exportWeekly = async () => {
  try {
    const response = await axios.get('/api/stats/export-weekly', {
      responseType: 'blob',
      timeout: 30000,
    })
    if (response.status === 200) {
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `weekly-report-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return true
    }
    return false
  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

export const getDefects = () => {
  return http.get<DefectItem[]>('/defects/all')
}

export const createDefect = (data: Partial<DefectItem>) => {
  return http.post<{ id: string }>('/defects', data)
}
