export interface UserInfo {
  id: string
  username: string
  avatar?: string
  role: string
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface Station {
  id: string
  name: string
  address: string
  pileCount: number
  status: 'online' | 'offline' | 'maintenance'
  operator: string
  createTime: string
}

export interface Pile {
  id: string
  name: string
  stationId: string
  stationName: string
  power: number
  type: 'dc' | 'ac'
  status: 'idle' | 'charging' | 'offline' | 'fault'
  createTime: string
}

export interface Order {
  id: string
  orderNo: string
  userId: string
  userName: string
  pileId: string
  pileName: string
  stationName: string
  startTime: string
  endTime?: string
  duration?: number
  energy?: number
  amount?: number
  status: 'charging' | 'completed' | 'cancelled' | 'fault'
}

export interface UserProfile {
  id: string
  username: string
  phone: string
  avatar?: string
  level: string
  totalCharges: number
  totalEnergy: number
  totalAmount: number
  tags: string[]
  registerTime: string
}

export interface Operator {
  id: string
  name: string
  contact: string
  phone: string
  stationCount: number
  status: 'active' | 'inactive'
  createTime: string
}
