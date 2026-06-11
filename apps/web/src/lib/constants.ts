export const APP_NAME = '宠趣';
export const APP_DESCRIPTION = '爱宠生活，从这里开始';

export const API_PREFIX = '/api/v1';

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  COMMUNITY: '/community',
  ADOPTION: '/adoption',
  CART: '/cart',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
  SEARCH: '/search',
  FLASH_SALE: '/flash-sale',
  DOCTOR: '/doctor',
  MEMBERSHIP: '/membership',
} as const;

export const PET_TYPE_ICONS: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  fish: '🐟',
  bird: '🐦',
  hamster: '🐹',
  rabbit: '🐰',
  reptile: '🦎',
  other: '🐾',
};

export const NAV_CATEGORIES = [
  { id: 'cat_food', name: '猫粮', icon: '🐱' },
  { id: 'dog_food', name: '狗粮', icon: '🐶' },
  { id: 'aquarium', name: '水族', icon: '🐟' },
  { id: 'grooming', name: '洗护', icon: '🛁' },
  { id: 'medical', name: '医疗', icon: '💊' },
  { id: 'toy', name: '玩具', icon: '🎾' },
  { id: 'flash_sale', name: '秒杀', icon: '⚡' },
  { id: 'adoption', name: '领养', icon: '🏠' },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: '待付款',
  pending_confirm: '待确认',
  pending_shipment: '待发货',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
};

export const FLASH_SALE_COUNTDOWN_INTERVAL = 1000;
