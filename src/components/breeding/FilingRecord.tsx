import { Landmark, FileCheck, AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

const filingStatusMap: Record<string, { status: string; label: string }> = {
  pending: { status: 'warning', label: '待备案' },
  filed: { status: 'success', label: '已备案' },
  failed: { status: 'danger', label: '备案失败' },
}

interface Props {
  filing?: {
    id: string
    status: string
    response_code?: string
    created_at?: string
    updated_at?: string
    response_data?: any
  } | null
}

export default function FilingRecord({ filing }: Props) {
  const status = filing?.status || 'pending'
  const statusInfo = filingStatusMap[status] || { status: 'warning', label: '待备案' }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-5">
      <h3 className="heading-font text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-secondary" />
        农业农村部门备案
      </h3>

      <div className={`p-4 rounded-xl border mb-4 ${
        status === 'filed' ? 'bg-success/5 border-success/20' :
        status === 'failed' ? 'bg-danger/5 border-danger/20' :
        'bg-warning/5 border-warning/20'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            status === 'filed' ? 'bg-success/10 text-success' :
            status === 'failed' ? 'bg-danger/10 text-danger' :
            'bg-warning/10 text-warning'
          }`}>
            {status === 'filed' ? <CheckCircle className="w-5 h-5" /> :
             status === 'failed' ? <AlertCircle className="w-5 h-5" /> :
             <Clock className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-text-primary">备案状态</span>
              <StatusBadge status={statusInfo.status} label={statusInfo.label} />
            </div>
            <p className="text-xs text-text-secondary">
              活体配种操作按规定需向农业农村部门备案，确保合法合规
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between py-2 border-b border-stone-100">
          <span className="text-text-secondary">备案编号</span>
          <span className="font-medium text-text-primary font-mono text-xs">
            {filing?.id || `BL-${Date.now().toString().slice(-8)}`}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-stone-100">
          <span className="text-text-secondary">提交时间</span>
          <span className="text-text-primary">
            {filing?.created_at || new Date().toLocaleString('zh-CN')}
          </span>
        </div>
        {status !== 'pending' && (
          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <span className="text-text-secondary">响应时间</span>
            <span className="text-text-primary">
              {filing?.updated_at || '-'}
            </span>
          </div>
        )}
        {status === 'filed' && (
          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <span className="text-text-secondary">备案响应码</span>
            <span className="font-medium text-success font-mono text-xs">
              {filing?.response_code || 'AGRI-200-OK'}
            </span>
          </div>
        )}
        {status === 'failed' && (
          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <span className="text-text-secondary">错误码</span>
            <span className="font-medium text-danger font-mono text-xs">
              {filing?.response_code || 'AGRI-500-ERR'}
            </span>
          </div>
        )}
        {filing?.response_data && (
          <div className="pt-3">
            <p className="text-text-secondary text-xs mb-2">响应数据</p>
            <pre className="bg-stone-50 p-3 rounded-lg text-xs text-text-primary overflow-x-auto font-mono">
{JSON.stringify(filing.response_data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {status === 'failed' && (
        <button className="mt-4 w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-text-primary text-sm font-medium rounded-xl transition flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" />
          重试备案
        </button>
      )}
    </div>
  )
}
