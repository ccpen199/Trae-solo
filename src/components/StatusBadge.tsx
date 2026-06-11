import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
}

const variantMap: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  default: 'bg-slate-50 text-slate-600 border-slate-200',
}

const statusVariantMap: Record<string, string> = {
  online: 'success', active: 'success', paid: 'success', completed: 'success', success: 'success',
  published: 'success', synced: 'success', approved: 'success',
  offline: 'danger', denied: 'danger', error: 'danger', critical: 'danger', overdue: 'danger',
  failed: 'danger', rejected: 'danger', urgent: 'danger', resolved: 'success',
  maintenance: 'warning', pending: 'warning', unpaid: 'warning', assigned: 'warning',
  processing: 'info', feedback: 'info', reviewing: 'info', important: 'warning',
  normal: 'default', draft: 'default', low: 'default',
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const v = variant || statusVariantMap[status] || 'default'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variantMap[v])}>
      {status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
      {status === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />}
      {statusLabel(status)}
    </span>
  )
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    online: '在线', offline: '离线', maintenance: '维护中',
    success: '成功', denied: '拒绝', error: '异常',
    pending: '待派单', assigned: '已派单', processing: '处理中',
    feedback: '待反馈', completed: '已完成',
    unpaid: '未缴', paid: '已缴', overdue: '逾期',
    draft: '草稿', published: '已发布', archived: '已归档',
    active: '活跃', reviewing: '审核中', hidden: '已隐藏',
    critical: '紧急', important: '重要', normal: '一般',
    low: '低', medium: '中', high: '高',
    synced: '已同步', failed: '同步失败',
    resolved: '已处理', handling: '处理中',
  }
  return labels[status] || status
}
