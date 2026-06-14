import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_MAP,
  RISK_LEVEL_MAP,
  VERIFY_STATUS_MAP,
  TICKET_STATUS_MAP,
  POLICY_STATUS_MAP,
} from '@/utils/constants';
import type {
  OrderStatus,
  RiskLevel,
  VerifyStatus,
  TicketStatus,
  PolicyStatus,
} from '@/types';

export type StatusBadgeType =
  | 'order'
  | 'risk'
  | 'verify'
  | 'ticket'
  | 'policy';

interface StatusBadgeProps {
  type: StatusBadgeType;
  status: OrderStatus | RiskLevel | VerifyStatus | TicketStatus | PolicyStatus;
  className?: string;
  showDot?: boolean;
}

const statusMapByType: Record<
  StatusBadgeType,
  Record<string, { label: string; bgColor: string; color: string }>
> = {
  order: ORDER_STATUS_MAP,
  risk: RISK_LEVEL_MAP,
  verify: VERIFY_STATUS_MAP,
  ticket: TICKET_STATUS_MAP,
  policy: POLICY_STATUS_MAP,
};

export default function StatusBadge({
  type,
  status,
  className,
  showDot = true,
}: StatusBadgeProps) {
  const map = statusMapByType[type];
  const config = map[status as string];

  if (!config) return null;

  const dotColorClass: Record<string, string> = {
    'bg-emerald-50': 'bg-emerald-500',
    'bg-emerald-5': 'bg-emerald-500',
    'bg-green-5': 'bg-green-500',
    'bg-amber-50': 'bg-amber-500',
    'bg-orange-50': 'bg-orange-500',
    'bg-red-50': 'bg-red-500',
    'bg-blue-50': 'bg-blue-500',
    'bg-sky-50': 'bg-sky-500',
    'bg-indigo-50': 'bg-indigo-500',
    'bg-violet-50': 'bg-violet-500',
    'bg-pink-50': 'bg-pink-500',
    'bg-slate-100': 'bg-slate-500',
    'bg-slate-50': 'bg-slate-400',
  };

  const bgBase = config.bgColor.split(' ')[0];
  const dotColor = dotColorClass[bgBase] || 'bg-slate-400';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />}
      {config.label}
    </span>
  );
}
