import { getStatusLabel, getStatusColor } from '@/utils';

interface StatusBadgeProps {
  status: string;
  type: string;
  className?: string;
}

export default function StatusBadge({ status, type, className = '' }: StatusBadgeProps) {
  const label = getStatusLabel(status, type);
  const color = getStatusColor(status, type);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}
    >
      {label}
    </span>
  );
}
