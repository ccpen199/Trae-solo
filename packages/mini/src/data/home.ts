import type { QuickFeature, NoticeItem, CommunityInfo } from '@/types';

export const mockCommunity: CommunityInfo = {
  id: 'seed-community-1',
  name: '阳光花园小区',
  address: '浙江省杭州市西湖区文一西路1008号',
};

export const mockQuickFeatures: QuickFeature[] = [
  { id: '1', name: '门禁开门', icon: '🚪', page: '/pages/access-detail/index', color: '#10B981' },
  { id: '2', name: '报修服务', icon: '🔧', page: '/pages/ticket-create/index?type=REPAIR', color: '#3B82F6' },
  { id: '3', name: '投诉建议', icon: '💬', page: '/pages/ticket-create/index?type=COMPLAINT', color: '#F59E0B' },
  { id: '4', name: '访客授权', icon: '🔑', page: '/pages/access-detail/index', color: '#8B5CF6' },
  { id: '5', name: '家政服务', icon: '🧹', page: '/pages/service/index', color: '#EC4899' },
  { id: '6', name: '快递收发', icon: '📦', page: '/pages/service/index', color: '#06B6D4' },
  { id: '7', name: '社区团购', icon: '🛒', page: '/pages/service/index', color: '#F97316' },
  { id: '8', name: '通行记录', icon: '📋', page: '/pages/access-log/index', color: '#64748B' },
];

export const mockNotices: NoticeItem[] = [
  {
    id: '1',
    title: '关于小区电梯年度检修的通知',
    content: '各位业主您好，小区电梯将于本周六进行年度检修，请合理安排出行时间。',
    createdAt: '2026-06-18 09:30',
    type: 'NOTICE',
  },
  {
    id: '2',
    title: '社区端午包粽子活动报名',
    content: '端午节即将到来，社区将举办包粽子活动，欢迎各位业主报名参加！',
    createdAt: '2026-06-17 14:20',
    type: 'ACTIVITY',
  },
  {
    id: '3',
    title: '夏季用电安全提示',
    content: '高温天气请注意用电安全，避免同时使用大功率电器。',
    createdAt: '2026-06-16 10:15',
    type: 'WARNING',
  },
];

export const mockStats = {
  pendingTickets: 2,
  todayAccess: 5,
  unreadNotice: 2,
  serviceOrders: 1,
};
