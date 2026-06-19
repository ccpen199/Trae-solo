import type { TicketItem } from '@/types';

export const mockTickets: TicketItem[] = [
  {
    id: 't1',
    type: 'REPAIR',
    title: '客厅灯不亮了',
    content: '客厅的主灯开关按了没反应，可能是灯泡坏了或者线路问题，请安排电工师傅来看看。',
    status: 'PROCESSING',
    priority: 'MEDIUM',
    createdAt: '2026-06-19 09:15:00',
    handlerName: '李客服',
  },
  {
    id: 't2',
    type: 'COMPLAINT',
    title: '楼下广场舞噪音太大',
    content: '每天晚上7点到9点，楼下广场跳广场舞的音乐声音太大，严重影响休息。',
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: '2026-06-18 20:30:00',
  },
  {
    id: 't3',
    type: 'SUGGESTION',
    title: '建议增加儿童游乐设施',
    content: '小区内儿童游乐设施较少，建议增加一些滑梯、秋千等设施。',
    status: 'COMPLETED',
    priority: 'LOW',
    createdAt: '2026-06-10 14:20:00',
    completedAt: '2026-06-15 16:00:00',
    handlerName: '王经理',
  },
  {
    id: 't4',
    type: 'REPAIR',
    title: '楼道感应灯故障',
    content: '3楼楼道的感应灯不亮了，晚上回家很不方便。',
    status: 'CLOSED',
    priority: 'MEDIUM',
    createdAt: '2026-06-05 19:00:00',
    completedAt: '2026-06-06 10:30:00',
    handlerName: '李客服',
  },
];

export const ticketTypeMap: Record<string, { label: string; color: string; bg: string }> = {
  REPAIR: { label: '报修', color: '#3B82F6', bg: '#DBEAFE' },
  COMPLAINT: { label: '投诉', color: '#EF4444', bg: '#FEE2E2' },
  SUGGESTION: { label: '建议', color: '#10B981', bg: '#D1FAE5' },
};

export const ticketStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: '待处理', color: '#F59E0B', bg: '#FEF3C7' },
  ASSIGNED: { label: '已分配', color: '#3B82F6', bg: '#DBEAFE' },
  PROCESSING: { label: '处理中', color: '#8B5CF6', bg: '#EDE9FE' },
  COMPLETED: { label: '已完成', color: '#10B981', bg: '#D1FAE5' },
  CLOSED: { label: '已关闭', color: '#64748B', bg: '#F1F5F9' },
  CANCELLED: { label: '已取消', color: '#94A3B8', bg: '#F1F5F9' },
};

export const ticketPriorityMap: Record<string, { label: string; color: string }> = {
  LOW: { label: '低', color: '#64748B' },
  MEDIUM: { label: '中', color: '#3B82F6' },
  HIGH: { label: '高', color: '#F59E0B' },
  URGENT: { label: '紧急', color: '#EF4444' },
};
