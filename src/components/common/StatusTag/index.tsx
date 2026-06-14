import React from 'react';
import { Tag } from 'antd';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'processing' | 'default';

export interface StatusTagProps {
  status: StatusType;
  text: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const statusConfig: Record<StatusType, { color: string; className: string }> = {
  success: {
    color: 'success',
    className: 'bg-success-50 text-success-600 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800',
  },
  warning: {
    color: 'warning',
    className: 'bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800',
  },
  danger: {
    color: 'error',
    className: 'bg-danger-50 text-danger-600 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800',
  },
  info: {
    color: 'processing',
    className: 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800',
  },
  pending: {
    color: 'default',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600',
  },
  processing: {
    color: 'processing',
    className: 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800',
  },
  default: {
    color: 'default',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600',
  },
};

const StatusTag: React.FC<StatusTagProps> = ({ status, text, className, icon }) => {
  const config = statusConfig[status];

  return (
    <Tag
      icon={icon}
      color={config.color}
      className={cn('border rounded px-2 py-0.5', config.className, className)}
    >
      {text}
    </Tag>
  );
};

export default StatusTag;
