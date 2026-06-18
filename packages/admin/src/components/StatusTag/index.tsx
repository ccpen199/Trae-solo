import { Tag } from 'antd'
import type { ReactNode } from 'react'

type StatusType = 'success' | 'error' | 'warning' | 'processing' | 'default' | string

interface StatusTagProps {
  status: StatusType
  text: string
  icon?: ReactNode
}

const statusColorMap: Record<string, string> = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  processing: 'blue',
  default: 'default',
  online: 'green',
  offline: 'default',
  idle: 'green',
  charging: 'blue',
  fault: 'red',
  maintenance: 'orange',
  pending: 'orange',
  completed: 'green',
  cancelled: 'default',
  approved: 'green',
  rejected: 'red',
  active: 'green',
  inactive: 'default',
  settled: 'green',
  failed: 'red'
}

function StatusTag({ status, text, icon }: StatusTagProps) {
  const color = statusColorMap[status] || 'default'
  return (
    <Tag color={color} icon={icon}>
      {text}
    </Tag>
  )
}

export default StatusTag
