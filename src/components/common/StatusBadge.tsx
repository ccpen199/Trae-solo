import { Tag } from 'antd';
import { cn } from '@/lib/utils';

// 徽章类型映射配置
type BadgeType = 'audit' | 'property' | 'contract' | 'workorder';
type BadgeColor = 'success' | 'warning' | 'danger' | 'brand' | 'gold' | 'ink';

interface StatusBadgeProps {
  status: string;
  type?: BadgeType;
  className?: string;
}

// 审核状态颜色映射
const auditStatusMap: Record<string, { color: BadgeColor; label: string }> = {
  pending: { color: 'warning', label: '待审核' },
  approved: { color: 'success', label: '已通过' },
  rejected: { color: 'danger', label: '已驳回' },
  reviewing: { color: 'brand', label: '审核中' },
};

// 房源状态颜色映射
const propertyStatusMap: Record<string, { color: BadgeColor; label: string }> = {
  available: { color: 'success', label: '可租' },
  rented: { color: 'brand', label: '已租' },
  maintenance: { color: 'warning', label: '维修中' },
  offline: { color: 'ink', label: '已下架' },
  pending: { color: 'gold', label: '待上架' },
};

// 合同状态颜色映射
const contractStatusMap: Record<string, { color: BadgeColor; label: string }> = {
  active: { color: 'success', label: '履行中' },
  expired: { color: 'ink', label: '已到期' },
  terminated: { color: 'danger', label: '已解约' },
  pending: { color: 'warning', label: '待签署' },
  renewing: { color: 'brand', label: '续约中' },
};

// 工单状态颜色映射
const workorderStatusMap: Record<string, { color: BadgeColor; label: string }> = {
  open: { color: 'warning', label: '待处理' },
  processing: { color: 'brand', label: '处理中' },
  completed: { color: 'success', label: '已完成' },
  closed: { color: 'ink', label: '已关闭' },
  urgent: { color: 'danger', label: '紧急' },
};

// 颜色样式配置
const colorStyles: Record<BadgeColor, { bg: string; text: string; border: string; dot: string }> = {
  success: {
    bg: 'bg-success-50',
    text: 'text-success-600',
    border: 'border-success-200',
    dot: 'bg-success-500',
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    border: 'border-warning-200',
    dot: 'bg-warning-500',
  },
  danger: {
    bg: 'bg-danger-50',
    text: 'text-danger-600',
    border: 'border-danger-200',
    dot: 'bg-danger-500',
  },
  brand: {
    bg: 'bg-brand-50',
    text: 'text-brand-600',
    border: 'border-brand-200',
    dot: 'bg-brand-500',
  },
  gold: {
    bg: 'bg-gold-50',
    text: 'text-gold-600',
    border: 'border-gold-200',
    dot: 'bg-gold-500',
  },
  ink: {
    bg: 'bg-ink-100',
    text: 'text-ink-600',
    border: 'border-ink-200',
    dot: 'bg-ink-500',
  },
};

// 脉冲点动画组件
function PulseDot({ color }: { color: BadgeColor }) {
  const style = colorStyles[color];
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          style.dot
        )}
      />
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', style.dot)} />
    </span>
  );
}

export default function StatusBadge({ status, type, className }: StatusBadgeProps) {
  // 根据类型获取状态映射
  const getStatusConfig = () => {
    switch (type) {
      case 'audit':
        return auditStatusMap[status] || { color: 'ink' as BadgeColor, label: status };
      case 'property':
        return propertyStatusMap[status] || { color: 'ink' as BadgeColor, label: status };
      case 'contract':
        return contractStatusMap[status] || { color: 'ink' as BadgeColor, label: status };
      case 'workorder':
        return workorderStatusMap[status] || { color: 'ink' as BadgeColor, label: status };
      default:
        // 默认根据关键词推断颜色
        if (/success|pass|通过|完成|正常|可租|已租|履行/.test(status)) {
          return { color: 'success' as BadgeColor, label: status };
        }
        if (/warning|pending|wait|待|审核|处理/.test(status)) {
          return { color: 'warning' as BadgeColor, label: status };
        }
        if (/danger|error|fail|reject|紧急|失败|驳回|解约/.test(status)) {
          return { color: 'danger' as BadgeColor, label: status };
        }
        if (/brand|处理中|续约|进行|active/.test(status)) {
          return { color: 'brand' as BadgeColor, label: status };
        }
        if (/gold|vip|优质/.test(status)) {
          return { color: 'gold' as BadgeColor, label: status };
        }
        return { color: 'ink' as BadgeColor, label: status };
    }
  };

  const { color, label } = getStatusConfig();
  const style = colorStyles[color];

  return (
    <Tag
      className={cn(
        'inline-flex items-center border px-2.5 py-0.5 text-xs font-medium',
        style.bg,
        style.text,
        style.border,
        className
      )}
      style={{
        backgroundColor: 'transparent',
        backdropFilter: 'blur(4px)',
      }}
    >
      <PulseDot color={color} />
      <span className="ml-1.5">{label}</span>
    </Tag>
  );
}
