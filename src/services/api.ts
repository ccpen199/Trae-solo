const API_BASE = '/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface Project {
  id: number
  brand_id: number
  name: string
  industry: string
  category: string
  investment_min: number
  investment_max: number
  free_joining: number
  area_required: string
  profit_model: string
  description: string
  cover_image: string
  video_url: string
  province: string
  city: string
  address: string
  status: string
  mengxintong_certified: number
  view_count: number
  brand_name?: string
  company_name?: string
  created_at: string
}

export interface Franchisee {
  id: number
  project_id: number
  entrepreneur_id: number
  stage: 'lead' | 'signed' | 'opened' | 'repurchase'
  contact_name: string
  contact_phone: string
  intended_amount?: number
  signed_amount?: number
  signed_date?: string
  store_name?: string
  store_address?: string
  opened_date?: string
  repurchase_amount?: number
  repurchase_date?: string
  notes?: string
  project_name?: string
  industry?: string
  category?: string
  entrepreneur_name?: string
  entrepreneur_phone?: string
  brand_name?: string
  created_at: string
}

export interface RiskAssessment {
  id: number
  entrepreneur_id: number
  project_id: number
  score: number
  risk_level: 'low' | 'medium' | 'high'
  market_analysis: string
  financial_analysis: string
  competitor_analysis: string
  recommendations: string
  project_name?: string
  entrepreneur_name?: string
  created_at: string
}

export interface ContractTemplate {
  id: number
  name: string
  industry: string
  content: string
  version: string
  status: string
  created_by?: number
  created_by_name?: string
  created_at: string
}

export interface DisputeTicket {
  id: number
  franchisee_id: number
  title: string
  description: string
  category: string
  status: 'open' | 'processing' | 'mediating' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  complainant_id: number
  respondent_id: number
  mediator_id?: number
  resolution?: string
  project_name?: string
  complainant_name?: string
  respondent_name?: string
  mediator_name?: string
  messages?: TicketMessage[]
  created_at: string
}

export interface TicketMessage {
  id: number
  ticket_id: number
  sender_id: number
  content: string
  attachments?: string
  sender_name?: string
  created_at: string
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  return response.json()
}

export const projectApi = {
  list: (params: any = {}) => {
    const query = new URLSearchParams(params).toString()
    return request<PaginatedResponse<Project>>(`/projects?${query}`)
  },
  get: (id: number) => request<Project>(`/projects/${id}`),
  create: (data: any) => request<{ id: number }>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => request<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  review: (id: number, data: any) => request<{ project_id: number; status: string }>(`/projects/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getReview: (id: number) => request<any>(`/projects/${id}/review`),
}

export const franchiseeApi = {
  list: (params: any = {}) => {
    const query = new URLSearchParams(params).toString()
    return request<PaginatedResponse<Franchisee>>(`/franchisees?${query}`)
  },
  stats: (params: any = {}) => {
    const query = new URLSearchParams(params).toString()
    return request<any>(`/franchisees/stats?${query}`)
  },
  create: (data: any) => request<{ id: number }>('/franchisees', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => request<{ id: number }>(`/franchisees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getPerformance: (id: number) => request<any[]>(`/franchisees/${id}/performance`),
  addPerformance: (id: number, data: any) => request<{ id: number }>(`/franchisees/${id}/performance`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

export const riskApi = {
  assess: (entrepreneur_id: number, project_id: number) => request<any>('/risk/assess', {
    method: 'POST',
    body: JSON.stringify({ entrepreneur_id, project_id }),
  }),
  get: (id: number) => request<RiskAssessment>(`/risk/${id}`),
  list: (params: any = {}) => {
    const query = new URLSearchParams(params).toString()
    return request<PaginatedResponse<RiskAssessment>>(`/risk?${query}`)
  },
}

export const contractApi = {
  list: (params: any = {}) => {
    const query = new URLSearchParams(params).toString()
    return request<PaginatedResponse<ContractTemplate>>(`/contracts?${query}`)
  },
  get: (id: number) => request<ContractTemplate>(`/contracts/${id}`),
  create: (data: any) => request<{ id: number }>('/contracts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => request<{ id: number }>(`/contracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => request<void>(`/contracts/${id}`, {
    method: 'DELETE',
  }),
}

export const disputeApi = {
  list: (params: any = {}) => {
    const query = new URLSearchParams(params).toString()
    return request<PaginatedResponse<DisputeTicket>>(`/disputes?${query}`)
  },
  get: (id: number) => request<DisputeTicket>(`/disputes/${id}`),
  create: (data: any) => request<{ id: number }>('/disputes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => request<{ id: number }>(`/disputes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  addMessage: (id: number, data: any) => request<{ id: number }>(`/disputes/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  stats: () => request<any>('/disputes/stats'),
}
