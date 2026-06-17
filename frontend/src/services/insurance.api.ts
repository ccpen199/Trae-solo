import { get, post, put } from './request'

export type PolicyStatus = 'active' | 'expired' | 'claimed' | 'pending'
export type ClaimStatus = 'reported' | 'reviewing' | 'investigating' | 'approved' | 'paid' | 'rejected'

export interface InsurancePolicy {
  id: string
  policyNo: string
  productId: string
  productName: string
  orderId: string
  orderNo: string
  insuredId: string
  insuredName: string
  insuredType: 'worker' | 'driver' | 'employer'
  coverage: number
  premium: number
  status: PolicyStatus
  startDate: string
  endDate: string
  createdAt: string
}

export interface InsuranceClaim {
  id: string
  claimNo: string
  policyId: string
  policyNo: string
  orderId: string
  incidentType: string
  incidentTypeLabel: string
  reportedAt: string
  claimAmount: number
  approvedAmount: number
  status: ClaimStatus
  statusLabel: string
  description: string
  reporterId: string
  reporterName: string
  evidenceImages: string[]
  timeline: {
    status: ClaimStatus
    statusLabel: string
    time: string
    operator: string
    remark?: string
  }[]
  createdAt: string
}

export interface InsuranceStats {
  activePolicies: number
  todayClaims: number
  pendingClaims: number
  totalPaidOut: number
}

export interface ClaimsListResponse {
  list: InsuranceClaim[]
  total: number
}

export interface PoliciesListResponse {
  list: InsurancePolicy[]
  total: number
}

export const getInsuranceStats = () => {
  return get<InsuranceStats>('/insurance/stats')
}

export const getPolicies = (params?: {
  status?: PolicyStatus
  page?: number
  pageSize?: number
}) => {
  return get<PoliciesListResponse>('/insurance/policies', params)
}

export const getPolicyDetail = (id: string) => {
  return get<InsurancePolicy>(`/insurance/policies/${id}`)
}

export const getClaims = (params?: {
  status?: ClaimStatus
  page?: number
  pageSize?: number
}) => {
  return get<ClaimsListResponse>('/insurance/claims', params)
}

export const getClaimDetail = (id: string) => {
  return get<InsuranceClaim>(`/insurance/claims/${id}`)
}

export const submitClaim = (data: {
  policyId: string
  orderId: string
  type: string
  amount: number
  description: string
  evidenceImages: string[]
}) => {
  return post<InsuranceClaim>('/insurance/claims', data)
}

export interface ReviewClaimData {
  id: string
  action: 'approve' | 'reject' | 'investigate'
  approvedAmount?: number
  remark: string
}

export const reviewClaim = (data: ReviewClaimData) => {
  return put<InsuranceClaim>(`/insurance/claims/${data.id}/review`, data)
}
