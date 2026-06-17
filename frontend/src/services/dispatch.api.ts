import { get, put, post } from './request'

export interface HeatmapPoint {
  lat: number
  lng: number
  value: number
  type: 'worker' | 'driver' | 'order'
}

export interface PricingData {
  vehicleTypeId: string
  basePrice: number
  pricePerKm: number
  pricePerFloor: number
  trend: 'up' | 'down' | 'stable'
}

export interface PricePoint {
  date: string
  actualPrice: number
  baselinePrice: number
  isAnomaly: boolean
  changeRate: number
}

export interface CityPrice {
  city: string
  avgPrice: number
  changeRate: number
  isAnomaly: boolean
}

export interface PriceAlertRule {
  id: string
  name: string
  threshold: number
  enabled: boolean
  notifyEmail: boolean
  notifySms: boolean
  notifyPush: boolean
}

export interface PriceAlert {
  id: string
  city: string
  category: string
  price: number
  changeRate: number
  triggeredAt: string
}

export type DisputeStatus = 'pending' | 'processing' | 'closed'
export type DisputeSeverity = 'low' | 'medium' | 'high' | 'urgent'
export type DisputeType = 'price' | 'quality' | 'delay' | 'damage' | 'other'
export type OrderCategory = 'labor' | 'vehicle' | 'moving'

export interface Dispute {
  id: string
  orderId: string
  orderNo: string
  orderCategory: OrderCategory
  type: DisputeType
  typeLabel: string
  status: DisputeStatus
  severity: DisputeSeverity
  priority: number
  complainant: {
    id: string
    name: string
    phone: string
    role: 'employer' | 'worker' | 'driver'
  }
  respondent: {
    id: string
    name: string
    phone: string
    role: 'employer' | 'worker' | 'driver'
  }
  claimAmount: number
  description: string
  slaDeadline: string
  createdAt: string
  updatedAt: string
}

export interface DisputeTimeline {
  id: string
  action: string
  operator: string
  remark: string
  createdAt: string
}

export interface DisputeEvidence {
  id: string
  type: 'image' | 'audio' | 'video' | 'text'
  url: string
  thumbnail?: string
  description: string
  uploadedAt: string
  uploader: string
}

export interface DisputeDetail extends Dispute {
  timeline: DisputeTimeline[]
  evidence: DisputeEvidence[]
  gpsTrack?: { lat: number; lng: number; time: string }[]
  orderDetail?: {
    id: string
    orderNo: string
    scheduledAt: string
    price: number
    description: string
  }
}

export interface QualityRule {
  id: string
  name: string
  description: string
  scope: 'worker' | 'driver' | 'all'
  metric: 'damage_rate' | 'timeout_rate' | 'bad_rate' | 'no_show_rate' | 'complaint_rate'
  metricLabel: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
  operatorLabel: string
  threshold: number
  thresholdMin: number
  thresholdMax: number
  period: 'day' | 'week' | 'month' | 'rolling_30'
  periodLabel: string
  action: 'auto_compensate' | 'deduct_score' | 'suspend' | 'review'
  actionLabel: string
  compensateAmount?: number
  deductScore?: number
  suspendDays?: number
  enabled: boolean
  hitCount: number
  createdAt: string
  updatedAt: string
}

export interface QualityLog {
  id: string
  ruleId: string
  ruleName: string
  targetId: string
  targetName: string
  targetType: 'worker' | 'driver'
  metricValue: number
  threshold: number
  action: string
  actionLabel: string
  compensateAmount: number
  status: 'pending' | 'executed' | 'failed'
  createdAt: string
  executedAt?: string
}

export interface DispatchStats {
  todayOrders: number
  todayOrdersChange: number
  todayRevenue: number
  todayRevenueChange: number
  onlineWorkers: number
  onlineWorkersChange: number
  onlineDrivers: number
  onlineDriversChange: number
  pendingDisputes: number
  pendingDisputesChange: number
  avgResponseTime: number
  avgResponseTimeChange: number
  orderTrend: { date: string; orders: number; revenue: number }[]
  orderTypeDistribution: { type: OrderCategory; name: string; value: number }[]
  supplyDemandRatio: { region: string; supply: number; demand: number; ratio: number }[]
}

export interface ActivityItem {
  id: string
  type: 'new_order' | 'new_dispute' | 'alert'
  title: string
  description: string
  timestamp: string
}

export interface RegionStats {
  region: string
  workers: number
  drivers: number
  demand: number
  supplyDemandRatio: number
}

export const getHeatmapData = (params?: { type?: string; time?: string }) => {
  return get<HeatmapPoint[]>('/dispatch/heatmap', params)
}

export const getRegionStats = (params?: { region?: string }) => {
  return get<RegionStats[]>('/dispatch/heatmap/regions', params)
}

export const getPricingData = (params?: { category?: OrderCategory; days?: number }) => {
  return get<PricePoint[]>('/dispatch/pricing/trend', params)
}

export const getCityPrices = (params?: { category?: OrderCategory }) => {
  return get<CityPrice[]>('/dispatch/pricing/cities', params)
}

export const getPriceAlertRules = () => {
  return get<PriceAlertRule[]>('/dispatch/pricing/alerts/rules')
}

export const updatePriceAlertRule = (id: string, data: Partial<PriceAlertRule>) => {
  return put<PriceAlertRule>(`/dispatch/pricing/alerts/rules/${id}`, data)
}

export const getPriceAlerts = (params?: { limit?: number }) => {
  return get<PriceAlert[]>('/dispatch/pricing/alerts', params)
}

export const getDisputes = (params?: {
  status?: DisputeStatus
  type?: DisputeType
  severity?: DisputeSeverity
  page?: number
  pageSize?: number
}) => {
  return get<{ list: Dispute[]; total: number }>('/dispatch/disputes', params)
}

export const getDisputeStats = () => {
  return get<{
    pending: number
    processing: number
    closed: number
    atRisk: number
  }>('/dispatch/disputes/stats')
}

export const getDisputeDetail = (id: string) => {
  return get<DisputeDetail>(`/dispatch/disputes/${id}`)
}

export interface ResolveDisputeData {
  id: string
  responsibleParty: 'employer' | 'worker' | 'driver' | 'both' | 'none'
  compensationAmount: number
  creditAdjustment: number
  remark: string
}

export const resolveDispute = (data: ResolveDisputeData) => {
  return post<unknown>(`/dispatch/disputes/${data.id}/resolve`, data)
}

export const getQualityRules = () => {
  return get<QualityRule[]>('/dispatch/quality/rules')
}

export const createQualityRule = (data: Omit<QualityRule, 'id' | 'hitCount' | 'createdAt' | 'updatedAt'>) => {
  return post<QualityRule>('/dispatch/quality/rules', data)
}

export const updateQualityRule = (id: string, data: Partial<QualityRule>) => {
  return put<QualityRule>(`/dispatch/quality/rules/${id}`, data)
}

export const toggleQualityRule = (id: string, enabled: boolean) => {
  return put<QualityRule>(`/dispatch/quality/rules/${id}/toggle`, { enabled })
}

export const testQualityRule = (id: string) => {
  return post<{ hitCount: number; samples: QualityLog[] }>(`/dispatch/quality/rules/${id}/test`, {})
}

export const getQualityLogs = (params?: {
  ruleType?: string
  status?: string
  page?: number
  pageSize?: number
}) => {
  return get<{ list: QualityLog[]; total: number }>('/dispatch/quality/logs', params)
}

export const getDispatchStats = () => {
  return get<DispatchStats>('/dispatch/stats')
}

export const getRecentActivities = (params?: { limit?: number }) => {
  return get<ActivityItem[]>('/dispatch/activities', params)
}
