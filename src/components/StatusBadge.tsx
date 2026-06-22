import React from 'react'
import type { TaskStatus } from '../types'

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: '待发布', className: 'bg-gray-100 text-gray-600' },
  broadcasting: { label: '广播派单中', className: 'bg-blue-100 text-blue-600' },
  accepted: { label: '已接单', className: 'bg-purple-100 text-purple-600' },
  arrived: { label: '师傅已上门', className: 'bg-indigo-100 text-indigo-600' },
  in_progress: { label: '维修中', className: 'bg-orange-100 text-orange-600' },
  completed: { label: '已完工', className: 'bg-teal-100 text-teal-600' },
  paid: { label: '已支付', className: 'bg-green-100 text-green-600' },
  reviewed: { label: '已评价', className: 'bg-emerald-100 text-emerald-600' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-600' },
}

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const config = statusConfig[status]
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
