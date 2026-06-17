import type { OrderCategory, OrderStatus } from '../types';

export const COLORS = {
  primary: '#1E88E5',
  primaryLight: '#42A5F5',
  primaryDark: '#1565C0',
  accent: '#FFC107',
  accentLight: '#FFD54F',
  success: '#4CAF50',
  warning: '#FF5722',
  danger: '#F44336',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  admin: {
    bg: '#0F172A',
    sidebar: '#0F172A',
    highlight: '#1E88E5',
  },
} as const;

export interface OrderCategoryConfig {
  key: OrderCategory;
  name: string;
  color: string;
  iconName: string;
  desc: string;
}

export const ORDER_CATEGORIES: OrderCategoryConfig[] = [
  {
    key: 'buy',
    name: '帮我买',
    color: '#1E88E5',
    iconName: 'ShoppingBag',
    desc: '帮您代购各类商品',
  },
  {
    key: 'send',
    name: '帮我送',
    color: '#FFC107',
    iconName: 'Send',
    desc: '帮您递送文件物品',
  },
  {
    key: 'fetch',
    name: '帮我取',
    color: '#4CAF50',
    iconName: 'Package',
    desc: '帮您取快递物品',
  },
  {
    key: 'errand',
    name: '帮我办',
    color: '#FF5722',
    iconName: 'ClipboardList',
    desc: '帮您处理各种杂事',
  },
];

export interface OrderStatusConfig {
  key: OrderStatus;
  name: string;
  color: string;
}

export const ORDER_STATUS: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    key: 'pending',
    name: '待接单',
    color: '#FFC107',
  },
  accepted: {
    key: 'accepted',
    name: '已接单',
    color: '#1E88E5',
  },
  picked_up: {
    key: 'picked_up',
    name: '已取件',
    color: '#7C3AED',
  },
  delivering: {
    key: 'delivering',
    name: '配送中',
    color: '#06B6D4',
  },
  completed: {
    key: 'completed',
    name: '已完成',
    color: '#4CAF50',
  },
  cancelled: {
    key: 'cancelled',
    name: '已取消',
    color: '#9CA3AF',
  },
  disputed: {
    key: 'disputed',
    name: '有争议',
    color: '#F44336',
  },
};

export interface RiderLevelConfig {
  level: number;
  name: string;
  color: string;
  minOrders: number;
  benefits: string[];
}

export const RIDER_LEVELS: RiderLevelConfig[] = [
  {
    level: 1,
    name: '新手骑手',
    color: '#9CA3AF',
    minOrders: 0,
    benefits: ['基础接单权限'],
  },
  {
    level: 2,
    name: '青铜骑手',
    color: '#CD7F32',
    minOrders: 50,
    benefits: ['优先接单', '每单+0.5元补贴'],
  },
  {
    level: 3,
    name: '白银骑手',
    color: '#C0C0C0',
    minOrders: 200,
    benefits: ['优先接单', '每单+1元补贴', '专属客服'],
  },
  {
    level: 4,
    name: '黄金骑手',
    color: '#FFD700',
    minOrders: 500,
    benefits: ['优先接单', '每单+1.5元补贴', '专属客服', '月度奖励'],
  },
  {
    level: 5,
    name: '钻石骑手',
    color: '#1E88E5',
    minOrders: 1000,
    benefits: ['最高优先级', '每单+2元补贴', '1对1管家', '月度大奖', '专属标识'],
  },
];

export interface VehicleTypeConfig {
  key: string;
  name: string;
  icon: string;
  maxWeight: number;
  speedFactor: number;
}

export const VEHICLE_TYPES: VehicleTypeConfig[] = [
  {
    key: 'ebike',
    name: '电动车',
    icon: 'Bike',
    maxWeight: 20,
    speedFactor: 1,
  },
  {
    key: 'motorcycle',
    name: '摩托车',
    icon: 'Zap',
    maxWeight: 30,
    speedFactor: 1.3,
  },
  {
    key: 'car',
    name: '汽车',
    icon: 'Car',
    maxWeight: 100,
    speedFactor: 1.5,
  },
];

export interface CityConfig {
  code: string;
  name: string;
  province: string;
}

export const CITIES: CityConfig[] = [
  { code: '110000', name: '北京', province: '北京市' },
  { code: '310000', name: '上海', province: '上海市' },
  { code: '440100', name: '广州', province: '广东省' },
  { code: '440300', name: '深圳', province: '广东省' },
  { code: '510100', name: '成都', province: '四川省' },
  { code: '330100', name: '杭州', province: '浙江省' },
  { code: '500100', name: '重庆', province: '重庆市' },
  { code: '420100', name: '武汉', province: '湖北省' },
  { code: '610100', name: '西安', province: '陕西省' },
  { code: '320500', name: '苏州', province: '江苏省' },
  { code: '120000', name: '天津', province: '天津市' },
  { code: '320100', name: '南京', province: '江苏省' },
  { code: '430100', name: '长沙', province: '湖南省' },
  { code: '210100', name: '沈阳', province: '辽宁省' },
  { code: '370200', name: '青岛', province: '山东省' },
  { code: '410100', name: '郑州', province: '河南省' },
  { code: '210200', name: '大连', province: '辽宁省' },
  { code: '441900', name: '东莞', province: '广东省' },
  { code: '330200', name: '宁波', province: '浙江省' },
  { code: '350200', name: '厦门', province: '福建省' },
  { code: '350100', name: '福州', province: '福建省' },
  { code: '320200', name: '无锡', province: '江苏省' },
  { code: '340100', name: '合肥', province: '安徽省' },
  { code: '530100', name: '昆明', province: '云南省' },
  { code: '230100', name: '哈尔滨', province: '黑龙江省' },
  { code: '370100', name: '济南', province: '山东省' },
  { code: '440600', name: '佛山', province: '广东省' },
  { code: '220100', name: '长春', province: '吉林省' },
  { code: '330300', name: '温州', province: '浙江省' },
  { code: '130100', name: '石家庄', province: '河北省' },
  { code: '450100', name: '南宁', province: '广西壮族自治区' },
  { code: '520100', name: '贵阳', province: '贵州省' },
  { code: '360100', name: '南昌', province: '江西省' },
  { code: '140100', name: '太原', province: '山西省' },
  { code: '370600', name: '烟台', province: '山东省' },
  { code: '620100', name: '兰州', province: '甘肃省' },
  { code: '440400', name: '珠海', province: '广东省' },
  { code: '442000', name: '中山', province: '广东省' },
  { code: '331000', name: '台州', province: '浙江省' },
  { code: '441300', name: '惠州', province: '广东省' },
  { code: '130600', name: '保定', province: '河北省' },
  { code: '130400', name: '邯郸', province: '河北省' },
  { code: '131000', name: '廊坊', province: '河北省' },
  { code: '440800', name: '湛江', province: '广东省' },
  { code: '440500', name: '汕头', province: '广东省' },
  { code: '450300', name: '桂林', province: '广西壮族自治区' },
  { code: '460200', name: '三亚', province: '海南省' },
  { code: '410300', name: '洛阳', province: '河南省' },
  { code: '320400', name: '常州', province: '江苏省' },
  { code: '320300', name: '徐州', province: '江苏省' },
  { code: '330400', name: '嘉兴', province: '浙江省' },
  { code: '330600', name: '绍兴', province: '浙江省' },
  { code: '330700', name: '金华', province: '浙江省' },
  { code: '340200', name: '芜湖', province: '安徽省' },
  { code: '350500', name: '泉州', province: '福建省' },
  { code: '360700', name: '赣州', province: '江西省' },
  { code: '420600', name: '襄阳', province: '湖北省' },
  { code: '420500', name: '宜昌', province: '湖北省' },
  { code: '510700', name: '绵阳', province: '四川省' },
];

export type CityTier = 'tier1' | 'new_tier1' | 'tier2' | 'tier3';

export const CITY_TIER_PRICING: Record<CityTier, { baseFee: number; perKm: number; minFee: number; label: string }> = {
  tier1: { baseFee: 8, perKm: 2.5, minFee: 12, label: '一线城市' },
  new_tier1: { baseFee: 7, perKm: 2.0, minFee: 10, label: '新一线城市' },
  tier2: { baseFee: 6, perKm: 1.8, minFee: 9, label: '二线城市' },
  tier3: { baseFee: 5, perKm: 1.5, minFee: 8, label: '三线城市' },
};

export const CITY_TIER_MAP: Record<string, CityTier> = {
  '北京': 'tier1', '上海': 'tier1', '广州': 'tier1', '深圳': 'tier1',
  '成都': 'new_tier1', '杭州': 'new_tier1', '重庆': 'new_tier1', '武汉': 'new_tier1',
  '西安': 'new_tier1', '苏州': 'new_tier1', '天津': 'new_tier1', '南京': 'new_tier1',
  '长沙': 'new_tier1', '沈阳': 'new_tier1', '青岛': 'new_tier1', '郑州': 'new_tier1',
  '大连': 'new_tier1', '东莞': 'new_tier1', '宁波': 'new_tier1',
  '厦门': 'tier2', '福州': 'tier2', '无锡': 'tier2', '合肥': 'tier2', '昆明': 'tier2',
  '哈尔滨': 'tier2', '济南': 'tier2', '佛山': 'tier2', '长春': 'tier2', '温州': 'tier2',
  '石家庄': 'tier2', '南宁': 'tier2', '贵阳': 'tier2', '南昌': 'tier2', '太原': 'tier2',
  '烟台': 'tier2', '兰州': 'tier2', '珠海': 'tier2', '中山': 'tier2', '台州': 'tier2',
  '惠州': 'tier3', '保定': 'tier3', '邯郸': 'tier3', '廊坊': 'tier3', '湛江': 'tier3',
  '汕头': 'tier3', '桂林': 'tier3', '三亚': 'tier3', '洛阳': 'tier3', '常州': 'tier3',
  '徐州': 'tier3', '嘉兴': 'tier3', '绍兴': 'tier3', '金华': 'tier3', '芜湖': 'tier3',
  '泉州': 'tier3', '赣州': 'tier3', '襄阳': 'tier3', '宜昌': 'tier3', '绵阳': 'tier3',
};

export const DISPATCH_MENU = [
  { key: 'dashboard', name: '工作台', icon: 'LayoutDashboard' },
  { key: 'pricing', name: '计价规则', icon: 'Calculator' },
  { key: 'heatmap', name: '热力地图', icon: 'Map' },
  { key: 'supply', name: '运力监控', icon: 'Users' },
  { key: 'quality', name: '品质引擎', icon: 'Shield' },
  { key: 'arbitration', name: '仲裁中心', icon: 'Gavel' },
  { key: 'insurance', name: '保险服务', icon: 'ShieldCheck' },
];

export function getOrderStatus(status: string): { name: string; color: string } {
  const map: Record<string, { name: string; color: string }> = {
    pending: { name: '待接单', color: 'amber' },
    accepted: { name: '已接单', color: 'blue' },
    picked_up: { name: '已取件', color: 'purple' },
    delivering: { name: '配送中', color: 'cyan' },
    completed: { name: '已完成', color: 'green' },
    cancelled: { name: '已取消', color: 'gray' },
    disputed: { name: '有争议', color: 'red' },
  };
  return map[status] || { name: status, color: 'gray' };
}

export function getCreditLevel(score: number): { name: string; color: string; level: number } {
  if (score >= 900) return { name: 'SSS级', color: 'purple', level: 7 };
  if (score >= 850) return { name: 'SS级', color: 'indigo', level: 6 };
  if (score >= 800) return { name: 'S级', color: 'blue', level: 5 };
  if (score >= 750) return { name: 'A级', color: 'green', level: 4 };
  if (score >= 700) return { name: 'B级', color: 'yellow', level: 3 };
  if (score >= 650) return { name: 'C级', color: 'orange', level: 2 };
  return { name: 'D级', color: 'red', level: 1 };
}
