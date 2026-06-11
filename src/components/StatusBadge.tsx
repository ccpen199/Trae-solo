import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  draft: 'bg-gray-50 text-gray-600 border-gray-200',
  paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  expired: 'bg-red-50 text-red-600 border-red-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  disburse: 'bg-green-50 text-green-700 border-green-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  reversed: 'bg-orange-50 text-orange-700 border-orange-200',
  unused: 'bg-blue-50 text-blue-700 border-blue-200',
  used: 'bg-green-50 text-green-700 border-green-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
  pending_audit: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  disbursed: 'bg-green-50 text-green-700 border-green-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-600 border-red-200',
}

const statusLabels: Record<string, string> = {
  active: '进行中',
  draft: '草稿',
  paused: '已暂停',
  expired: '已过期',
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  approved: '已通过',
  rejected: '已驳回',
  success: '成功',
  failed: '失败',
  reversed: '已冲正',
  unused: '待使用',
  used: '已使用',
  suspended: '已冻结',
  pending_audit: '待审核',
  completed: '已完成',
  disbursed: '已拨付',
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
  device_multi_account: '设备多账户',
  hoarding: '黄牛囤券',
  abnormal_path: '异常路径',
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = statusColors[status] || 'bg-gray-50 text-gray-600 border-gray-200'
  const label = statusLabels[status] || status

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        color,
        className
      )}
    >
      {label}
    </span>
  )
}
