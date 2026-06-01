const statusLabelMap: Record<string, string> = {
  none: '未退款',
  partial: '部分退款',
  full: '全额退款',
  charging: '充电中',
  completed: '已完成',
  pending: '待处理',
  assigned: '已指派',
  resolved: '已解决',
  refunded: '已退款',
  stopped: '已停止',
  offline: '离线',
  online: '在线',
  idle: '空闲',
  fault: '故障',
  active: '正常',
  inactive: '停用',
}

const statusColorMap: Record<string, string> = {
  online: 'status-badge-green',
  active: 'status-badge-green',
  charging: 'status-badge-green',
  completed: 'status-badge-green',
  idle: 'status-badge-amber',
  pending: 'status-badge-amber',
  assigned: 'status-badge-amber',
  offline: 'status-badge-red',
  fault: 'status-badge-red',
  resolved: 'status-badge-blue',
  refunded: 'status-badge-blue',
  stopped: 'status-badge-blue',
  partial: 'status-badge-amber',
  full: 'status-badge-blue',
  none: 'status-badge-gray',
  inactive: 'status-badge-gray',
}

const priorityColorMap: Record<string, string> = {
  low: 'status-badge-green',
  medium: 'status-badge-amber',
  high: 'status-badge-red',
}

const priorityLabelMap: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

interface StatusBadgeProps {
  status: string
  type?: 'status' | 'priority'
  label?: string
}

export default function StatusBadge({ status, type = 'status' }: StatusBadgeProps) {
  const colorClass =
    type === 'priority'
      ? priorityColorMap[status] || 'status-badge-gray'
      : statusColorMap[status] || 'status-badge-gray'
  const displayLabel =
    type === 'priority'
      ? priorityLabelMap[status] || status
      : statusLabelMap[status] || status

  return <span className={`status-badge ${colorClass}`}>{displayLabel}</span>
}
