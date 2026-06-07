export interface User {
  id: number
  username: string
  name: string
  phone?: string
  role: 'director' | 'manager' | 'agent'
  org_id: number
  cert_status: 'pending' | 'certified' | 'rejected'
  real_name?: string
  avatar?: string
  org_name?: string
}

export interface Client {
  id: number
  name: string
  phone: string
  intent_type: 'buy' | 'rent'
  budget_min?: number
  budget_max?: number
  preferred_area?: string
  house_type_pref?: string
  status: 'active' | 'dealing' | 'closed'
  agent_id: number
  source?: string
  remark?: string
  created_at: string
  updated_at: string
  agent_name?: string
  followups?: Followup[]
}

export interface Followup {
  id: number
  client_id: number
  agent_id: number
  content: string
  type: 'call' | 'visit' | 'wechat' | 'other'
  next_followup?: string
  created_at: string
  agent_name?: string
}

export interface House {
  id: number
  title: string
  address: string
  lng?: number
  lat?: number
  price?: number
  unit_type: 'sell' | 'rent'
  house_type?: string
  area?: number
  floor_info?: string
  orientation?: string
  decoration?: string
  status: 'available' | 'reserved' | 'sold' | 'rented' | 'offline'
  agent_id: number
  cert_no?: string
  cert_status: 'pending' | 'verified' | 'failed'
  images: string
  description?: string
  community?: string
  built_year?: number
  created_at: string
  updated_at: string
  agent_name?: string
}

export interface Schedule {
  id: number
  agent_id: number
  house_id: number
  client_id: number
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  remark?: string
  created_at: string
  house_title?: string
  client_name?: string
  agent_name?: string
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  total?: number
  page?: number
  pageSize?: number
}

export interface AuthState {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  isAuthenticated: boolean
}
