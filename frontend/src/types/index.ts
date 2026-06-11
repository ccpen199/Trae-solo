export interface User {
  id: string
  phone: string
  name: string
  idCard: string
  avatar?: string
  realNameVerified: boolean
  address?: string
  email?: string
  createdAt: string
}

export interface Certificate {
  id: string
  userId: string
  name: string
  type: string
  code: string
  issuer: string
  issueDate: string
  expireDate?: string
  status: 'valid' | 'expired' | 'pending'
  imageUrl?: string
  createdAt: string
}

export interface Service {
  id: string
  name: string
  category: string
  subCategory?: string
  description: string
  icon?: string
  department: string
  handler: string
  processingTime: string
  fee: string
  materials: string[]
  process: string[]
  faq: { question: string; answer: string }[]
  online: boolean
  status: 'online' | 'offline'
  accessType: 'API' | 'SDK' | 'Webview'
  heat: number
  createdAt: string
}

export interface ServiceApplication {
  id: string
  serviceId: string
  serviceName: string
  userId: string
  userName: string
  applicationNo: string
  status: 'pending' | 'reviewing' | 'processing' | 'completed' | 'rejected'
  statusText: string
  formData: Record<string, any>
  materials: { name: string; url?: string; type: string }[]
  certificates: { id: string; name: string }[]
  progress: {
    status: string
    time: string
    description: string
    completed: boolean
  }[]
  submitTime: string
  estimatedTime: string
  completedTime?: string
  result?: string
  rating?: number
  ratingComment?: string
}

export interface SceneTemplate {
  id: string
  name: string
  description: string
  icon?: string
  category: string
  services: {
    serviceId: string
    serviceName: string
    order: number
  }[]
  materials: {
    step: number
    name: string
    required: boolean
    description: string
  }[]
  steps: {
    order: number
    title: string
    description: string
    services: string[]
  }[]
  createdAt: string
}

export interface SceneInstance {
  id: string
  templateId: string
  templateName: string
  userId: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  currentStep: number
  totalSteps: number
  flowStatus: {
    step: number
    title: string
    status: 'pending' | 'processing' | 'completed'
    time?: string
    services: {
      serviceId: string
      serviceName: string
      applicationId?: string
      status: string
    }[]
  }[]
  formData: Record<string, any>
  materials: {
    name: string
    url?: string
    uploaded: boolean
  }[]
  createdAt: string
  completedAt?: string
}

export interface Feedback {
  id: string
  userId: string
  userName: string
  title: string
  content: string
  type: 'complaint' | 'suggestion' | 'consult'
  status: 'submitted' | 'assigned' | 'processing' | 'replied'
  handler?: string
  handleTime?: string
  reply?: string
  rating?: number
  ratingComment?: string
  createdAt: string
}

export interface BusRoute {
  id: string
  routeNo: string
  startStation: string
  endStation: string
  firstBus: string
  lastBus: string
  price: string
  stations: {
    name: string
    index: number
  }[]
  realTimeData?: {
    currentStation: string
    nextStation: string
    arrivalMinutes: number
    busCount: number
  }
}

export interface Venue {
  id: string
  name: string
  type: string
  address: string
  description: string
  imageUrl?: string
  capacity: number
  openTime: string
  closeTime: string
  facilities: string[]
  available: boolean
}

export interface VenueBooking {
  id: string
  venueId: string
  venueName: string
  userId: string
  userName: string
  date: string
  timeSlot: string
  peopleCount: number
  phone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
}

export interface CommunityRepair {
  id: string
  userId: string
  userName: string
  title: string
  description: string
  address: string
  type: string
  phone: string
  imageUrls?: string[]
  status: 'pending' | 'assigned' | 'processing' | 'completed'
  handler?: string
  handleTime?: string
  result?: string
  createdAt: string
}

export interface NeighborhoodHelp {
  id: string
  userId: string
  userName: string
  title: string
  content: string
  type: 'help' | 'offer'
  phone: string
  address?: string
  status: 'open' | 'resolved' | 'closed'
  createdAt: string
  replies?: {
    userId: string
    userName: string
    content: string
    createdAt: string
  }[]
}

export interface HeatmapData {
  district: string
  value: number
  serviceCount: number
  userCount: number
  avgProcessingTime: number
}

export interface FusionData {
  id: string
  title: string
  type: 'service' | 'user' | 'application' | 'venue'
  value: number
  trend: number
  unit: string
  timestamp: string
}

export interface MonitorData {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'error'
  uptime: number
  responseTime: number
  lastCheck: string
  errorRate: number
  alerts: {
    time: string
    level: 'info' | 'warning' | 'error'
    message: string
  }[]
}

export interface ApiResponse<T = any> {
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
