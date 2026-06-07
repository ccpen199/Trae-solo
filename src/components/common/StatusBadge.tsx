import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'pending';

export interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, StatusType | { variant: StatusType; label: string }>;
  className?: string;
}

const variantStyles: Record<StatusType, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-secondary-100 text-secondary-800 border-secondary-200',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, statusMap, className }) => {
  const mapping = statusMap?.[status];
  let variant: StatusType = 'info';
  let label: string = status;

  if (mapping) {
    if (typeof mapping === 'string') {
      variant = mapping;
    } else {
      variant = mapping.variant;
      label = mapping.label;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
