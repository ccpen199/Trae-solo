import { cn } from '../lib/utils';

type OrderStatus = 'published' | 'matched' | 'confirmed' | 'deposit_paid' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'arbitrated';
type CourseStatus = 'draft' | 'reviewing' | 'published' | 'rejected';
type ReviewStatus = 'pending' | 'approved' | 'rejected';
type TransactionStatus = 'success' | 'failed';

interface StatusBadgeProps {
  status: OrderStatus | CourseStatus | ReviewStatus | TransactionStatus;
  type?: 'order' | 'course' | 'review';
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  published: { label: '已发布', className: 'status-published' },
  matched: { label: '已匹配', className: 'status-matched' },
  confirmed: { label: '已确认', className: 'status-confirmed' },
  deposit_paid: { label: '已付定金', className: 'status-deposit_paid' },
  in_progress: { label: '进行中', className: 'status-in_progress' },
  completed: { label: '已完成', className: 'status-completed' },
  cancelled: { label: '已取消', className: 'status-cancelled' },
  disputed: { label: '有争议', className: 'status-disputed' },
  arbitrated: { label: '已仲裁', className: 'status-disputed' },
  draft: { label: '草稿', className: 'status-draft' },
  reviewing: { label: '审核中', className: 'status-reviewing' },
  rejected: { label: '已拒绝', className: 'status-rejected' },
  pending: { label: '待审核', className: 'status-pending' },
  approved: { label: '已通过', className: 'status-approved' },
  success: { label: '成功', className: 'status-approved' },
  failed: { label: '失败', className: 'status-rejected' },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: 'status-default' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'completed' || status === 'approved' || status === 'success' ? 'bg-green-500' :
        status === 'cancelled' || status === 'rejected' || status === 'disputed' || status === 'failed' ? 'bg-red-500' :
        status === 'in_progress' || status === 'pending' || status === 'reviewing' ? 'bg-amber-500' :
        'bg-blue-500'
      )} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
