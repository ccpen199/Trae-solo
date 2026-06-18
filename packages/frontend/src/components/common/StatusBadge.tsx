import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusColorMap: Record<string, string> = {
  active: 'badge-green',
  online: 'badge-green',
  completed: 'badge-green',
  resolved: 'badge-green',
  success: 'badge-green',
  paid: 'badge-blue',
  shipping: 'badge-blue',
  in_progress: 'badge-blue',
  processing: 'badge-blue',
  pending: 'badge-orange',
  pending_payment: 'badge-orange',
  pending_pickup: 'badge-orange',
  submitted: 'badge-orange',
  assigned: 'badge-orange',
  draft: 'badge-gray',
  inactive: 'badge-gray',
  cancelled: 'badge-gray',
  closed: 'badge-gray',
  refunding: 'badge-orange',
  failed: 'badge-red',
  error: 'badge-red',
  rejected: 'badge-red',
  banned: 'badge-red',
  overdue: 'badge-red',
  denied: 'badge-red',
  critical: 'badge-red',
  high: 'badge-red',
  medium: 'badge-orange',
  low: 'badge-blue',
  suspended: 'badge-purple',
  reviewing: 'badge-purple',
  hidden: 'badge-purple',
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const badgeClass = statusColorMap[status] || 'badge-gray';
  return <span className={clsx(badgeClass)}>{label || status}</span>;
}
