import axios from 'axios'
import type { ApiResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const api = {
  health: () => request.get<any, ApiResponse<{ status: string; timestamp: number }>>('/health'),

  getTrades: (params?: any) => request.get<any, ApiResponse<any>>('/trades', { params }),
  getTrade: (id: number) => request.get<any, ApiResponse<any>>(`/trades/${id}`),
  getTradeStats: () => request.get<any, ApiResponse<any[]>>('/trades/stats'),
  getTradeCategories: () => request.get<any, ApiResponse<string[]>>('/trades/categories'),
  createTrade: (data: any) => request.post<any, ApiResponse<any>>('/trades', data),
  updateTrade: (id: number, data: any) => request.put<any, ApiResponse<any>>(`/trades/${id}`, data),
  getTradeWorkers: (id: number, params?: any) => request.get<any, ApiResponse<any>>(`/trades/${id}/workers`, { params }),
  getTradeJobs: (id: number, params?: any) => request.get<any, ApiResponse<any>>(`/trades/${id}/jobs`, { params }),

  getWorkers: (params?: any) => request.get<any, ApiResponse<any>>('/workers', { params }),
  getWorker: (id: number) => request.get<any, ApiResponse<any>>(`/workers/${id}`),
  createWorker: (data: any) => request.post<any, ApiResponse<any>>('/workers', data),
  updateWorker: (id: number, data: any) => request.put<any, ApiResponse<any>>(`/workers/${id}`, data),
  getWorkerCertificates: (workerId: number) => request.get<any, ApiResponse<any[]>>(`/workers/${workerId}/certificates`),
  getWorkerReviews: (workerId: number) => request.get<any, ApiResponse<any[]>>(`/workers/${workerId}/reviews`),
  getWorkerTrainings: (workerId: number) => request.get<any, ApiResponse<any[]>>(`/workers/${workerId}/trainings`),

  getJobs: (params?: any) => request.get<any, ApiResponse<any>>('/jobs', { params }),
  getJob: (id: number) => request.get<any, ApiResponse<any>>(`/jobs/${id}`),
  createJob: (data: any) => request.post<any, ApiResponse<any>>('/jobs', data),
  updateJob: (id: number, data: any) => request.put<any, ApiResponse<any>>(`/jobs/${id}`, data),
  matchJob: (id: number) => request.post<any, ApiResponse<any[]>>(`/jobs/${id}/match`),
  getJobMatches: (id: number) => request.get<any, ApiResponse<any[]>>(`/jobs/${id}/matches`),
  getJobReviews: (id: number) => request.get<any, ApiResponse<any[]>>(`/jobs/${id}/reviews`),
  reviewJob: (id: number, level: string, data: any) => request.post<any, ApiResponse<any>>(`/jobs/${id}/review/${level}`, data),

  getMatches: (params?: any) => request.get<any, ApiResponse<any>>('/matches', { params }),
  updateMatchStatus: (id: number, status: string) => request.put<any, ApiResponse<any>>(`/matches/${id}/status`, { status }),

  getContracts: (params?: any) => request.get<any, ApiResponse<any>>('/contracts', { params }),
  getContract: (id: number) => request.get<any, ApiResponse<any>>(`/contracts/${id}`),
  getContractTemplates: () => request.get<any, ApiResponse<any>>('/contracts/templates/list'),
  createContract: (data: any) => request.post<any, ApiResponse<any>>('/contracts', data),
  signContract: (id: number, signerType: 'worker' | 'employer') => request.post<any, ApiResponse<any>>(`/contracts/${id}/sign/${signerType}`),

  getWagePayments: (params?: any) => request.get<any, ApiResponse<any>>('/wage-payments', { params }),
  createWagePayment: (data: any) => request.post<any, ApiResponse<any>>('/wage-payments', data),
  updateWagePaymentStatus: (id: number, status: string) => request.put<any, ApiResponse<any>>(`/wage-payments/${id}/status`, { status }),

  getRegionHeatmap: () => request.get<any, ApiResponse<any[]>>('/analytics/region-heatmap'),
  getTradeShortage: () => request.get<any, ApiResponse<any[]>>('/analytics/trade-shortage'),
  getTeamCredit: () => request.get<any, ApiResponse<any[]>>('/analytics/team-credit'),
  getWageArrearsRisk: () => request.get<any, ApiResponse<any[]>>('/analytics/wage-arrears-risk'),
  getDashboardStats: () => request.get<any, ApiResponse<any>>('/analytics/dashboard-stats'),
  getReviewRecords: () => request.get<any, ApiResponse<any[]>>('/analytics/review-records'),

  getEmployers: (params?: any) => request.get<any, ApiResponse<any>>('/employers', { params }),
  getEmployer: (id: number) => request.get<any, ApiResponse<any>>(`/employers/${id}`),
  createEmployer: (data: any) => request.post<any, ApiResponse<any>>('/employers', data),
}

export default request
