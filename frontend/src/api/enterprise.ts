import { http } from '../utils/request'
import type { ApiResponse, Enterprise } from '../types'

export interface UpdateEnterpriseProfileParams {
  company_name?: string
  unified_social_code?: string
  business_license_url?: string
  legal_person?: string
  legal_person_id_card?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  industry_type?: string
  registered_capital?: number
}

export interface SubmitVerifyParams {
  unified_social_code: string
  business_license_url: string
  legal_person: string
  legal_person_id_card: string
  company_address: string
  company_phone: string
  industry_type: string
  registered_capital: number
}

export interface CreditScoreDetail {
  score: number
  level: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C'
  on_time_payment_rate: number
  contract_performance_rate: number
  complaint_rate: number
  verification_level: number
  history: Array<{
    id: number
    date: string
    change: number
    reason: string
  }>
  suggestions: string[]
}

export interface EnterpriseStatistics {
  active_workers: number
  ongoing_projects: number
  guarantee_balance: number
  credit_score: number
  monthly_wage_trend: Array<{
    date: string
    amount: number
  }>
  pending_tasks: Array<{
    id: number
    type: 'review_application' | 'confirm_completion' | 'guarantee_replenish' | 'verification'
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    created_at: string
  }>
}

export const enterpriseApi = {
  getProfile(): Promise<ApiResponse<Enterprise>> {
    return http.get<Enterprise>('/enterprise/profile')
  },

  updateProfile(data: UpdateEnterpriseProfileParams): Promise<ApiResponse<Enterprise>> {
    return http.put<Enterprise>('/enterprise/profile', data)
  },

  submitVerify(data: SubmitVerifyParams): Promise<ApiResponse<{ verified: number }>> {
    return http.post<{ verified: number }>('/enterprise/verify', data)
  },

  getCreditScore(): Promise<ApiResponse<CreditScoreDetail>> {
    return http.get<CreditScoreDetail>('/enterprise/credit-score')
  },

  getStatistics(): Promise<ApiResponse<EnterpriseStatistics>> {
    return http.get<EnterpriseStatistics>('/enterprise/statistics')
  },
}

export default enterpriseApi
