import type { OrderStatus } from '../types/order';
import type { TopicCategory } from '../types/topic';
import type { PartnerLevel } from '../types/partner';

export const WITHDRAW_DAILY_LIMIT = 5000;

export const WITHDRAW_SINGLE_LIMIT = 2000;

export const AML_TRANSACTION_THRESHOLD = 30000;

export const AML_DAILY_THRESHOLD = 50000;

export const AML_MONTHLY_THRESHOLD = 100000;

export const SENSITIVE_WORD_THRESHOLD = 0.7;

export const MAX_PARTNER_LEVELS = 3;

export const DEFAULT_COMMISSION_RATES: [number, number, number] = [0.15, 0.05, 0.02];

export const REDPACKET_EXPIRE_DAYS = 30;

export const ESCROW_FREEZE_HOURS = 168;

export const SIGN_IN_REWARDS: number[] = [0.1, 0.1, 0.2, 0.2, 0.3, 0.3, 0.5];

export const INVITE_REWARD = 1.0;

export const REVIEW_REWARD = 0.5;

export const TOPIC_CATEGORIES: { label: string; value: TopicCategory }[] = [
  { label: '生活', value: 'life' },
  { label: '求助', value: 'help' },
  { label: '活动', value: 'activity' },
  { label: '公告', value: 'notice' },
  { label: '二手', value: 'secondhand' },
  { label: '投诉', value: 'complaint' },
  { label: '闲聊', value: 'chat' },
  { label: '其他', value: 'other' },
];

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  preparing: '备货中',
  shipping: '配送中',
  delivered: '已送达',
  pending_pickup: '待自提',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
};

export const SECONDHAND_CONDITION_MAP: Record<string, string> = {
  new: '全新',
  like_new: '几乎全新',
  good: '良好',
  fair: '一般',
  poor: '较差',
};

export const PARTNER_LEVEL_MAP: Record<PartnerLevel, { label: string; minRequirement: number }> = {
  bronze: { label: '铜牌合伙人', minRequirement: 0 },
  silver: { label: '银牌合伙人', minRequirement: 1000 },
  gold: { label: '金牌合伙人', minRequirement: 5000 },
  diamond: { label: '钻石合伙人', minRequirement: 20000 },
};
