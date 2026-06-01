import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'
  className?: string
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  secondary: 'bg-purple-100 text-purple-800',
}

const statusMap: Record<string, { variant: string; label: string }> = {
  active: { variant: 'success', label: '启用' },
  inactive: { variant: 'default', label: '停用' },
  maintenance: { variant: 'warning', label: '维护中' },
  running: { variant: 'success', label: '运行中' },
  stopped: { variant: 'default', label: '已停止' },
  fault: { variant: 'danger', label: '故障' },
  open: { variant: 'success', label: '开启' },
  closed: { variant: 'default', label: '关闭' },
  partial: { variant: 'info', label: '部分开启' },
  online: { variant: 'success', label: '在线' },
  offline: { variant: 'danger', label: '离线' },
  pending: { variant: 'warning', label: '待审核' },
  approved: { variant: 'success', label: '已通过' },
  rejected: { variant: 'danger', label: '已驳回' },
  scheduled: { variant: 'info', label: '已排期' },
  executing: { variant: 'success', label: '执行中' },
  completed: { variant: 'success', label: '已完成' },
  cancelled: { variant: 'default', label: '已取消' },
  skipped: { variant: 'secondary', label: '已跳过' },
  interrupted: { variant: 'warning', label: '已中断' },
  draft: { variant: 'default', label: '草稿' },
  published: { variant: 'info', label: '已发布' },
  alarm_active: { variant: 'danger', label: '未处理' },
  acknowledged: { variant: 'warning', label: '已确认' },
  resolved: { variant: 'success', label: '已解决' },
  assigned: { variant: 'info', label: '已分配' },
  in_progress: { variant: 'warning', label: '处理中' },
  critical: { variant: 'danger', label: '紧急' },
  high: { variant: 'warning', label: '高' },
  medium: { variant: 'info', label: '中' },
  low: { variant: 'default', label: '低' },
  repair: { variant: 'danger', label: '维修' },
  inspection: { variant: 'info', label: '巡检' },
  emergency: { variant: 'danger', label: '应急' },
  daily: { variant: 'info', label: '日报' },
  monthly: { variant: 'secondary', label: '月报' },
  yearly: { variant: 'success', label: '年报' },
  custom: { variant: 'default', label: '自定义' },
  individual: { variant: 'info', label: '个人' },
  collective: { variant: 'secondary', label: '集体' },
  enterprise: { variant: 'success', label: '企业' },
}

const StatusBadge = ({ status, variant, className }: StatusBadgeProps) => {
  const mapped = statusMap[status] || { variant: 'default', label: status }
  const finalVariant = variant || mapped.variant
  const styles = variantStyles[finalVariant] || variantStyles.default

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        styles,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60" />
      {mapped.label}
    </span>
  )
}

export default StatusBadge
