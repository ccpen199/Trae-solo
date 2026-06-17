import { PackageSearch, ClipboardList, Bell, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyType = 'default' | 'orders' | 'notifications' | 'tasks'

interface EmptyProps {
  type?: EmptyType
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

const iconMap = {
  default: Inbox,
  orders: ClipboardList,
  notifications: Bell,
  tasks: PackageSearch,
}

const titleMap = {
  default: '暂无数据',
  orders: '暂无订单',
  notifications: '暂无消息',
  tasks: '暂无任务',
}

const descriptionMap = {
  default: '这里还没有任何内容',
  orders: '您还没有创建任何订单',
  notifications: '您还没有收到任何消息',
  tasks: '当前没有待处理的任务',
}

export default function Empty({
  type = 'default',
  title,
  description,
  icon,
  action,
}: EmptyProps) {
  const Icon = iconMap[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-5">
        {icon || <Icon className="w-10 h-10 text-gray-300" />}
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-1.5">
        {title || titleMap[type]}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
        {description || descriptionMap[type]}
      </p>
      {action}
    </div>
  )
}
