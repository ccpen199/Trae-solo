import { FileCheck, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

interface FilingSectionProps {
  filingRecord: any
}

const statusMap: Record<string, { status: string; label: string; icon: any }> = {
  pending: { status: 'warning', label: '待备案', icon: Clock },
  completed: { status: 'success', label: '已备案', icon: CheckCircle },
  failed: { status: 'danger', label: '备案失败', icon: AlertCircle },
}

export default function FilingSection({ filingRecord }: FilingSectionProps) {
  if (!filingRecord) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="heading-font text-lg font-semibold text-text-primary mb-4">农业部门备案</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-stone-200 rounded w-1/2" />
          <div className="h-4 bg-stone-200 rounded w-3/4" />
        </div>
      </div>
    )
  }

  const statusInfo = statusMap[filingRecord.status] || statusMap.pending
  const StatusIcon = statusInfo.icon

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="heading-font text-lg font-semibold text-text-primary mb-4">农业部门备案</h3>
      <div className="p-4 bg-stone-50 rounded-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              statusInfo.status === 'success' ? 'bg-success/10' :
              statusInfo.status === 'danger' ? 'bg-danger/10' : 'bg-warning/10'
            }`}>
              <StatusIcon className={`w-5 h-5 ${
                statusInfo.status === 'success' ? 'text-success' :
                statusInfo.status === 'danger' ? 'text-danger' : 'text-warning'
              }`} />
            </div>
            <div>
              <p className="font-medium text-text-primary">备案状态</p>
              <StatusBadge status={statusInfo.status} label={statusInfo.label} size="md" />
            </div>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">备案编号</span>
            <span className="font-medium text-text-primary font-mono">FIL-{String(filingRecord.id).padStart(6, '0')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">提交时间</span>
            <span className="text-text-primary">{new Date(filingRecord.filed_at).toLocaleString('zh-CN')}</span>
          </div>
          {filingRecord.response_data && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">备案结果</span>
              <span className="text-success">备案成功</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-stone-200">
          <p className="text-xs text-text-secondary flex items-start gap-2">
            <FileCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            根据《中华人民共和国动物防疫法》规定，宠物领养需向农业农村部门备案，确保宠物免疫和防疫工作落实。
          </p>
        </div>
      </div>
    </div>
  )
}
