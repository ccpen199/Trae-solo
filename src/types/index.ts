export type CategoryType =
  | 'job'
  | 'rent'
  | 'share'
  | 'secondhand_house'
  | 'secondhand'
  | 'vehicle'
  | 'service'
  | 'education'
  | 'pet'
  | 'dating'
  | 'franchise'
  | 'other'

export interface Location {
  province: string
  city: string
  district: string
}

export interface PostStats {
  views: number
  leads: number
  conversions: number
}

export interface PostImage {
  id: string
  postId: string
  url: string
  ocrText?: string
  isPrimary: boolean
}

export interface PostAttribute {
  id: string
  postId: string
  key: string
  value: string
}

export interface Post {
  id: string
  category: CategoryType
  title: string
  description: string
  price?: number
  province: string
  city: string
  district: string
  authorId: string
  authorName?: string
  authorPhone?: string
  authorType: 'user' | 'merchant'
  merchantVerified?: boolean
  merchantRating?: number
  merchantReviewCount?: number
  merchantLicenseNo?: string
  merchantDepositAmount?: number
  merchantDepositStatus?: 'paid' | 'pending' | 'refunded' | 'none'
  merchantName?: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'flagged'
  riskScore: number
  isTop: boolean
  views: number
  leads: number
  conversions: number
  images?: PostImage[]
  attributes?: PostAttribute[]
  createdAt: string
}

export interface User {
  id: string
  phone: string
  name: string
  role: 'user' | 'merchant' | 'city_auditor' | 'province_auditor' | 'admin'
  regionCode?: string
  createdAt: string
}

export interface Merchant {
  id: string
  userId: string
  name: string
  licenseNo: string
  licenseVerified: boolean
  depositAmount: number
  depositStatus: 'paid' | 'pending' | 'refunded' | 'none'
  rating: number
  reviewCount: number
  phone?: string
  userName?: string
}

export interface Review {
  id: string
  merchantId: string
  userId: string
  userName?: string
  rating: number
  content: string
  createdAt: string
}

export interface SensitiveWord {
  id: string
  word: string
  category: string
  hitCount: number
}

export interface RiskResult {
  postId: string
  sensitiveWords: string[]
  imageRisk: 'safe' | 'suspect' | 'dangerous'
  phoneValid: boolean
  overallScore: number
}

export interface AuditRecord {
  id: string
  postId: string
  postTitle?: string
  auditorId: string
  auditorName?: string
  stage: 'initial' | 'review' | 'top_recommend'
  result: 'approved' | 'rejected' | 'flagged'
  comment?: string
  createdAt: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  org: string
  permissions: string[]
  callCount: number
  status: 'active' | 'suspended'
}

export interface GeoRegion {
  code: string
  name: string
  level: 'province' | 'city' | 'district'
  parentCode: string | null
  postCount: number
}

export interface FunnelData {
  views: number
  clicks: number
  leads: number
  conversions: number
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface CategoryStat {
  category: string
  count: number
  percentage: number
}

export const CATEGORIES: { key: CategoryType; label: string; icon: string; color: string }[] = [
  { key: 'job', label: '求职招聘', icon: 'Briefcase', color: '#3B82F6' },
  { key: 'rent', label: '房屋出租', icon: 'Home', color: '#10B981' },
  { key: 'share', label: '房屋合租', icon: 'Users', color: '#8B5CF6' },
  { key: 'secondhand_house', label: '二手房', icon: 'Building2', color: '#F59E0B' },
  { key: 'secondhand', label: '二手物品', icon: 'Package', color: '#EF4444' },
  { key: 'vehicle', label: '车辆交易', icon: 'Car', color: '#06B6D4' },
  { key: 'service', label: '本地服务', icon: 'Wrench', color: '#EC4899' },
  { key: 'education', label: '教育培训', icon: 'GraduationCap', color: '#6366F1' },
  { key: 'pet', label: '宠物', icon: 'Heart', color: '#F97316' },
  { key: 'dating', label: '婚恋交友', icon: 'HeartHandshake', color: '#E11D48' },
  { key: 'franchise', label: '招商加盟', icon: 'TrendingUp', color: '#14B8A6' },
  { key: 'other', label: '其他', icon: 'MoreHorizontal', color: '#6B7280' },
]

export const CATEGORY_FIELD_SCHEMAS: Record<CategoryType, { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[]> = {
  job: [
    { key: 'salary_range', label: '期望薪资', type: 'select', options: ['面议', '3K以下', '3K-5K', '5K-8K', '8K-12K', '12K-20K', '20K以上'] },
    { key: 'experience', label: '工作年限', type: 'select', options: ['应届', '1-3年', '3-5年', '5-10年', '10年以上'] },
    { key: 'education', label: '学历要求', type: 'select', options: ['不限', '高中', '大专', '本科', '硕士', '博士'] },
    { key: 'job_type', label: '工作类型', type: 'select', options: ['全职', '兼职', '实习', '远程'] },
  ],
  rent: [
    { key: 'area', label: '面积', type: 'text' },
    { key: 'orientation', label: '朝向', type: 'select', options: ['东', '南', '西', '北', '南北', '东西'] },
    { key: 'payment', label: '付款方式', type: 'select', options: ['押一付一', '押一付三', '押一付六', '年付'] },
    { key: 'room_type', label: '户型', type: 'select', options: ['一室', '两室', '三室', '四室及以上'] },
  ],
  share: [
    { key: 'room_count', label: '房间数', type: 'select', options: ['2室', '3室', '4室及以上'] },
    { key: 'current_gender', label: '现住户性别', type: 'select', options: ['男', '女', '男女混住'] },
    { key: 'area', label: '面积', type: 'text' },
    { key: 'payment', label: '付款方式', type: 'select', options: ['押一付一', '押一付三', '押一付六'] },
  ],
  secondhand_house: [
    { key: 'area', label: '面积', type: 'text' },
    { key: 'room_type', label: '户型', type: 'select', options: ['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室及以上'] },
    { key: 'floor', label: '楼层', type: 'text' },
    { key: 'decoration', label: '装修', type: 'select', options: ['毛坯', '简装', '精装', '豪装'] },
    { key: 'property_year', label: '产权年限', type: 'select', options: ['40年', '50年', '70年'] },
  ],
  secondhand: [
    { key: 'item_condition', label: '成色', type: 'select', options: ['全新', '99新', '9成新', '8成新', '7成新及以下'] },
    { key: 'original_price', label: '原价', type: 'number' },
    { key: 'warranty', label: '保修', type: 'select', options: ['无保修', '在保', '过保'] },
  ],
  vehicle: [
    { key: 'brand', label: '品牌车型', type: 'text' },
    { key: 'mileage', label: '里程', type: 'text' },
    { key: 'year', label: '年份', type: 'text' },
    { key: 'fuel_type', label: '燃料类型', type: 'select', options: ['汽油', '柴油', '电动', '混合动力'] },
    { key: 'transmission', label: '变速箱', type: 'select', options: ['手动', '自动'] },
  ],
  service: [
    { key: 'service_type', label: '服务类型', type: 'select', options: ['家政', '维修', '搬家', '保洁', '其他'] },
    { key: 'service_area', label: '服务区域', type: 'text' },
    { key: 'availability', label: '可用时间', type: 'text' },
  ],
  education: [
    { key: 'course_type', label: '课程类型', type: 'select', options: ['语言', 'IT技术', '职业资格', '艺术', '学科辅导', '其他'] },
    { key: 'class_mode', label: '上课方式', type: 'select', options: ['线上', '线下', '线上+线下'] },
    { key: 'duration', label: '课时', type: 'text' },
  ],
  pet: [
    { key: 'pet_type', label: '宠物类型', type: 'select', options: ['狗', '猫', '鸟', '鱼', '其他'] },
    { key: 'breed', label: '品种', type: 'text' },
    { key: 'age', label: '年龄', type: 'text' },
    { key: 'vaccinated', label: '是否疫苗', type: 'select', options: ['是', '否'] },
  ],
  dating: [
    { key: 'age_range', label: '年龄', type: 'text' },
    { key: 'height', label: '身高', type: 'text' },
    { key: 'occupation', label: '职业', type: 'text' },
    { key: 'hobby', label: '兴趣爱好', type: 'text' },
  ],
  franchise: [
    { key: 'industry', label: '行业', type: 'select', options: ['餐饮', '零售', '教育', '美容', '健身', '其他'] },
    { key: 'investment_range', label: '投资额', type: 'select', options: ['10万以下', '10-50万', '50-100万', '100万以上'] },
    { key: 'store_count', label: '门店数量', type: 'text' },
  ],
  other: [
    { key: 'item_type', label: '类型', type: 'text' },
  ],
}
