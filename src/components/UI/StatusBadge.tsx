import { cn } from '@/lib/utils';

type StatusType =
  | 'online'
  | 'offline'
  | 'maintenance'
  | 'empty'
  | 'occupied'
  | 'locked'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; label: string }> = {
  online: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '在线' },
  offline: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', label: '离线' },
  maintenance: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: '维护中' },
  empty: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', label: '空闲' },
  occupied: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500', label: '占用' },
  locked: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: '锁定' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: '待处理' },
  processing: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500', label: '处理中' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '已完成' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', label: '已取消' },
  success: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '成功' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: '警告' },
  error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: '错误' },
  info: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500', label: '信息' },
};

export default function StatusBadge({ status, text, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.info;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', config.dot)}></span>
      {text || config.label}
    </span>
  );
}
