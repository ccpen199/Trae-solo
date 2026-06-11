import { useState } from 'react'
import { RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'

const mockCache = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  recordType: ['access', 'repair', 'alert', 'payment'][i % 4],
  recordId: `REC-${String(i + 1).padStart(4, '0')}`,
  data: `缓存数据 #${i + 1}`,
  syncStatus: (['synced', 'pending', 'synced', 'failed', 'syncing', 'synced', 'pending', 'synced'] as const)[i],
  createdAt: `2026-06-10 ${String(8 + i).padStart(2, '0')}:${String(i * 10 % 60).padStart(2, '0')}:00`,
  syncedAt: i % 3 === 0 ? `2026-06-10 ${String(9 + i).padStart(2, '0')}:${String(i * 10 % 60).padStart(2, '0')}:00` : undefined,
}))

const typeLabels: Record<string, string> = { access: '通行', repair: '报修', alert: '告警', payment: '缴费' }

const statusIcons: Record<string, React.ElementType> = {
  synced: CheckCircle, pending: Clock, syncing: RefreshCw, failed: AlertCircle,
}

const statusColors: Record<string, string> = {
  synced: 'text-emerald-600', pending: 'text-amber-600', syncing: 'text-blue-600', failed: 'text-red-600',
}

const statusLabels: Record<string, string> = {
  synced: '已同步', pending: '待同步', syncing: '同步中', failed: '同步失败',
}

export default function OfflineCache() {
  const [cache, setCache] = useState(mockCache)
  const [syncingAll, setSyncingAll] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleSync = (id: string) => {
    setCache((prev) => prev.map((c) => c.id === id ? { ...c, syncStatus: 'syncing' as const } : c))
    setTimeout(() => {
      setCache((prev) => prev.map((c) => c.id === id ? { ...c, syncStatus: 'synced' as const, syncedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) } : c))
    }, 1500)
  }

  const handleSyncAll = () => {
    setSyncingAll(true)
    setProgress(0)
    setCache((prev) => prev.map((c) => c.syncStatus !== 'synced' ? { ...c, syncStatus: 'syncing' as const } : c))
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setSyncingAll(false)
          setCache((prev) => prev.map((c) => ({ ...c, syncStatus: 'synced' as const, syncedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) })))
          return 100
        }
        return p + 20
      })
    }, 400)
  }

  const pendingCount = cache.filter((c) => c.syncStatus !== 'synced').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="离线缓存"
        subtitle="管理离线数据同步"
        actions={
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="text-sm text-amber-600">{pendingCount} 条待同步</span>
            )}
            <button
              onClick={handleSyncAll}
              disabled={syncingAll || pendingCount === 0}
              className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={16} className={cn(syncingAll && 'animate-spin')} />
              {syncingAll ? '同步中...' : '全部同步'}
            </button>
          </div>
        }
      />

      {syncingAll && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">同步进度</span>
            <span className="font-mono text-emerald-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">记录类型</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">记录ID</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">同步状态</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">创建时间</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">同步时间</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cache.map((c) => {
                const StatusIcon = statusIcons[c.syncStatus]
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-700">{typeLabels[c.recordType]}</td>
                    <td className="px-5 py-3 text-sm text-slate-800 font-mono">{c.recordId}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusColors[c.syncStatus]}`}>
                        <StatusIcon size={14} className={cn(c.syncStatus === 'syncing' && 'animate-spin')} />
                        {statusLabels[c.syncStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{c.createdAt}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{c.syncedAt || '-'}</td>
                    <td className="px-5 py-3">
                      {c.syncStatus !== 'synced' && c.syncStatus !== 'syncing' && (
                        <button
                          onClick={() => handleSync(c.id)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          同步
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
