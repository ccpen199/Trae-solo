interface StatusBadgeProps {
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'danger' | 'warning' | 'info'
  label: string
}

const statusStyles: Record<StatusBadgeProps['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-orange-100 text-orange-700 border-orange-200',
  info: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        statusStyles[status]
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'active'
            ? 'bg-emerald-500'
            : status === 'pending'
            ? 'bg-yellow-500'
            : status === 'danger'
            ? 'bg-red-500'
            : status === 'warning'
            ? 'bg-orange-500'
            : status === 'completed'
            ? 'bg-blue-500'
            : status === 'info'
            ? 'bg-indigo-500'
            : 'bg-gray-400'
        }`}
      />
      {label}
    </span>
  )
}
