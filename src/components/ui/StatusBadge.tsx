import React from 'react';
import { Circle } from 'lucide-react';
import type { StatusVariant, OrderStatus, RiderStatus, CompensationStatus, WaybillStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status?: OrderStatus | RiderStatus | CompensationStatus | WaybillStatus | string;
  variant?: StatusVariant;
  showDot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
  label?: React.ReactNode;
}

const statusConfig: Record<string, { label: string; variant: StatusVariant }> = {
  pending: { label: '待处理', variant: 'warning' },
  accepted: { label: '已接受', variant: 'info' },
  assigned: { label: '已分配', variant: 'info' },
  picked_up: { label: '已取件', variant: 'info' },
  picked: { label: '已取件', variant: 'info' },
  in_transit: { label: '运输中', variant: 'info' },
  delivering: { label: '配送中', variant: 'info' },
  delivered: { label: '已送达', variant: 'success' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
  exception: { label: '异常', variant: 'danger' },
  online: { label: '在线', variant: 'success' },
  offline: { label: '离线', variant: 'default' },
  busy: { label: '忙碌', variant: 'warning' },
  approved: { label: '已批准', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'danger' },
  issued: { label: '已发放', variant: 'success' },
  generated: { label: '已生成', variant: 'info' },
  printed: { label: '已打印', variant: 'success' },
  voided: { label: '已作废', variant: 'danger' },
};

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success-500/15 text-success-400 border-success-500/30',
  warning: 'bg-warning-500/15 text-warning-400 border-warning-500/30',
  danger: 'bg-danger-500/15 text-danger-400 border-danger-500/30',
  info: 'bg-info-500/15 text-info-400 border-info-500/30',
  default: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  exception: 'bg-danger-500/15 text-danger-400 border-danger-500/30',
  delay: 'bg-warning-500/15 text-warning-400 border-warning-500/30',
  urgent: 'bg-danger-500/15 text-danger-400 border-danger-500/30',
};

const dotColors: Record<StatusVariant, string> = {
  success: 'text-success-400',
  warning: 'text-warning-400',
  danger: 'text-danger-400',
  info: 'text-info-400',
  default: 'text-gray-400',
  exception: 'text-danger-400',
  delay: 'text-warning-400',
  urgent: 'text-danger-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant: customVariant,
  showDot = true,
  pulse = false,
  size = 'md',
  className,
  children,
  label,
}) => {
  const config = status ? (statusConfig[status] || { label: status, variant: 'default' as StatusVariant }) : { label: '', variant: 'default' as StatusVariant };
  const variant = customVariant || config.variant;
  const displayLabel = children || label || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {showDot && (
        <span className={cn('relative flex items-center justify-center')}>
          <Circle
            className={cn(
              'w-2 h-2 fill-current',
              dotColors[variant],
              pulse && 'animate-status-pulse'
            )}
          />
        </span>
      )}
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
