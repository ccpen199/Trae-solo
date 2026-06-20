import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Hourglass,
  CircleDollarSign,
  CalendarCheck,
  Ban,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'overdue' | 'assigned';
export type OrderStatus = 'unpaid' | 'paid' | 'refunded' | 'cancelled';
export type ActivityStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'partial';

export type StatusType = WorkOrderStatus | OrderStatus | ActivityStatus | PaymentStatus;

export type StatusCategory = 'workorder' | 'order' | 'activity' | 'payment';

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const workOrderConfig: Record<WorkOrderStatus, StatusConfig> = {
  pending: {
    label: '待处理',
    icon: Clock,
    bg: 'bg-warning-500/10',
    text: 'text-warning-400',
    border: 'border-warning-500/20',
    dot: 'bg-warning-500',
  },
  assigned: {
    label: '已派单',
    icon: Hourglass,
    bg: 'bg-primary-500/10',
    text: 'text-primary-400',
    border: 'border-primary-500/20',
    dot: 'bg-primary-500',
  },
  processing: {
    label: '处理中',
    icon: Loader2,
    bg: 'bg-primary-500/10',
    text: 'text-primary-400',
    border: 'border-primary-500/20',
    dot: 'bg-primary-500',
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    bg: 'bg-success-500/10',
    text: 'text-success-400',
    border: 'border-success-500/20',
    dot: 'bg-success-500',
  },
  cancelled: {
    label: '已取消',
    icon: XCircle,
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-400',
    border: 'border-neutral-500/20',
    dot: 'bg-neutral-500',
  },
  overdue: {
    label: '已超时',
    icon: AlertTriangle,
    bg: 'bg-danger-500/10',
    text: 'text-danger-400',
    border: 'border-danger-500/20',
    dot: 'bg-danger-500',
  },
};

const orderConfig: Record<OrderStatus, StatusConfig> = {
  unpaid: {
    label: '待支付',
    icon: Clock,
    bg: 'bg-warning-500/10',
    text: 'text-warning-400',
    border: 'border-warning-500/20',
    dot: 'bg-warning-500',
  },
  paid: {
    label: '已支付',
    icon: CheckCircle2,
    bg: 'bg-success-500/10',
    text: 'text-success-400',
    border: 'border-success-500/20',
    dot: 'bg-success-500',
  },
  refunded: {
    label: '已退款',
    icon: RotateCcw,
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-400',
    border: 'border-neutral-500/20',
    dot: 'bg-neutral-500',
  },
  cancelled: {
    label: '已取消',
    icon: XCircle,
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-400',
    border: 'border-neutral-500/20',
    dot: 'bg-neutral-500',
  },
};

const activityConfig: Record<ActivityStatus, StatusConfig> = {
  upcoming: {
    label: '即将开始',
    icon: CalendarCheck,
    bg: 'bg-primary-500/10',
    text: 'text-primary-400',
    border: 'border-primary-500/20',
    dot: 'bg-primary-500',
  },
  ongoing: {
    label: '进行中',
    icon: Loader2,
    bg: 'bg-success-500/10',
    text: 'text-success-400',
    border: 'border-success-500/20',
    dot: 'bg-success-500',
  },
  ended: {
    label: '已结束',
    icon: CheckCircle2,
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-400',
    border: 'border-neutral-500/20',
    dot: 'bg-neutral-500',
  },
  cancelled: {
    label: '已取消',
    icon: Ban,
    bg: 'bg-danger-500/10',
    text: 'text-danger-400',
    border: 'border-danger-500/20',
    dot: 'bg-danger-500',
  },
};

const paymentConfig: Record<PaymentStatus, StatusConfig> = {
  unpaid: {
    label: '待缴费',
    icon: CircleDollarSign,
    bg: 'bg-warning-500/10',
    text: 'text-warning-400',
    border: 'border-warning-500/20',
    dot: 'bg-warning-500',
  },
  paid: {
    label: '已缴费',
    icon: CheckCircle2,
    bg: 'bg-success-500/10',
    text: 'text-success-400',
    border: 'border-success-500/20',
    dot: 'bg-success-500',
  },
  overdue: {
    label: '已逾期',
    icon: AlertTriangle,
    bg: 'bg-danger-500/10',
    text: 'text-danger-400',
    border: 'border-danger-500/20',
    dot: 'bg-danger-500',
  },
  partial: {
    label: '部分缴费',
    icon: CircleDollarSign,
    bg: 'bg-primary-500/10',
    text: 'text-primary-400',
    border: 'border-primary-500/20',
    dot: 'bg-primary-500',
  },
};

const configMap: Record<StatusCategory, Record<string, StatusConfig>> = {
  workorder: workOrderConfig,
  order: orderConfig,
  activity: activityConfig,
  payment: paymentConfig,
};

interface StatusBadgeProps {
  status: StatusType;
  category?: StatusCategory;
  showIcon?: boolean;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  category = 'workorder',
  showIcon = true,
  showDot = false,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = configMap[category][status];
  const Icon = config.icon;

  if (!config) {
    return <span className={className}>{status}</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />}
      {showIcon && <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />}
      <span className="font-medium">{config.label}</span>
    </span>
  );
}
