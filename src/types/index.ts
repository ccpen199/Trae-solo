export interface User {
  id: string
  name: string
  idCard: string
  phone: string
  avatar: string
  verified: boolean
  elderlyMode: boolean
  fontSize: number
  proxyBindings: ProxyBinding[]
}

export interface ProxyBinding {
  proxyUserId: string
  proxyName: string
  relation: string
  authorizedScopes: string[]
  boundAt: string
}

export interface Certificate {
  id: string
  type: string
  holderName: string
  holderIdCard: string
  issueDate: string
  expiryDate: string
  status: '有效' | '过期' | '即将过期'
  details: Record<string, string>
}

export interface ServiceItem {
  id: string
  category: '政务办事' | '城市服务' | '公共服务'
  subCategory: string
  name: string
  description: string
  iconName: string
  requiredCerts: string[]
  avgProcessingDays: number
  onlineProcessing: boolean
  steps: ServiceStep[]
}

export interface ServiceStep {
  order: number
  title: string
  description: string
  requiredMaterials: string[]
  estimatedDays: number
}

export interface ApplicationRecord {
  id: string
  serviceId: string
  serviceName: string
  status: '待提交' | '审核中' | '补正中' | '已办结' | '已驳回'
  submittedAt: string
  estimatedCompletion: string
  completedAt?: string
  satisfaction?: number
  feedback?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: '政策公告' | '应急通知' | '社区活动' | '服务通知'
  date: string
  priority: '普通' | '紧急' | '特别紧急'
}

export interface ScenicSpot {
  id: string
  name: string
  image: string
  address: string
  rating: number
  ticketPrice: number
  availableDates: string[]
  description: string
}

export interface Hospital {
  id: string
  name: string
  level: string
  address: string
  departments: Department[]
}

export interface Department {
  id: string
  name: string
  doctors: Doctor[]
}

export interface Doctor {
  id: string
  name: string
  title: string
  specialty: string
  schedule: { date: string; periods: string[] }[]
}

export interface EducationPayment {
  id: string
  schoolName: string
  studentName: string
  items: { name: string; amount: number }[]
  status: '待缴费' | '已缴费'
  dueDate: string
}

export interface EfficiencyMetrics {
  serviceId: string
  serviceName: string
  totalApplications: number
  avgProcessingDays: number
  completionRate: number
  satisfactionAvg: number
  satisfactionDistribution: { score: number; count: number }[]
  abnormalInterruptions: AbnormalInterruption[]
  trendData: { date: string; applications: number; avgDays: number }[]
}

export interface AbnormalInterruption {
  id: string
  applicationId: string
  type: '材料不全' | '系统超时' | '用户放弃' | '审核驳回'
  occurredAt: string
  description: string
  resolution?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  relatedService?: string
  flowSteps?: ServiceStep[]
}
