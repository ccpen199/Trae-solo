import { cn } from '../lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'processing';

interface StatusBadgeProps {
  status: StatusType;
  text: string;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-primary/10 text-primary',
};

const statusDot: Record<StatusType, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  pending: 'bg-gray-400',
  processing: 'bg-primary',
};

export default function StatusBadge({ status, text, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      statusStyles[status],
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', statusDot[status])} />
      {text}
    </span>
  );
}
