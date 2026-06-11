import { MembershipLevel } from './enums';
import type { MembershipBenefit } from './types';

export const API_PREFIX = '/api/v1';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const ORDER_NO_PREFIX = 'PO';
export const CONSULTATION_ORDER_NO_PREFIX = 'CO';

export const MEMBERSHIP_GROWTH_POINTS_RULE = {
  ORDER_AMOUNT_RATIO: 1,
  REVIEW_BONUS: 10,
  SHARE_BONUS: 5,
  DAILY_SIGN_IN: 1,
  TRIAL_REVIEW_BONUS: 50,
  POST_BONUS: 20,
  LIKE_GIVEN_BONUS: 0.1,
} as const;

export const MEMBERSHIP_BENEFITS: Record<MembershipLevel, MembershipBenefit> = {
  [MembershipLevel.NORMAL]: {
    level: MembershipLevel.NORMAL,
    minGrowthPoints: 0,
    maxGrowthPoints: 999,
    discountRate: 1,
    pointMultiplier: 1,
    freeShippingThreshold: 99,
    monthlyCoupons: [],
    exclusiveProducts: [],
    customerServiceLevel: 'standard',
  },
  [MembershipLevel.BRONZE]: {
    level: MembershipLevel.BRONZE,
    minGrowthPoints: 1000,
    maxGrowthPoints: 4999,
    discountRate: 0.98,
    pointMultiplier: 1.2,
    freeShippingThreshold: 79,
    monthlyCoupons: [],
    exclusiveProducts: [],
    customerServiceLevel: 'standard',
  },
  [MembershipLevel.SILVER]: {
    level: MembershipLevel.SILVER,
    minGrowthPoints: 5000,
    maxGrowthPoints: 19999,
    discountRate: 0.95,
    pointMultiplier: 1.5,
    freeShippingThreshold: 59,
    monthlyCoupons: [],
    exclusiveProducts: [],
    customerServiceLevel: 'priority',
  },
  [MembershipLevel.GOLD]: {
    level: MembershipLevel.GOLD,
    minGrowthPoints: 20000,
    maxGrowthPoints: 49999,
    discountRate: 0.92,
    pointMultiplier: 2,
    freeShippingThreshold: 39,
    monthlyCoupons: [],
    exclusiveProducts: [],
    customerServiceLevel: 'priority',
  },
  [MembershipLevel.PLATINUM]: {
    level: MembershipLevel.PLATINUM,
    minGrowthPoints: 50000,
    maxGrowthPoints: 99999,
    discountRate: 0.88,
    pointMultiplier: 2.5,
    freeShippingThreshold: 19,
    monthlyCoupons: [],
    exclusiveProducts: [],
    customerServiceLevel: 'vip',
  },
  [MembershipLevel.DIAMOND]: {
    level: MembershipLevel.DIAMOND,
    minGrowthPoints: 100000,
    maxGrowthPoints: Infinity,
    discountRate: 0.85,
    pointMultiplier: 3,
    freeShippingThreshold: 0,
    monthlyCoupons: [],
    exclusiveProducts: [],
    customerServiceLevel: 'vip',
  },
};

export const POINT_VALUE_RATIO = 100;

export const FLASH_SALE_STOCK_CACHE_PREFIX = 'flash_sale:stock:';
export const FLASH_SALE_USER_LIMIT_PREFIX = 'flash_sale:user:';
export const FLASH_SALE_LOCK_PREFIX = 'flash_sale:lock:';

export const CART_CACHE_PREFIX = 'cart:user:';
export const CART_CACHE_TTL = 7 * 24 * 60 * 60;

export const USER_TOKEN_CACHE_PREFIX = 'user:token:';
export const USER_REFRESH_TOKEN_CACHE_PREFIX = 'user:refresh:';

export const SMS_CODE_CACHE_PREFIX = 'sms:code:';
export const SMS_CODE_TTL = 5 * 60;
export const SMS_CODE_RESEND_INTERVAL = 60;

export const CONTENT_AUTO_AUDIT_THRESHOLD = {
  RISK_KEYWORDS: ['赌博', '色情', '暴力', '反动', '诈骗'],
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,
  MAX_GIF_SIZE: 20 * 1024 * 1024,
} as const;

export const PET_TYPE_LABELS: Record<string, string> = {
  cat: '猫咪',
  dog: '狗狗',
  fish: '水族',
  bird: '鸟类',
  hamster: '仓鼠',
  rabbit: '兔子',
  reptile: '爬宠',
  other: '其他',
};

export const PRODUCT_CATEGORY_TREE = {
  id: 'root',
  name: '全部商品',
  code: 'root',
  level: 0,
  children: [
    {
      id: 'cat_food',
      name: '猫粮',
      code: 'cat_food',
      level: 1,
      children: [
        { id: 'cat_food_dry', name: '主粮', code: 'cat_food_dry', level: 2 },
        { id: 'cat_food_wet', name: '湿粮/罐头', code: 'cat_food_wet', level: 2 },
        { id: 'cat_food_treat', name: '零食', code: 'cat_food_treat', level: 2 },
        { id: 'cat_food_nutrition', name: '营养保健', code: 'cat_food_nutrition', level: 2 },
      ],
    },
    {
      id: 'dog_food',
      name: '狗粮',
      code: 'dog_food',
      level: 1,
      children: [
        { id: 'dog_food_dry', name: '主粮', code: 'dog_food_dry', level: 2 },
        { id: 'dog_food_wet', name: '湿粮/罐头', code: 'dog_food_wet', level: 2 },
        { id: 'dog_food_treat', name: '零食', code: 'dog_food_treat', level: 2 },
        { id: 'dog_food_nutrition', name: '营养保健', code: 'dog_food_nutrition', level: 2 },
      ],
    },
    {
      id: 'aquarium',
      name: '水族用品',
      code: 'aquarium',
      level: 1,
      children: [
        { id: 'aquarium_tank', name: '鱼缸水族箱', code: 'aquarium_tank', level: 2 },
        { id: 'aquarium_filter', name: '过滤设备', code: 'aquarium_filter', level: 2 },
        { id: 'aquarium_fish_food', name: '鱼食饲料', code: 'aquarium_fish_food', level: 2 },
        { id: 'aquarium_decor', name: '造景装饰', code: 'aquarium_decor', level: 2 },
      ],
    },
    {
      id: 'grooming',
      name: '洗护美容',
      code: 'grooming',
      level: 1,
      children: [
        { id: 'grooming_shampoo', name: '洗浴用品', code: 'grooming_shampoo', level: 2 },
        { id: 'grooming_tools', name: '美容工具', code: 'grooming_tools', level: 2 },
        { id: 'grooming_oral', name: '口腔护理', code: 'grooming_oral', level: 2 },
        { id: 'grooming_ear', name: '耳眼护理', code: 'grooming_ear', level: 2 },
      ],
    },
    {
      id: 'medical',
      name: '医疗健康',
      code: 'medical',
      level: 1,
      children: [
        { id: 'medical_vaccine', name: '疫苗驱虫', code: 'medical_vaccine', level: 2 },
        { id: 'medical_drug', name: '药品', code: 'medical_drug', level: 2 },
        { id: 'medical_test', name: '检测试纸', code: 'medical_test', level: 2 },
        { id: 'medical_first_aid', name: '急救用品', code: 'medical_first_aid', level: 2 },
      ],
    },
    {
      id: 'toy',
      name: '玩具用品',
      code: 'toy',
      level: 1,
      children: [
        { id: 'toy_interactive', name: '互动玩具', code: 'toy_interactive', level: 2 },
        { id: 'toy_chew', name: '啃咬玩具', code: 'toy_chew', level: 2 },
        { id: 'toy_catnip', name: '猫薄荷', code: 'toy_catnip', level: 2 },
        { id: 'toy_feather', name: '逗猫棒', code: 'toy_feather', level: 2 },
      ],
    },
  ],
};
