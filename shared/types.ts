export type CityName = string

export type MemberLevel = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface CrossCityBenefit {
  id: string
  fromCity: string
  toCity: string
  pointsRatio: number
  enabled: boolean
}

export interface Member {
  id: string
  phone: string
  city: string
  level: MemberLevel
  points: number
  lbsCity: string
  tags: string[]
  avatar: string
  crossCityBenefits: CrossCityBenefit[]
}

export type MerchantCategory = '餐饮' | '零售' | '娱乐' | '美容' | '酒店'

export type MerchantAuditStatus = 'pending_ocr' | 'pending_review' | 'pending_deposit' | 'active' | 'rejected'

export type SettlementCycle = 'T+1' | 'T+3' | 'T+7'

export interface MerchantQualification {
  businessLicense: string
  legalPerson: string
  registeredCapital: number
}

export interface Merchant {
  id: string
  name: string
  category: MerchantCategory
  city: string
  auditStatus: MerchantAuditStatus
  settlementCycle: SettlementCycle
  deposit: number
  qualification: MerchantQualification
}

export type ProductType = 'movie' | 'ecommerce' | 'local_life'

export interface CinemaInfo {
  name: string
  hall: string
  showtime: string
}

export interface Product {
  id: string
  name: string
  type: ProductType
  city: string
  price: number
  originalPrice: number
  image: string
  cpsRate?: number
  externalUrl?: string
  cinema?: CinemaInfo
  merchant?: string
  rating?: number
  distance?: number
  category?: string
  description?: string
}

export interface CityMetrics {
  city: string
  gmv: number
  gmvTrend: number[]
  repurchaseRate: number
  repurchaseTrend: number[]
  couponRedemptionRate: number
  couponTrend: number[]
}

export interface CrossCityFlow {
  fromCity: string
  toCity: string
  amount: number
  transactions: number
}

export type AuditStep = 'ocr' | 'review' | 'deposit'
export type AuditStatus = 'pending' | 'passed' | 'rejected'

export interface AuditRecord {
  id: string
  merchantId: string
  step: AuditStep
  status: AuditStatus
  datetime: string
  note?: string
}

export type PointRecordType = 'earn' | 'redeem'

export interface PointRecord {
  id: string
  memberId: string
  type: PointRecordType
  amount: number
  city: string
  datetime: string
  description: string
}

export interface SettlementConfig {
  id: string
  merchantId: string
  cycle: SettlementCycle
  minAmount: number
  lastSettlement: string
}

export interface City {
  code: string
  name: string
  memberCount: number
  merchantCount: number
}
