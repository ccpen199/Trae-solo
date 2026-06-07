import { cn } from '@/lib/utils';

type StatusType = 'active' | 'pending' | 'resolved' | 'rejected' | 'processing' | 'expired' | 'approved' | 'draft' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  inactive: 'bg-stone-100 text-stone-600 border-stone-200',
};

export default function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status] || statusStyles.pending,
        className
      )}
    >
      {children}
    </span>
  );
}
