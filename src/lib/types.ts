export interface CaseItem {
  id: string
  title: string
  style: string
  houseType: string
  area: number
  budgetMin: number
  budgetMax: number
  coverImage: string
  images: string[]
  floorPlan: string
  model3dUrl: string
  designerId: string
  designerName?: string
  status: 'pending' | 'approved' | 'rejected'
  watermarkVerified: boolean
  createdAt: string
  materials?: MaterialItem[]
  constructionNodes?: ConstructionNodeItem[]
}

export interface MaterialItem {
  id: string
  caseId: string
  name: string
  brand: string
  model: string
  unitPrice: number
  quantity: number
  area: string
}

export interface ConstructionNodeItem {
  id: string
  caseId: string
  phase: string
  description: string
  duration: string
  order: number
}

export interface DesignerItem {
  id: string
  name: string
  avatar: string
  certification: 'gold' | 'silver' | 'bronze'
  region: string
  styles: string[]
  rating: number
  description: string
  priceMin: number
  priceMax: number
  portfolioCount?: number
  cases?: CaseItem[]
}

export interface FavoriteItem {
  id: string
  userId: string
  targetType: 'case' | 'designer'
  targetId: string
  createdAt: string
}

export interface CostResult {
  total: number
  labor: number
  auxiliary: number
  mainMaterial: number
  furniture: number
  appliance: number
}

export interface CityPrice {
  id: string
  city: string
  laborPrice: number
  auxiliaryPrice: number
  mainMaterialMultiplier: number
}

export interface AdminStats {
  totalCases: number
  totalDesigners: number
  totalUsers: number
  weeklyTrends: { style: string; count: number; change: number }[]
}

export const STYLES = ['现代简约', '北欧', '新中式', '日式侘寂', '轻奢', '工业风'] as const
export const HOUSE_TYPES = ['一居', '两居', '三居', '四居', '复式', '别墅'] as const
export const REGIONS = ['北京', '上海', '广州', '深圳', '成都'] as const
export const LEVELS = [
  { value: 'economy', label: '经济型' },
  { value: 'standard', label: '标准型' },
  { value: 'premium', label: '品质型' },
  { value: 'luxury', label: '豪华型' },
] as const

export const CERT_LABELS: Record<string, string> = {
  gold: '金牌认证',
  silver: '银牌认证',
  bronze: '铜牌认证',
}

export const CERT_COLORS: Record<string, string> = {
  gold: 'text-yellow-500',
  silver: 'text-gray-400',
  bronze: 'text-amber-700',
}
