interface StatusBadgeProps {
  status: string
  type: 'order' | 'inspection' | 'subsidy' | 'alert' | 'plan' | 'complaint'
}

type StatusConfig = { label: string; color: string }

const orderStatusMap: Record<string, StatusConfig> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  assigned: { label: '已分配', color: 'bg-indigo-100 text-indigo-700' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-600' },
}

const inspectionStatusMap: Record<string, StatusConfig> = {
  passed: { label: '通过', color: 'bg-green-100 text-green-700' },
  failed: { label: '未通过', color: 'bg-red-100 text-red-700' },
  pending: { label: '待检查', color: 'bg-yellow-100 text-yellow-700' },
}

const subsidyStatusMap: Record<string, StatusConfig> = {
  approved: { label: '已批准', color: 'bg-green-100 text-green-700' },
  pending: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  disbursed: { label: '已发放', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
}

const complaintStatusMap: Record<string, StatusConfig> = {
  submitted: { label: '已提交', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
  closed: { label: '已闭环', color: 'bg-slate-100 text-slate-600' },
}

const alertStatusMap: Record<string, StatusConfig> = {
  critical: { label: '严重', color: 'bg-red-100 text-red-700' },
  warning: { label: '警告', color: 'bg-orange-100 text-orange-700' },
  info: { label: '提示', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
}

const planStatusMap: Record<string, StatusConfig> = {
  active: { label: '执行中', color: 'bg-blue-100 text-blue-700' },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
}

const statusMaps: Record<string, Record<string, StatusConfig>> = {
  order: orderStatusMap,
  inspection: inspectionStatusMap,
  subsidy: subsidyStatusMap,
  alert: alertStatusMap,
  plan: planStatusMap,
  complaint: complaintStatusMap,
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const map = statusMaps[type]
  const config = map[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
