import { useState } from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

const mockAlert = {
  id: '1',
  deviceName: '7号楼门禁',
  type: 'offline',
  level: 'critical' as const,
  message: '设备离线超过30分钟，无法正常通信',
  status: 'active' as const,
  createdAt: '2026-06-10 10:00:00',
}

const timeline = [
  { time: '2026-06-10 10:00', label: '告警触发：设备心跳超时', type: 'alert' as const },
  { time: '2026-06-10 10:05', label: '系统自动重试连接 - 失败', type: 'retry' as const },
  { time: '2026-06-10 10:10', label: '告警升级为严重', type: 'escalation' as const },
]

const relatedAlerts = [
  { id: '2', deviceName: '7号楼门禁', level: 'important' as const, message: '此前已出现3次短暂离线', time: '2026-06-09' },
  { id: '3', deviceName: '7号楼门禁', level: 'normal' as const, message: '固件版本过旧', time: '2026-06-05' },
]

export default function AlertDetail() {
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [handling, setHandling] = useState(false)

  const handleAction = () => {
    if (!method) return
    setHandling(true)
    setTimeout(() => setHandling(false), 800)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="告警详情" actions={<StatusBadge status={mockAlert.status} />} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={cn('bg-white rounded-xl border border-slate-200 border-l-4 p-6 border-l-red-500')}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="text-lg font-semibold text-slate-800">{mockAlert.deviceName}</h3>
              <StatusBadge status={mockAlert.level} />
            </div>
            <p className="text-sm text-slate-600 mb-4">{mockAlert.message}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400">告警类型</span>
                <p className="text-slate-700 mt-0.5">设备离线</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">触发时间</span>
                <p className="text-slate-700 mt-0.5">{mockAlert.createdAt}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">持续时间</span>
                <p className="text-red-600 font-medium mt-0.5">1小时30分</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">响应时间线</h3>
            <div className="space-y-0">
              {timeline.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                      step.type === 'alert' ? 'bg-red-100 text-red-500' :
                      step.type === 'escalation' ? 'bg-amber-100 text-amber-500' :
                      'bg-blue-100 text-blue-500'
                    )}>
                      <CheckCircle size={14} />
                    </div>
                    {i < timeline.length - 1 && <div className="w-0.5 h-8 bg-slate-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-slate-700">{step.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">处理告警</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">处理方式 <span className="text-red-500">*</span></label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">请选择</option>
                  <option value="restart">远程重启</option>
                  <option value="onsite">现场处理</option>
                  <option value="replace">设备更换</option>
                  <option value="ignore">标记误报</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">处理备注</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="请输入处理说明"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <button
                onClick={handleAction}
                disabled={!method || handling}
                className="h-10 px-6 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {handling ? '处理中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">关联告警</h3>
            <div className="space-y-3">
              {relatedAlerts.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{a.deviceName}</span>
                    <StatusBadge status={a.level} />
                  </div>
                  <p className="text-xs text-slate-500">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
