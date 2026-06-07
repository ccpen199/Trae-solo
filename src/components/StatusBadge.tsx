import React from 'react';

type StatusType = 'available' | 'locked' | 'sold' | 'offline';

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  available: {
    label: '可售',
    className: 'bg-success/10 text-success border-success/20',
  },
  locked: {
    label: '锁定',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  sold: {
    label: '已售',
    className: 'bg-danger/10 text-danger border-danger/20',
  },
  offline: {
    label: '下架',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.offline;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
