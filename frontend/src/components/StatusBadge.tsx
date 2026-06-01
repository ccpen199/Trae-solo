import clsx from 'clsx';
import type {
  Status,
  TaskStatus,
  AlertStatus,
  ChangeStatus,
  Severity,
  VulnStatus,
  SecretStatus,
  AlertType,
  ChangeType,
  EnvType,
} from '../types';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  disabled: 'bg-gray-100 text-gray-600 border-gray-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
  pending: 'bg-orange-100 text-orange-700 border-orange-200',
  running: 'bg-blue-100 text-blue-700 border-blue-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  open: 'bg-red-100 text-red-700 border-red-200',
  processing: 'bg-orange-100 text-orange-700 border-orange-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  executed: 'bg-blue-100 text-blue-700 border-blue-200',
  rolled_back: 'bg-gray-100 text-gray-600 border-gray-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  fixed: 'bg-green-100 text-green-700 border-green-200',
  ignored: 'bg-gray-100 text-gray-600 border-gray-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  active: '启用',
  disabled: '停用',
  archived: '归档',
  pending: '待处理',
  running: '执行中',
  success: '成功',
  failed: '失败',
  open: '待处理',
  processing: '处理中',
  closed: '已关闭',
  approved: '已批准',
  rejected: '已拒绝',
  executed: '已执行',
  rolled_back: '已回滚',
  critical: '严重',
  high: '高危',
  medium: '中危',
  low: '低危',
  fixed: '已修复',
  ignored: '已忽略',
  expired: '已过期',
  duplicate_execution: '重复执行',
  permission_violation: '权限越权',
  config_misuse: '配置误发',
  task_failure: '任务失败',
  data_leak: '信息泄露',
  config: '配置变更',
  permission: '权限变更',
  secret: '密钥变更',
  application: '应用变更',
  dev: '开发',
  test: '测试',
  staging: '预发布',
  prod: '生产',
};

interface StatusBadgeProps {
  status:
    | Status
    | TaskStatus
    | AlertStatus
    | ChangeStatus
    | Severity
    | VulnStatus
    | SecretStatus
    | AlertType
    | ChangeType
    | EnvType
    | string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const color = statusColors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  const label = statusLabels[status] || status;

  return (
    <span
      className={clsx(
        'inline-flex items-center border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        color
      )}
    >
      {label}
    </span>
  );
}
