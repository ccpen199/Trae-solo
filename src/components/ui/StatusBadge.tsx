import { cn } from '@/lib/utils';
import type { TaskStatus, OrderStatus, MessageType, WithdrawStatus } from 'shared/types';

type StatusType = TaskStatus | OrderStatus | MessageType | WithdrawStatus;

type StatusBadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  status: StatusType | string;
  type?: 'task' | 'order' | 'message' | 'withdraw';
  size?: StatusBadgeSize;
  className?: string;
}

const withdrawStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已通过', className: 'bg-blue-100 text-blue-800' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
  transferred: { label: '已转账', className: 'bg-green-100 text-green-800' },
  failed: { label: '失败', className: 'bg-gray-100 text-gray-800' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-800' },
  assigned: { label: '已分配', className: 'bg-blue-100 text-blue-800' },
  picked: { label: '已揽收', className: 'bg-green-100 text-green-800' },
  in_transit: { label: '运输中', className: 'bg-purple-100 text-purple-800' },
  completed: { label: '已完成', className: 'bg-emerald-100 text-emerald-800' },
  exception: { label: '异常', className: 'bg-red-100 text-red-800' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800' },
  created: { label: '已创建', className: 'bg-gray-100 text-gray-800' },
  printed: { label: '已打印', className: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: '已发货', className: 'bg-cyan-100 text-cyan-800' },
  pickup_reminder: { label: '揽收提醒', className: 'bg-orange-100 text-orange-800' },
  balance_alert: { label: '余额提醒', className: 'bg-pink-100 text-pink-800' },
  suspension_notice: { label: '停运通知', className: 'bg-red-100 text-red-800' },
  system_announcement: { label: '系统公告', className: 'bg-blue-100 text-blue-800' },
  exception_alert: { label: '异常预警', className: 'bg-red-100 text-red-800' },
  approved: { label: '已通过', className: 'bg-blue-100 text-blue-800' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
  transferred: { label: '已转账', className: 'bg-green-100 text-green-800' },
  failed: { label: '失败', className: 'bg-gray-100 text-gray-800' },
};

const sizeClasses: Record<StatusBadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export const StatusBadge = ({
  status,
  type,
  size = 'md',
  className,
}: StatusBadgeProps) => {
  const config = type === 'withdraw'
    ? withdrawStatusConfig[status]
    : statusConfig[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-800',
      };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size],
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
