import { useState, useEffect, useCallback } from 'react'
import { api, apiPost } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { Plus, X } from 'lucide-react'

interface ComplaintItem {
  id: number
  title: string
  category: string | null
  priority: string
  status: string
  assigned_department: string | null
  created_at: string
}

interface DispatchItem {
  department: string
  instruction: string | null
}

interface ProgressItem {
  status: string
  description: string
}

interface ComplaintDetail extends ComplaintItem {
  content: string
  dispatches: DispatchItem[]
  progress: ProgressItem[]
  surveys: Record<string, unknown>[]
}

const priorityMap: Record<string, { label: string; cls: string }> = {
  urgent: { label: '紧急', cls: 'bg-red-100 text-red-700' },
  high: { label: '高', cls: 'bg-orange-100 text-orange-700' },
  normal: { label: '普通', cls: 'bg-blue-100 text-blue-700' },
  low: { label: '低', cls: 'bg-slate-100 text-slate-600' },
}

const statusMap: Record<string, { label: string; cls: string }> = {
  submitted: { label: '已提交', cls: 'bg-slate-100 text-slate-600' },
  dispatched: { label: '已派单', cls: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', cls: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', cls: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', cls: 'bg-slate-100 text-slate-600' },
}

const complaintCategories = ['环保', '市政', '社保', '教育', '交通', '其他']
const priorityOptions = [
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'normal', label: '普通' },
  { value: 'low', label: '低' },
]

export default function ComplaintsPage() {
  const { user } = useAuth()
  const [list, setList] = useState<ComplaintItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('其他')
  const [formPriority, setFormPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)

  const [detailModal, setDetailModal] = useState<ComplaintDetail | null>(null)
  const [satisfactionRating, setSatisfactionRating] = useState(5)
  const [satisfactionComment, setSatisfactionComment] = useState('')
  const [surveySubmitting, setSurveySubmitting] = useState(false)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api<{ list: ComplaintItem[]; total: number }>(`/complaints?page=${page}&pageSize=${pageSize}`)
      if (res.success) {
        setList(res.data.list)
        setTotal(res.data.total)
      }
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formTitle.trim() || !formContent.trim()) return
    setSubmitting(true)
    try {
      const res = await apiPost('/complaints', {
        user_id: user.id,
        title: formTitle,
        content: formContent,
        category: formCategory,
        priority: formPriority,
      })
      if (res.success) {
        setShowForm(false)
        setFormTitle('')
        setFormContent('')
        setFormCategory('其他')
        setFormPriority('normal')
        fetchComplaints()
      }
    } catch { void 0 } finally {
      setSubmitting(false)
    }
  }

  const openDetail = async (id: number) => {
    try {
      const res = await api<ComplaintDetail>(`/complaints/${id}`)
      if (res.success) setDetailModal(res.data)
    } catch { void 0 }
  }

  const handleSurvey = async () => {
    if (!user || !detailModal) return
    setSurveySubmitting(true)
    try {
      await apiPost(`/complaints/${detailModal.id}/satisfaction`, {
        user_id: user.id,
        rating: satisfactionRating,
        comment: satisfactionComment,
      })
      setSatisfactionComment('')
      setSatisfactionRating(5)
      openDetail(detailModal.id)
    } catch { void 0 } finally {
      setSurveySubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && list.length === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">市民问政交互引擎</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} />
          新建诉求
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">新建诉求</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">标题 <span className="text-red-500">*</span></label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入诉求标题" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">内容 <span className="text-red-500">*</span></label>
              <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入诉求内容" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">分类</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {complaintCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">优先级</label>
                <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {priorityOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? '提交中...' : '提交'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">标题</th>
              <th className="text-left py-3 px-4">分类</th>
              <th className="text-left py-3 px-4">优先级</th>
              <th className="text-left py-3 px-4">状态</th>
              <th className="text-left py-3 px-4">派单部门</th>
              <th className="text-left py-3 px-4">创建时间</th>
              <th className="text-left py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-500">{item.id}</td>
                <td className="py-3 px-4 text-slate-800 font-medium max-w-[200px] truncate">{item.title}</td>
                <td className="py-3 px-4 text-slate-600">{item.category || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityMap[item.priority]?.cls || ''}`}>
                    {priorityMap[item.priority]?.label || item.priority}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[item.status]?.cls || ''}`}>
                    {statusMap[item.status]?.label || item.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">{item.assigned_department || '-'}</td>
                <td className="py-3 px-4 text-slate-500 text-xs">{item.created_at?.slice(0, 16)?.replace('T', ' ')}</td>
                <td className="py-3 px-4">
                  <button onClick={() => openDetail(item.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">详情</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400">暂无数据</td></tr>
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

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">诉求详情 #{detailModal.id}</h3>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">标题</p>
                <p className="text-slate-800 font-medium">{detailModal.title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">内容</p>
                <p className="text-slate-700 text-sm">{detailModal.content}</p>
              </div>

              {detailModal.dispatches && detailModal.dispatches.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">派单记录</p>
                  {detailModal.dispatches.map((d: DispatchItem, i: number) => (
                    <div key={i} className="bg-slate-50 rounded p-3 mb-2 text-sm">
                      <span className="text-slate-600">部门: {d.department}</span>
                      {d.instruction && <span className="ml-3 text-slate-500">指示: {d.instruction}</span>}
                    </div>
                  ))}
                </div>
              )}

              {detailModal.progress && detailModal.progress.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">处理进度</p>
                  <div className="space-y-2">
                    {detailModal.progress.map((p: ProgressItem, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div className="text-sm">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${statusMap[p.status]?.cls || ''}`}>
                            {statusMap[p.status]?.label || p.status}
                          </span>
                          <span className="ml-2 text-slate-600">{p.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-600 mb-2">满意度评价</p>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setSatisfactionRating(r)} className={`w-8 h-8 rounded-full text-sm font-bold ${satisfactionRating >= r ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={satisfactionComment}
                  onChange={(e) => setSatisfactionComment(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="评价内容（选填）"
                />
                <button
                  onClick={handleSurvey}
                  disabled={surveySubmitting}
                  className="mt-2 px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {surveySubmitting ? '提交中...' : '提交评价'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
