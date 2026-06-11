import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

const mockAlerts = [
  { id: '1', deviceName: '7号楼门禁', type: 'offline', level: 'critical' as const, message: '设备离线超过30分钟', status: 'active' as const, createdAt: '2026-06-10 10:00:00' },
  { id: '2', deviceName: '3号楼摄像头', type: 'abnormal', level: 'important' as const, message: '视频信号异常，频繁丢帧', status: 'active' as const, createdAt: '2026-06-10 09:30:00' },
  { id: '3', deviceName: '地下车库闸机', type: 'firmware', level: 'normal' as const, message: '固件版本过旧，需要升级', status: 'active' as const, createdAt: '2026-06-10 08:00:00' },
  { id: '4', deviceName: '1号楼门禁', type: 'tamper', level: 'critical' as const, message: '检测到设备被非法拆卸', status: 'handling' as const, createdAt: '2026-06-10 07:15:00' },
  { id: '5', deviceName: '5号楼传感器', type: 'low_battery', level: 'important' as const, message: '电池电量低于15%', status: 'handling' as const, createdAt: '2026-06-09 22:00:00' },
  { id: '6', deviceName: '2号楼电梯', type: 'abnormal', level: 'normal' as const, message: '运行数据波动', status: 'resolved' as const, createdAt: '2026-06-09 18:00:00' },
]

const levelBorders: Record<string, string> = {
  critical: 'border-l-red-500', important: 'border-l-amber-500', normal: 'border-l-blue-500',
}

const typeLabels: Record<string, string> = {
  offline: '设备离线', abnormal: '异常', low_battery: '低电量', tamper: '防拆告警', firmware: '固件',
}

function CountdownTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(createdAt).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setElapsed(`${h}时${m}分`)
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [createdAt])

  return <span className="text-xs text-red-500 flex items-center gap-1"><Clock size={12} />{elapsed}</span>
}

export default function AlertList() {
  const navigate = useNavigate()
  const [levelFilter, setLevelFilter] = useState('')

  const filtered = mockAlerts.filter((a) => {
    if (levelFilter && a.level !== levelFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="设备告警" subtitle="查看和处理设备告警" />

      <div className="flex gap-3">
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">全部级别</option>
          <option value="critical">严重</option>
          <option value="important">重要</option>
          <option value="normal">一般</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            onClick={() => navigate(`/alerts/${alert.id}`)}
            className={cn('bg-white rounded-xl border border-slate-200 border-l-4 p-5 hover:shadow-md cursor-pointer transition-all', levelBorders[alert.level])}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-800">{alert.deviceName}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{typeLabels[alert.type]}</span>
                <StatusBadge status={alert.level} />
              </div>
              <div className="flex items-center gap-3">
                {alert.status === 'active' && <CountdownTimer createdAt={alert.createdAt} />}
                <StatusBadge status={alert.status} />
              </div>
            </div>
            <p className="text-sm text-slate-600">{alert.message}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400">{alert.createdAt}</span>
              {alert.status === 'active' && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/alerts/${alert.id}`) }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  立即处理
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
