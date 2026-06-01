import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, Eye, Wrench } from 'lucide-react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/auth'

interface Anomaly {
  id: number
  type: string
  title: string
  description: string | null
  related_id: number | null
  status: string
  reporter_id: number | null
  created_at: string
  updated_at: string | null
  rectifications?: Rectification[]
}

interface Rectification {
  id: number
  anomaly_id: number
  measure: string
  result: string | null
  created_at: string
}

interface Stats {
  by_type: { type: string; count: number }[]
  by_status: { status: string; count: number }[]
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  supplier_expired: { label: '供应商资质过期', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  material_unqualified: { label: '食材不合格', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  sample_missing: { label: '留样缺失', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  complaint: { label: '投诉', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: '待处理', color: 'text-red-700', bg: 'bg-red-100' },
  processing: { label: '处理中', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  closed: { label: '已关闭', color: 'text-green-700', bg: 'bg-green-100' },
}

const statTypes = [
  { type: 'supplier_expired', label: '供应商资质过期', color: 'bg-orange-500' },
  { type: 'material_unqualified', label: '食材不合格', color: 'bg-red-500' },
  { type: 'sample_missing', label: '留样缺失', color: 'bg-purple-500' },
  { type: 'complaint', label: '投诉', color: 'bg-blue-500' },
]

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [stats, setStats] = useState<Stats>({ by_type: [], by_status: [] })
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const [showReport, setShowReport] = useState(false)
  const [reportType, setReportType] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportRelatedId, setReportRelatedId] = useState('')

  const [showProcess, setShowProcess] = useState<Anomaly | null>(null)
  const [processStatus, setProcessStatus] = useState('')
  const [rectifyMeasure, setRectifyMeasure] = useState('')
  const [rectifyResult, setRectifyResult] = useState('')

  const [showDetail, setShowDetail] = useState<Anomaly | null>(null)
  const [rectifications, setRectifications] = useState<Rectification[]>([])

  const user = useAuthStore((s) => s.user)

  const loadAnomalies = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterType) params.set('type', filterType)
    if (filterStatus) params.set('status', filterStatus)
    api.get<Anomaly[]>(`/api/anomalies?${params.toString()}`)
      .then(setAnomalies)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const loadStats = () => {
    api.get<Stats>('/api/anomalies/stats').then(setStats).catch(() => {})
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadAnomalies()
  }, [filterType, filterStatus])

  const getTypeCount = (type: string) =>
    stats.by_type.find((t) => t.type === type)?.count || 0

  const handleReport = async () => {
    if (!reportType || !reportTitle) return
    await api.post('/api/anomalies', {
      type: reportType,
      title: reportTitle,
      description: reportDesc || null,
      related_id: reportRelatedId || null,
      reporter_id: user?.id || null,
    })
    setShowReport(false)
    setReportType('')
    setReportTitle('')
    setReportDesc('')
    setReportRelatedId('')
    loadAnomalies()
    loadStats()
  }

  const handleProcess = async () => {
    if (!showProcess) return
    await api.put(`/api/anomalies/${showProcess.id}`, {
      status: processStatus || undefined,
    })
    if (rectifyMeasure) {
      await api.post('/api/rectifications', {
        anomaly_id: showProcess.id,
        measure: rectifyMeasure,
        result: rectifyResult || null,
      })
    }
    setShowProcess(null)
    setProcessStatus('')
    setRectifyMeasure('')
    setRectifyResult('')
    loadAnomalies()
    loadStats()
  }

  const openDetail = async (anomaly: Anomaly) => {
    const detail = await api.get<Anomaly>(`/api/anomalies/${anomaly.id}`)
    setShowDetail(detail)
    setRectifications(detail.rectifications || [])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">异常处理</h1>
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          <Plus size={16} />
          报告异常
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statTypes.map(({ type, label, color }) => (
          <div key={type} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <AlertTriangle className="text-white" size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-800">{getTypeCount(type)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">全部类型</option>
          {Object.entries(typeConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">全部状态</option>
          {Object.entries(statusConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">描述</th>
                <th className="px-4 py-3 font-medium">关联ID</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">报告人</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">加载中...</td>
                </tr>
              )}
              {!loading && anomalies.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无数据</td>
                </tr>
              )}
              {anomalies.map((a) => {
                const tc = typeConfig[a.type] || { label: a.type, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
                const sc = statusConfig[a.status] || { label: a.status, color: 'text-gray-700', bg: 'bg-gray-100' }
                return (
                  <tr key={a.id} className="border-b border-gray-50 transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${tc.bg} ${tc.color}`}>
                        {tc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.title}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">{a.description || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.related_id ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.reporter_id ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{a.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {a.status === 'open' && (
                          <button
                            onClick={() => {
                              setShowProcess(a)
                              setProcessStatus('processing')
                            }}
                            className="flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 transition hover:bg-yellow-100"
                          >
                            <Wrench size={12} />
                            处理
                          </button>
                        )}
                        <button
                          onClick={() => openDetail(a)}
                          className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={12} />
                          查看整改
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showReport && (
        <Modal onClose={() => setShowReport(false)} title="报告异常">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">类型</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">请选择类型</option>
                {Object.entries(typeConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">标题</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入标题"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
              <textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入描述"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">关联 ID</label>
              <input
                type="number"
                value={reportRelatedId}
                onChange={(e) => setReportRelatedId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="可选"
              />
            </div>
            <button
              onClick={handleReport}
              disabled={!reportType || !reportTitle}
              className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              提交
            </button>
          </div>
        </Modal>
      )}

      {showProcess && (
        <Modal onClose={() => setShowProcess(null)} title="处理异常">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
              <select
                value={processStatus}
                onChange={(e) => setProcessStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="processing">处理中</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">整改措施</label>
              <textarea
                value={rectifyMeasure}
                onChange={(e) => setRectifyMeasure(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入整改措施"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">整改结果</label>
              <input
                type="text"
                value={rectifyResult}
                onChange={(e) => setRectifyResult(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="可选"
              />
            </div>
            <button
              onClick={handleProcess}
              className="w-full rounded-lg bg-yellow-600 py-2 text-sm font-medium text-white transition hover:bg-yellow-700"
            >
              提交
            </button>
          </div>
        </Modal>
      )}

      {showDetail && (
        <Modal onClose={() => setShowDetail(null)} title="异常详情">
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">标题:</span> <span className="font-medium text-gray-800">{showDetail.title}</span></p>
              <p><span className="text-gray-500">类型:</span> {typeConfig[showDetail.type]?.label || showDetail.type}</p>
              <p><span className="text-gray-500">描述:</span> {showDetail.description || '-'}</p>
              <p><span className="text-gray-500">状态:</span> {statusConfig[showDetail.status]?.label || showDetail.status}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">整改记录</p>
              {rectifications.length === 0 ? (
                <p className="text-sm text-gray-400">暂无整改记录</p>
              ) : (
                <div className="space-y-2">
                  {rectifications.map((r) => (
                    <div key={r.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-sm text-gray-700">{r.measure}</p>
                      {r.result && <p className="mt-1 text-xs text-gray-400">结果: {r.result}</p>}
                      <p className="mt-1 text-xs text-gray-400">{r.created_at}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
