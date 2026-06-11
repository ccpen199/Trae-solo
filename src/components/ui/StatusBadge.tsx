import React from 'react';

type StatusType = 'published' | 'draft' | 'pending_audit' | 'approved' | 'rejected' | 'offline' | 'active' | 'inactive' | 'pending' | 'approved_cert' | 'rejected_cert' | 'expired' | 'completed';

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; label: string }> = {
  published: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: '已发布' },
  draft: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: '草稿' },
  pending_audit: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: '待审核' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: '审核通过' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: '已驳回' },
  offline: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: '已下架' },
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: '活跃' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: '未激活' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: '待处理' },
  approved_cert: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: '认证通过' },
  rejected_cert: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: '认证驳回' },
  expired: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', label: '已过期' },
  completed: { bg: 'bg-porcelain-50', text: 'text-porcelain-700', dot: 'bg-porcelain-500', label: '已完成' },
};

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot = true, className = '' }) => {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>}
      {config.label}
    </span>
  );
};

export default StatusBadge;
