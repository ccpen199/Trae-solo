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
  title?: string
  company?: string
  certification: 'gold' | 'silver' | 'bronze'
  region: string
  experience?: number
  styles: string[]
  rating: number
  casesCount?: number
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

export const CERT_BG: Record<string, string> = {
  gold: 'bg-yellow-500/10',
  silver: 'bg-gray-400/10',
  bronze: 'bg-amber-700/10',
}

export const CERT_DETAILS: Record<string, { label: string; desc: string; requirements: string[] }> = {
  gold: {
    label: '金牌认证设计师',
    desc: '最高等级认证，从业10年以上，服务超500位业主，0投诉记录',
    requirements: [
      '从业年限 ≥ 10年',
      '已完成案例 ≥ 100个',
      '业主好评率 ≥ 98%',
      '近3年零投诉记录',
      '持有注册室内设计师资格证',
    ],
  },
  silver: {
    label: '银牌认证设计师',
    desc: '高级认证，从业5年以上，服务超200位业主，口碑优良',
    requirements: [
      '从业年限 ≥ 5年',
      '已完成案例 ≥ 50个',
      '业主好评率 ≥ 95%',
      '近1年无有效投诉',
      '具备专业设计资质',
    ],
  },
  bronze: {
    label: '铜牌认证设计师',
    desc: '初级认证，从业2年以上，服务超50位业主，平台审核通过',
    requirements: [
      '从业年限 ≥ 2年',
      '已完成案例 ≥ 15个',
      '业主好评率 ≥ 90%',
      '平台身份信息核验通过',
      '提交作品集审核通过',
    ],
  },
}
