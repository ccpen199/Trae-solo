import type { CouponStatus, VerificationStatus, RiskLevel, RiskStatus, AlertLevel, SettlementStatus } from '@shared/types';

interface StatusBadgeProps {
  status: string;
  type?: 'coupon' | 'verification' | 'risk' | 'riskStatus' | 'alert' | 'settlement' | 'merchant';
}

const statusConfig: Record<string, Record<string, { label: string; className: string }>> = {
  coupon: {
    draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
    active: { label: '进行中', className: 'bg-success-50 text-success-600' },
    paused: { label: '已暂停', className: 'bg-warning-50 text-warning-600' },
    expired: { label: '已过期', className: 'bg-gray-100 text-gray-500' },
  },
  verification: {
    success: { label: '成功', className: 'bg-success-50 text-success-600' },
    failed: { label: '失败', className: 'bg-danger-50 text-danger-600' },
    reversed: { label: '已撤销', className: 'bg-gray-100 text-gray-500' },
  },
  risk: {
    low: { label: '低风险', className: 'bg-primary-50 text-primary-600' },
    medium: { label: '中风险', className: 'bg-warning-50 text-warning-600' },
    high: { label: '高风险', className: 'bg-danger-50 text-danger-600' },
  },
  riskStatus: {
    pending: { label: '待处理', className: 'bg-warning-50 text-warning-600' },
    reviewing: { label: '处理中', className: 'bg-primary-50 text-primary-600' },
    resolved: { label: '已解决', className: 'bg-success-50 text-success-600' },
    ignored: { label: '已忽略', className: 'bg-gray-100 text-gray-500' },
  },
  alert: {
    info: { label: '信息', className: 'bg-primary-50 text-primary-600' },
    warning: { label: '警告', className: 'bg-warning-50 text-warning-600' },
    critical: { label: '严重', className: 'bg-danger-50 text-danger-600' },
  },
  settlement: {
    pending: { label: '待审核', className: 'bg-warning-50 text-warning-600' },
    approved: { label: '已通过', className: 'bg-primary-50 text-primary-600' },
    rejected: { label: '已拒绝', className: 'bg-danger-50 text-danger-600' },
    transferred: { label: '已转账', className: 'bg-success-50 text-success-600' },
  },
  merchant: {
    active: { label: '正常', className: 'bg-success-50 text-success-600' },
    inactive: { label: '停用', className: 'bg-gray-100 text-gray-500' },
    pending: { label: '待审核', className: 'bg-warning-50 text-warning-600' },
  },
};

export function StatusBadge({ status, type = 'coupon' }: StatusBadgeProps) {
  const config = statusConfig[type]?.[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
