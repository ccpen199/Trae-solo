export interface User {
  id: string
  name: string
  idCard: string
  phone: string
  avatar: string
  realNameVerified: boolean
  elderlyMode: boolean
  fontScale: number
  voiceNav: boolean
  relatives: Relative[]
}

export interface Relative {
  id: string
  name: string
  relation: string
  idCardMasked: string
  authorized: boolean
}

export interface LoginRequest {
  phone?: string
  idCard?: string
  verifyCode?: string
  ssoToken?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface SocialAccount {
  social: {
    pension: number
    medical: number
    unemployment: number
    workInjury: number
    maternity: number
    months: number
    status: 'normal' | 'paused' | 'stopped'
  }
  fund: {
    balance: number
    monthly: number
    months: number
    lastDeposit: string
  }
}

export interface PaymentRecord {
  id: string
  month: string
  type: 'pension' | 'medical' | 'fund' | string
  base: number
  personal: number
  company: number
  status: 'paid' | 'pending'
}

export type HouseholdBizType = 'settle' | 'residence' | 'newborn'

export interface HouseholdBiz {
  id: string
  type: HouseholdBizType
  title: string
  status:
    | 'draft'
    | 'submitted'
    | 'reviewing'
    | 'material'
    | 'approved'
    | 'rejected'
    | 'completed'
  steps: {
    name: string
    status: 'done' | 'active' | 'pending'
    time?: string
    desc?: string
  }[]
  submittedAt?: string
  estimatedDays?: number
  materials: {
    name: string
    required: boolean
    uploaded: boolean
    ocrPassed?: boolean
  }[]
}

export interface HealthCode {
  status: 'green' | 'yellow' | 'red'
  qrToken: string
  updatedAt: string
  vaccine: { name: string; doses: number; lastDate: string }
  pcr: { result: 'negative' | 'positive'; date: string; lab: string } | null
}

export interface Certificate {
  id: string
  type: 'idcard' | 'driver' | 'marriage'
  title: string
  numberMasked: string
  holder: string
  issueDate: string
  expireDate: string
  issueBy: string
  status: 'valid' | 'expiring' | 'expired'
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  module: string
  ip: string
  ua: string
  time: string
  result: 'success' | 'fail'
  detail?: string
}

export interface TransportQr {
  token: string
  expireIn: number
  balance: number
  type: string
}

export interface TransportRecord {
  id: string
  time: string
  route: string
  amount: number
  type: 'bus' | 'subway'
}

export interface School {
  id: string
  name: string
  district: string
  address: string
  level: 'primary' | 'junior' | 'senior'
}

export interface District {
  code: string
  name: string
  schools: number
}

export interface EnrollRequest {
  childName: string
  childIdCard: string
  schoolId: string
  district: string
  materials: { name: string; uploaded: boolean }[]
}

export interface RecommendService {
  id: string
  title: string
  icon: string
  description: string
  category: string
  usageCount: number
}

declare module 'express' {
  interface Request {
    userId?: string
    auditAction?: string
    auditModule?: string
  }
}
