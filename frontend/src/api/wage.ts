import { http } from '../utils/request'
import type { ApiResponse, WageGuarantee, WageRelease, PaginationResult } from '../types'

export interface CreateGuaranteeParams {
  job_post_id: number
  deposit_amount: number
  payment_method: string
}

export interface GuaranteeDetail extends WageGuarantee {
  job_post: {
    id: number
    title: string
    workers_needed: number
    daily_wage: number
    start_date: string
    end_date: string
  }
  release_records: Array<{
    id: number
    amount: number
    release_date: string
    worker_name: string
    status: string
  }>
}

export interface MyReleaseDetail extends WageRelease {
  worker: {
    id: number
    real_name: string
    avatar_url?: string
  }
  job_post: {
    id: number
    title: string
  }
}

export interface GuaranteeStatistics {
  total_deposited: number
  current_locked: number
  total_released: number
  frozen: number
}

export const wageApi = {
  createGuarantee(data: CreateGuaranteeParams): Promise<ApiResponse<WageGuarantee>> {
    return http.post<WageGuarantee>('/wage/guarantees', data)
  },

  getGuarantees(): Promise<ApiResponse<PaginationResult<WageGuarantee>>> {
    return http.get<PaginationResult<WageGuarantee>>('/wage/guarantees')
  },

  getGuarantee(id: number): Promise<ApiResponse<GuaranteeDetail>> {
    return http.get<GuaranteeDetail>(`/wage/guarantees/${id}`)
  },

  getMyReleases(
    params?: { status?: string }
  ): Promise<ApiResponse<PaginationResult<MyReleaseDetail>>> {
    return http.get<PaginationResult<MyReleaseDetail>>('/wage/releases', { params })
  },

  getGuaranteeStatistics(): Promise<ApiResponse<GuaranteeStatistics>> {
    return http.get<GuaranteeStatistics>('/wage/guarantees/statistics')
  },

  createRelease(
    data: {
      wage_guarantee_id: number
      job_application_id: number
      worker_id: number
      amount: number
      release_reason: string
      scheduled_release_date: string
    }
  ): Promise<ApiResponse<WageRelease>> {
    return http.post<WageRelease>('/wage/releases', data)
  },
}

export default wageApi
