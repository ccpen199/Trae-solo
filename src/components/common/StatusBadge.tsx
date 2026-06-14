import type { OrderStatus } from '@/types';

export const statusTextMap: Record<OrderStatus, { text: string; color: string; bg: string; dot: string }> = {
  PUBLISHED: { text: '已发布', color: 'text-signal-blue', bg: 'bg-signal-blue/10', dot: 'bg-signal-blue' },
  MATCHING: { text: '匹配中', color: 'text-signal-yellow', bg: 'bg-signal-yellow/10', dot: 'bg-signal-yellow' },
  MATCHED: { text: '已匹配', color: 'text-signal-cyan', bg: 'bg-signal-cyan/10', dot: 'bg-signal-cyan' },
  ACCEPTED: { text: '已接单', color: 'text-signal-blue', bg: 'bg-signal-blue/10', dot: 'bg-signal-blue' },
  PICKING_UP: { text: '取货中', color: 'text-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  IN_TRANSIT: { text: '运输中', color: 'text-signal-blue', bg: 'bg-signal-blue/10', dot: 'bg-signal-blue' },
  PARTIAL_DELIVERED: { text: '部分送达', color: 'text-signal-yellow', bg: 'bg-signal-yellow/10', dot: 'bg-signal-yellow' },
  DELIVERED: { text: '已送达', color: 'text-signal-cyan', bg: 'bg-signal-cyan/10', dot: 'bg-signal-cyan' },
  FULFILLMENT_CHECKING: { text: '履约核验中', color: 'text-signal-yellow', bg: 'bg-signal-yellow/10', dot: 'bg-signal-yellow' },
  COMPLETED: { text: '已完成', color: 'text-signal-green', bg: 'bg-signal-green/10', dot: 'bg-signal-green' },
  EXCEPTION: { text: '异常', color: 'text-signal-red', bg: 'bg-signal-red/10', dot: 'bg-signal-red' },
  CANCELLED: { text: '已取消', color: 'text-slate-500', bg: 'bg-slate-500/10', dot: 'bg-slate-500' },
};

interface StatusBadgeProps {
  status: OrderStatus;
  pulse?: boolean;
}

export function StatusBadge({ status, pulse = true }: StatusBadgeProps) {
  const cfg = statusTextMap[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm ${cfg.bg} ${cfg.color} text-xs font-medium`}>
      <span className={`status-dot ${cfg.dot} ${pulse ? 'animate-pulse-slow' : ''}`} />
      <span>{cfg.text}</span>
    </span>
  );
}

export default StatusBadge;
