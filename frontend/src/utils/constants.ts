import dayjs from 'dayjs';
import type { ConstructionStage, TransactionStatus, UserRole } from '../types';

export const CONSTRUCTION_STAGE_LABELS: Record<ConstructionStage, { label: string; color: string; bg: string }> = {
  planning: { label: '方案设计', color: 'text-blue-700', bg: 'bg-blue-100' },
  demolition: { label: '拆改阶段', color: 'text-red-700', bg: 'bg-red-100' },
  plumbing_electrical: { label: '水电阶段', color: 'text-amber-700', bg: 'bg-amber-100' },
  masonry_carpentry: { label: '泥木阶段', color: 'text-purple-700', bg: 'bg-purple-100' },
  painting: { label: '油漆阶段', color: 'text-pink-700', bg: 'bg-pink-100' },
  installation: { label: '安装阶段', color: 'text-teal-700', bg: 'bg-teal-100' },
  acceptance: { label: '竣工验收', color: 'text-green-700', bg: 'bg-green-100' }
};

export const STAGE_ORDER: ConstructionStage[] = [
  'planning', 'demolition', 'plumbing_electrical',
  'masonry_carpentry', 'painting', 'installation', 'acceptance'
];

export const HOUSE_TYPE_LABELS: Record<string, string> = {
  apartment: '普通住宅',
  villa: '别墅',
  duplex: '复式',
  loft: 'LOFT',
  townhouse: '联排别墅'
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待支付定金', color: 'text-gray-700', bg: 'bg-gray-100' },
  deposit_paid: { label: '定金已托管', color: 'text-blue-700', bg: 'bg-blue-100' },
  in_progress: { label: '施工进行中', color: 'text-amber-700', bg: 'bg-amber-100' },
  stage_completed: { label: '阶段已完成', color: 'text-purple-700', bg: 'bg-purple-100' },
  completed: { label: '已完成', color: 'text-green-700', bg: 'bg-green-100' },
  disputed: { label: '争议处理中', color: 'text-red-700', bg: 'bg-red-100' },
  cancelled: { label: '已取消', color: 'text-gray-500', bg: 'bg-gray-50' }
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  homeowner: '业主',
  designer: '设计师',
  admin: '管理员'
};

export const DECORATION_STYLES = [
  '北欧风格', '新中式', '现代简约', '美式风格', '欧式古典',
  '日式极简', '工业风', '地中海', '轻奢风格', '法式风格',
  '田园风格', '东南亚风格'
];

export const COMMON_MATERIALS = [
  '岩板', '大理石', '木饰面', '实木地板', '复合地板',
  '抛光砖', '硅藻泥', '乳胶漆', '护墙板', '不锈钢',
  '玻璃', '黄铜'
];

export const BUDGET_CATEGORIES = [
  '设计费', '拆改工程', '水电工程', '泥瓦工程', '木作工程',
  '油漆工程', '瓷砖石材', '地板', '门窗', '橱柜',
  '卫浴', '灯具', '定制家具', '成品家具', '软装装饰', '家电'
];

export const formatCurrency = (amount: number): string => {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`;
  }
  return `¥${amount.toLocaleString()}`;
};

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const fromNow = (date: string | Date): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffMin = now.diff(target, 'minute');
  const diffHour = now.diff(target, 'hour');
  const diffDay = now.diff(target, 'day');

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return target.format('MM-DD');
};

export const getInitials = (name?: string): string => {
  if (!name) return 'U';
  return name.trim().charAt(0).toUpperCase();
};
