import { cn } from '@/lib/utils'

const statusColorMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  arrived: 'bg-indigo-100 text-indigo-800',
  repairing: 'bg-purple-100 text-purple-800',
  inspecting: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-600',
  open: 'bg-blue-100 text-blue-800',
  investigating: 'bg-indigo-100 text-indigo-800',
  processing: 'bg-purple-100 text-purple-800',
  arbitrating: 'bg-orange-100 text-orange-800',
  closed: 'bg-green-100 text-green-800',
  in_stock: 'bg-green-100 text-green-800',
  low_stock: 'bg-red-100 text-red-800',
  bound: 'bg-blue-100 text-blue-800',
  available: 'bg-accent/10 text-accent',
  full: 'bg-gray-100 text-gray-600',
  selected: 'bg-primary text-white',
}

const statusLabelMap: Record<string, string> = {
  pending: '待接单',
  accepted: '已接单',
  arrived: '已到场',
  repairing: '维修中',
  inspecting: '待验收',
  completed: '已完工',
  cancelled: '已取消',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  suspended: '已暂停',
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
  open: '待受理',
  investigating: '调查中',
  processing: '处理中',
  arbitrating: '仲裁中',
  closed: '已关闭',
  in_stock: '库存充足',
  low_stock: '库存不足',
  bound: '已绑定',
  available: '可预约',
  full: '已满',
  selected: '已选择',
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusColorMap[status] || 'bg-gray-100 text-gray-800',
        className,
      )}
    >
      {label || statusLabelMap[status] || status}
    </span>
  )
}
