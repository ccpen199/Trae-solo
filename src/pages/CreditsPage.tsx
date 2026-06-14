import { useState, useEffect, useCallback, useMemo } from 'react'
import { api, apiPost } from '@/lib/api'
import { X, AlertTriangle, CheckCircle, Clock, FileText, Link2 } from 'lucide-react'

interface CreditItem {
  user_id: number
  username: string
  display_name: string
  score: number
  level: string
  violation_count: number
}

interface CreditLog {
  id: number
  user_id: number
  delta: number
  reason: string
  operator_id: number | null
  created_at: string
  related_type: string
  related_id: number
  review_records: ReviewRecord[]
}

interface ReviewRecord {
  reviewer: string
  comment: string
  created_at: string
}

interface CreditDetail extends CreditItem {
  credit_logs: CreditLog[]
}

const levelMap: Record<string, { label: string; cls: string }> = {
  excellent: { label: '优秀', cls: 'bg-green-100 text-green-700' },
  good: { label: '良好', cls: 'bg-blue-100 text-blue-700' },
  normal: { label: '一般', cls: 'bg-slate-100 text-slate-600' },
  warning: { label: '警告', cls: 'bg-orange-100 text-orange-700' },
  banned: { label: '封禁', cls: 'bg-red-100 text-red-700' },
}

const levelOptions = [
  { value: '', label: '全部等级' },
  { value: 'excellent', label: '优秀' },
  { value: 'good', label: '良好' },
  { value: 'normal', label: '一般' },
  { value: 'warning', label: '警告' },
  { value: 'banned', label: '封禁' },
]

const relatedTypeMap: Record<string, string> = {
  news: '新闻',
  review: '评论',
  media: '视听',
  complaint: '诉求',
}

function getLevelByScore(score: number): { key: string; label: string; cls: string } {
  if (score >= 120) return { key: 'excellent', label: '优秀', cls: 'text-green-600' }
  if (score >= 100) return { key: 'good', label: '良好', cls: 'text-blue-600' }
  if (score >= 80) return { key: 'normal', label: '一般', cls: 'text-slate-600' }
  if (score >= 60) return { key: 'warning', label: '警告', cls: 'text-orange-600' }
  return { key: 'banned', label: '封禁', cls: 'text-red-600' }
}

export default function CreditsPage() {
  const [list, setList] = useState<CreditItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState('')

  const [adjustModal, setAdjustModal] = useState<CreditItem | null>(null)
  const [adjustDelta, setAdjustDelta] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustRelatedType, setAdjustRelatedType] = useState('')
  const [adjustRelatedId, setAdjustRelatedId] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustSuccess, setAdjustSuccess] = useState<{ newScore: number; newLevel: string } | null>(null)

  const [detailModal, setDetailModal] = useState<CreditDetail | null>(null)

  const previewScore = adjustModal ? adjustModal.score + (Number(adjustDelta) || 0) : 0
  const previewLevel = useMemo(() => {
    if (!adjustModal) return null
    return getLevelByScore(previewScore)
  }, [adjustModal, previewScore])

  const fetchCredits = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filterLevel) params.set('level', filterLevel)
      const res = await api<{ list: CreditItem[]; total: number }>(`/credits?${params}`)
      if (res.success) {
        setList(res.data.list)
        setTotal(res.data.total)
      }
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterLevel])

  useEffect(() => { fetchCredits() }, [fetchCredits])

  const handleAdjust = async () => {
    if (!adjustModal || !adjustDelta || !adjustReason) return
    setAdjustLoading(true)
    try {
      const res = await apiPost('/credits/adjust', {
        user_id: adjustModal.user_id,
        delta: Number(adjustDelta),
        reason: adjustReason,
        related_type: adjustRelatedType || undefined,
        related_id: adjustRelatedId ? Number(adjustRelatedId) : undefined,
      })
      if (res.success) {
        const newScore = adjustModal.score + Number(adjustDelta)
        const newLevel = getLevelByScore(newScore)
        setAdjustSuccess({ newScore, newLevel: newLevel.label })
        setTimeout(() => {
          setAdjustModal(null)
          setAdjustSuccess(null)
          setAdjustDelta('')
          setAdjustReason('')
          setAdjustRelatedType('')
          setAdjustRelatedId('')
          fetchCredits()
        }, 2000)
      }
    } catch { void 0 } finally {
      setAdjustLoading(false)
    }
  }

  const openDetail = async (userId: number) => {
    try {
      const res = await api<CreditDetail>(`/credits/${userId}`)
      if (res.success) setDetailModal(res.data)
    } catch { void 0 }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && list.length === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">创作者信用积分体系</h2>

      <div className="bg-white rounded-lg shadow p-3">
        <select
          value={filterLevel}
          onChange={(e) => { setFilterLevel(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {levelOptions.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-3 px-4">用户名</th>
              <th className="text-left py-3 px-4">昵称</th>
              <th className="text-right py-3 px-4">信用分</th>
              <th className="text-left py-3 px-4">等级</th>
              <th className="text-right py-3 px-4">违规次数</th>
              <th className="text-left py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.user_id} className="border-t hover:bg-slate-50">
                <td className="py-3 px-4">
                  <button onClick={() => openDetail(item.user_id)} className="text-blue-600 hover:text-blue-800 font-medium">
                    {item.username}
                  </button>
                </td>
                <td className="py-3 px-4 text-slate-700">{item.display_name}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-800">{item.score}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelMap[item.level]?.cls || ''}`}>
                    {levelMap[item.level]?.label || item.level}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-slate-600">{item.violation_count}</td>
                <td className="py-3 px-4">
                  <button onClick={() => setAdjustModal(item)} className="text-orange-600 hover:text-orange-800 text-xs font-medium">调整积分</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <span className="text-sm text-slate-500">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">上一页</button>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">下一页</button>
          </div>
        </div>
      )}

      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">调整积分 - {adjustModal.username}</h3>
              <button onClick={() => { setAdjustModal(null); setAdjustSuccess(null) }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {adjustSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">调整成功</h4>
                <p className="text-slate-600">
                  新积分: <span className="font-bold text-blue-600">{adjustSuccess.newScore}</span>
                  <span className="mx-2">|</span>
                  新等级: <span className="font-bold text-green-600">{adjustSuccess.newLevel}</span>
                </p>
                <p className="text-sm text-slate-400 mt-2">即将关闭窗口并刷新数据...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">当前积分</p>
                    <p className="text-xl font-bold text-slate-800">{adjustModal.score}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">当前等级</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelMap[adjustModal.level]?.cls || ''}`}>
                      {levelMap[adjustModal.level]?.label || adjustModal.level}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">变动值 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="正数加分，负数扣分"
                  />
                </div>

                {previewLevel && (
                  <div className={`rounded-lg p-4 ${previewLevel.key === adjustModal.level ? 'bg-slate-50' : previewLevel.key === 'banned' || previewLevel.key === 'warning' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center mb-2">
                      <AlertTriangle size={16} className={previewLevel.cls} />
                      <span className={`text-sm font-medium ml-2 ${previewLevel.cls}`}>等级变更预览</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">调整后积分: <span className="font-bold">{previewScore}</span></p>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelMap[adjustModal.level]?.cls || ''}`}>
                          {levelMap[adjustModal.level]?.label}
                        </span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelMap[previewLevel.key]?.cls || ''}`}>
                          {previewLevel.label}
                        </span>
                      </div>
                    </div>
                    {previewLevel.key === 'banned' && (
                      <p className="text-xs text-red-600 mt-2">⚠️ 调整后账号将被封禁，创作者权限将被收回</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">关联内容类型</label>
                    <select
                      value={adjustRelatedType}
                      onChange={(e) => setAdjustRelatedType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">无关联</option>
                      <option value="news">新闻</option>
                      <option value="media">视听</option>
                      <option value="review">评论</option>
                      <option value="complaint">诉求</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">关联内容ID</label>
                    <input
                      type="number"
                      value={adjustRelatedId}
                      onChange={(e) => setAdjustRelatedId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="内容ID"
                      disabled={!adjustRelatedType}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">调整原因 <span className="text-red-500">*</span></label>
                  <textarea
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="请详细说明调整原因，如：发布违规内容、不实信息等"
                  />
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                    <Clock size={14} className="mr-1" /> 复核记录
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText size={12} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-slate-600">本次调整将自动记录为复核记录</p>
                        <p className="text-xs text-slate-400">调整后可在信用详情中查看完整变更历史</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!adjustSuccess && (
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setAdjustModal(null); setAdjustDelta(''); setAdjustReason(''); setAdjustRelatedType(''); setAdjustRelatedId('') }} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
                <button onClick={handleAdjust} disabled={adjustLoading || !adjustDelta || !adjustReason} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {adjustLoading ? '提交中...' : '确认调整'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">信用详情 - {detailModal.username}</h3>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">当前积分</p>
                <p className="text-xl font-bold text-slate-800">{detailModal.score}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">等级</p>
                <p className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelMap[detailModal.level]?.cls || ''}`}>
                  {levelMap[detailModal.level]?.label || detailModal.level}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">违规次数</p>
                <p className="text-xl font-bold text-slate-800">{detailModal.violation_count}</p>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">积分变动记录</h4>
            {detailModal.credit_logs && detailModal.credit_logs.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="text-left py-2 px-3">变动值</th>
                    <th className="text-left py-2 px-3">原因</th>
                    <th className="text-left py-2 px-3">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.credit_logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className={`py-2 px-3 font-medium ${log.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.delta >= 0 ? '+' : ''}{log.delta}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{log.reason}</td>
                      <td className="py-2 px-3 text-slate-400 text-xs">{log.created_at?.slice(0, 16)?.replace('T', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-slate-400 py-4">暂无记录</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
