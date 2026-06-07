interface StatusBadgeProps {
  status: string
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待接单', className: 'status-pending' },
  accepted: { label: '已接单', className: 'status-accepted' },
  picking_up: { label: '取件中', className: 'status-picking_up' },
  delivering: { label: '配送中', className: 'status-delivering' },
  completed: { label: '已完成', className: 'status-completed' },
  appealing: { label: '申诉中', className: 'status-appealing' },
  cancelled: { label: '已取消', className: 'status-cancelled' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: 'status-cancelled' }
  return <span className={`status-badge ${config.className}`}>{config.label}</span>
}
