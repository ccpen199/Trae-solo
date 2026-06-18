import { cn } from '@/lib/utils';

type StatusType =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'cross_validating'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'pending'
  | 'processing'
  | 'upheld'
  | 'open'
  | 'assigned'
  | 'completed'
  | 'active';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; classes: string }> = {
  draft: { label: '草稿', classes: 'bg-slate-600/30 text-slate-400 border-slate-600' },
  submitted: { label: '已提交', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  reviewing: { label: '初审中', classes: 'bg-warning/10 text-warning border-warning/30' },
  cross_validating: { label: '交叉验证', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  approved: { label: '已通过', classes: 'bg-primary/10 text-primary border-primary/30' },
  rejected: { label: '已驳回', classes: 'bg-danger/10 text-danger border-danger/30' },
  published: { label: '已发布', classes: 'bg-primary/10 text-primary border-primary/30' },
  pending: { label: '待处理', classes: 'bg-warning/10 text-warning border-warning/30' },
  processing: { label: '处理中', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  upheld: { label: '支持申诉', classes: 'bg-primary/10 text-primary border-primary/30' },
  open: { label: '可接取', classes: 'bg-primary/10 text-primary border-primary/30' },
  assigned: { label: '已分配', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  completed: { label: '已完成', classes: 'bg-slate-600/30 text-slate-300 border-slate-600' },
  active: { label: '进行中', classes: 'bg-primary/10 text-primary border-primary/30' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, classes: 'bg-slate-600/30 text-slate-400 border-slate-600' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        config.classes,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse-soft"></span>
      {config.label}
    </span>
  );
}

export default StatusBadge;
