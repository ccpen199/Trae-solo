export const APP_TITLE = import.meta.env.VITE_APP_TITLE || '一站式健康保障服务平台'

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
}

export const ROUTER_PATHS = {
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/',
  HEALTH_CHECK: '/health-check',
  HEALTH_CHECK_DETAIL: '/health-check/:id',
  HEALTH_CHECK_BOOKING: '/health-check/booking/:id',
  INSURANCE: '/insurance',
  INSURANCE_DETAIL: '/insurance/:id',
  INSURANCE_APPLY: '/insurance/apply/:id',
  HEALTH_ARCHIVE: '/health-archive',
  RISK_WARNING: '/risk-warning',
  PROFILE: '/profile',
  ORDERS: '/orders',
  ADMIN: '/admin',
  NOT_FOUND: '*',
}

export const MENU_ITEMS = [
  {
    key: '/',
    label: '首页',
    icon: 'HomeOutlined',
  },
  {
    key: '/health-check',
    label: '体检预约',
    icon: 'HeartOutlined',
  },
  {
    key: '/insurance',
    label: '保险商城',
    icon: 'SafetyOutlined',
  },
  {
    key: '/health-archive',
    label: '健康档案',
    icon: 'FileTextOutlined',
  },
  {
    key: '/risk-warning',
    label: '风险预警',
    icon: 'WarningOutlined',
  },
]

export const GENDER_OPTIONS = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
  { label: '未知', value: 0 },
]

export const STATUS_OPTIONS = [
  { label: '正常', value: 1, color: 'green' },
  { label: '禁用', value: 0, color: 'red' },
]

export const CITIES = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' },
  { label: '成都', value: 'chengdu' },
]

export const PACKAGE_TYPES = [
  { label: '全面体检', value: 'comprehensive' },
  { label: '常规体检', value: 'regular' },
  { label: '专项体检', value: 'special' },
  { label: '入职体检', value: 'employment' },
  { label: '老年体检', value: 'elderly' },
]

export const AGE_GROUPS = [
  { label: '18-30岁', value: '18-30' },
  { label: '31-45岁', value: '31-45' },
  { label: '46-60岁', value: '46-60' },
  { label: '60岁以上', value: '60+' },
]

export const INSURANCE_TYPES = [
  { label: '重疾险', value: 'critical_illness' },
  { label: '医疗险', value: 'medical' },
  { label: '意外险', value: 'accident' },
  { label: '寿险', value: 'life' },
]

