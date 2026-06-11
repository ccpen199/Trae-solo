import React from 'react';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  pending: 'bg-orange-100 text-orange-800',
};

const statusMap: Record<string, { variant: string; label: string }> = {
  pending: { variant: 'pending', label: '待处理' },
  processing: { variant: 'warning', label: '处理中' },
  completed: { variant: 'success', label: '已完成' },
  closed: { variant: 'info', label: '已关闭' },
  active: { variant: 'success', label: '有效' },
  expired: { variant: 'danger', label: '已过期' },
  used: { variant: 'info', label: '已使用' },
  online: { variant: 'success', label: '在线' },
  offline: { variant: 'danger', label: '离线' },
  maintenance: { variant: 'warning', label: '维护中' },
  approved: { variant: 'success', label: '已通过' },
  rejected: { variant: 'danger', label: '已拒绝' },
  low: { variant: 'info', label: '低' },
  medium: { variant: 'warning', label: '中' },
  high: { variant: 'danger', label: '高' },
  critical: { variant: 'danger', label: '紧急' },
  resolved: { variant: 'success', label: '已解决' },
  ignored: { variant: 'default', label: '已忽略' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant, className }) => {
  const config = statusMap[status] || { variant: 'default', label: status };
  const finalVariant = variant || config.variant;

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[finalVariant],
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
