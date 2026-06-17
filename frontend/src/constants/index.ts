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
  { code: '330100', name: '杭州', province: '浙江省' },
  { code: '320100', name: '南京', province: '江苏省' },
  { code: '510100', name: '成都', province: '四川省' },
  { code: '420100', name: '武汉', province: '湖北省' },
  { code: '610100', name: '西安', province: '陕西省' },
  { code: '120000', name: '天津', province: '天津市' },
];
