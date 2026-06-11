export interface CouponActivity {
  id: string
  name: string
  type: "政务补贴" | "民生优惠" | "商业促销"
  faceValue: number
  totalCount: number
  usedCount: number
  status: "draft" | "active" | "paused" | "expired"
  strategy: "人群包" | "地理围栏" | "满减触发"
  startDate: string
  endDate: string
  budget: number
  budgetUsed: number
  createdAt: string
  strategyConfig?: StrategyConfig
}

export interface VerifyRecord {
  id: string
  couponId: string
  couponName: string
  citizenName: string
  merchantName: string
  terminal: "POS机具" | "小程序码" | "城市码"
  amount: number
  verifyTime: string
  status: "success" | "failed" | "reversed"
}

export interface RiskEvent {
  id: string
  type: "device_multi_account" | "hoarding" | "abnormal_path"
  level: "low" | "medium" | "high" | "critical"
  description: string
  detectedAt: string
  accounts: string[]
  status: "pending" | "processing" | "resolved"
}

export interface Merchant {
  id: string
  name: string
  category: string
  district: string
  status: "active" | "suspended" | "pending_audit"
  verifyCount: number
  verifyAmount: number
  verifyRate: number
}

export interface CitizenCoupon {
  id: string
  activityName: string
  faceValue: number
  type: "政务补贴" | "民生优惠" | "商业促销"
  status: "unused" | "used" | "expired"
  receivedAt: string
  expiredAt: string
  merchantName?: string
  usedAt?: string
}

export interface DashboardMetrics {
  totalIssued: number
  totalVerified: number
  verifyRate: number
  activeMerchants: number
  totalBenefit: number
  dailyTrend: { date: string; issued: number; verified: number }[]
  districtData: { name: string; value: number }[]
  categoryDistribution: { name: string; value: number }[]
}

export interface StrategyConfig {
  groupIds?: string[]
  geoFence?: { lat: number; lng: number; radius: number }
  thresholdAmount?: number
}

export interface SettlementRecord {
  id: string
  city: string
  amount: number
  status: "pending" | "processing" | "completed"
  createdAt: string
}

export interface SubsidyRecord {
  id: string
  department: string
  amount: number
  purpose: string
  status: "draft" | "approved" | "disbursed"
  createdAt: string
}

export interface AuditMerchant {
  id: string
  name: string
  category: string
  legalPerson: string
  licenseNo: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
}

export interface AuditLog {
  id: string
  targetId: string
  targetType: "coupon_activity"
  action: "create" | "edit" | "save_draft" | "submit" | "pause" | "resume" | "view"
  operator: string
  operatorRole: "admin" | "merchant" | "citizen"
  detail: string
  timestamp: string
}
