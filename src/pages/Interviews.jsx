import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Loader2, CalendarCheck } from 'lucide-react'
import { api } from '../utils/api'

const INTERVIEW_TYPES = [
  { value: '技术面试', label: '技术面试' },
  { value: 'HR面试', label: 'HR面试' },
  { value: '终面', label: '终面' },
  { value: '综合面试', label: '综合面试' },
]

const statusLabel = { scheduled: '已安排', completed: '已完成', cancelled: '已取消' }
const statusColor = {
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const evaluationStatusLabel = {
  pending: '未评估',
  completed: '已评估',
  review: '待复查',
}
const evaluationStatusColor = {
  pending: 'bg-slate-100 text-slate-600',
  completed: 'bg-green-100 text-green-700',
  review: 'bg-amber-100 text-amber-700',
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        <option value="">{placeholder || '-- 请选择 --'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function Interviews() {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    candidate_id: '',
    job_id: '',
    interviewer_name: '',
    interview_type: '',
    scheduled_at: '',
    location: '',
  })

  useEffect(() => {
    Promise.all([
      api.get('/candidates?limit=50').catch(() => ({ items: [] })),
      api.get('/jobs?limit=50').catch(() => ({ items: [] })),
    ]).then(([cData, jData]) => {
      setCandidates((cData.items || []).map((c) => ({ value: c.id, label: c.name })))
      setJobs((jData.items || []).map((j) => ({ value: j.id, label: j.title })))
    })
  }, [])

  const fetchInterviews = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/interviews')
      setInterviews(Array.isArray(data) ? data : data.items || [])
    } catch {
      setInterviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  const submitInterview = async () => {
    setSubmitting(true)
    try {
      await api.post('/interviews', form)
      setModalOpen(false)
      setForm({ candidate_id: '', job_id: '', interviewer_name: '', interview_type: '', scheduled_at: '', location: '' })
      fetchInterviews()
    } catch {} finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">面试评估</h1>
          <p className="mt-2 text-sm text-slate-500">面试排期、评价归档和录用决策追踪</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md"
        >
          <Plus size={16} />
          安排面试
        </button>
      </section>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="animate-pulse p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-200" />
            ))}
          </div>
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
          <CalendarCheck size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">暂无面试安排</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">候选人</th>
                  <th className="px-4 py-3 text-left font-semibold">职位</th>
                  <th className="px-4 py-3 text-left font-semibold">面试官</th>
                  <th className="px-4 py-3 text-left font-semibold">面试类型</th>
                  <th className="px-4 py-3 text-left font-semibold">时间</th>
                  <th className="px-4 py-3 text-left font-semibold">地点</th>
                  <th className="px-4 py-3 text-left font-semibold">状态</th>
                  <th className="px-4 py-3 text-left font-semibold">评估状态</th>
                  <th className="px-4 py-3 text-left font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {interviews.map((iv) => (
                  <tr
                    key={iv.id}
                    onClick={() => navigate(`/interviews/${iv.id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{iv.candidate_name || `候选人 #${iv.candidate_id}`}</td>
                    <td className="px-4 py-3 text-slate-700">{iv.job_title || `职位 #${iv.job_id}`}</td>
                    <td className="px-4 py-3 text-slate-700">{iv.interviewer_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{iv.interview_type || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{iv.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[iv.status] || 'bg-slate-50 text-slate-500'}`}>
                        {statusLabel[iv.status] || iv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${evaluationStatusColor[iv.evaluation_status || (iv.evaluation ? 'completed' : 'pending')] || evaluationStatusColor.pending}`}>
                        {evaluationStatusLabel[iv.evaluation_status || (iv.evaluation ? 'completed' : 'pending')] || '未评估'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/interviews/${iv.id}`) }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="安排面试">
        <div className="space-y-4">
          <SelectField label="候选人" value={form.candidate_id} onChange={(v) => setForm((f) => ({ ...f, candidate_id: v }))} options={candidates} placeholder="-- 选择候选人 --" />
          <SelectField label="职位" value={form.job_id} onChange={(v) => setForm((f) => ({ ...f, job_id: v }))} options={jobs} placeholder="-- 选择职位 --" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">面试官</label>
            <input
              type="text"
              value={form.interviewer_name}
              onChange={(e) => setForm((f) => ({ ...f, interviewer_name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="面试官姓名"
            />
          </div>
          <SelectField
            label="面试类型"
            value={form.interview_type}
            onChange={(v) => setForm((f) => ({ ...f, interview_type: v }))}
            options={INTERVIEW_TYPES}
            placeholder="-- 选择类型 --"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">面试时间</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">面试地点</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="线上/线下地址"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitInterview}
              disabled={submitting || !form.candidate_id || !form.interview_type}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
