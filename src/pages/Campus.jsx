import { useState, useEffect, useCallback } from 'react'
import { Calendar, GraduationCap, Award, Plus, X, Star, Loader2, TrendingUp, Users, FileText, AlertTriangle, CheckCircle, Clock, Target, BarChart3 } from 'lucide-react'
import { api } from '../utils/api'

const TABS = [
  { key: 'schedule', label: '校招日程', icon: Calendar },
  { key: 'internships', label: '实习管理', icon: GraduationCap },
  { key: 'ambassadors', label: '校园大使', icon: Award },
  { key: 'dashboard', label: '数据汇总', icon: BarChart3 },
]

const eventTypeColor = {
  '宣讲会': 'bg-blue-50 text-blue-700',
  '笔试': 'bg-amber-50 text-amber-700',
  '面试日': 'bg-emerald-50 text-emerald-700',
}

const scheduleStatusColor = {
  planned: 'bg-amber-50 text-amber-700',
  ongoing: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}
const scheduleStatusLabel = { planned: '待举办', ongoing: '进行中', completed: '已完成', cancelled: '已取消' }

const convStatusLabel = { pending: '待评估', under_review: '评估中', approved: '通过', rejected: '未通过' }
const convStatusColor = {
  pending: 'bg-slate-50 text-slate-600',
  under_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}

const taskTypeLabel = { promotion: '推广', referral: '推荐', event_support: '活动支持', content: '内容' }
const taskTypeColor = {
  promotion: 'bg-blue-50 text-blue-700',
  referral: 'bg-purple-50 text-purple-700',
  event_support: 'bg-emerald-50 text-emerald-700',
  content: 'bg-amber-50 text-amber-700',
}
const taskStatusLabel = { pending: '待开始', in_progress: '进行中', completed: '已完成' }
const taskStatusColor = {
  pending: 'bg-slate-50 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
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

function Stars({ rating, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className="focus:outline-none"
        >
          <Star
            size={16}
            className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
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

export default function Campus() {
  const [activeTab, setActiveTab] = useState('schedule')
  const [schedules, setSchedules] = useState([])
  const [internships, setInternships] = useState([])
  const [ambassadors, setAmbassadors] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [scheduleModal, setScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ university_name: '', event_type: '宣讲会', event_date: '', location: '', contact_person: '', description: '', attendees_count: 0, resumes_received: 0, status: 'planned' })

  const [evalModal, setEvalModal] = useState(false)
  const [evalTarget, setEvalTarget] = useState(null)
  const [evalForm, setEvalForm] = useState({ conversion_status: 'pending', conversion_probability: 50, performance_rating: 3, mentor_feedback: '' })

  const [ambassadorModal, setAmbassadorModal] = useState(false)
  const [ambassadorForm, setAmbassadorForm] = useState({ name: '', university: '', email: '', phone: '' })

  const [taskModal, setTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ ambassador_id: '', task_type: 'promotion', task_title: '', description: '', deadline: '', reward_points: 0, status: 'pending' })

  const [updateTaskModal, setUpdateTaskModal] = useState(false)
  const [updateTaskTarget, setUpdateTaskTarget] = useState(null)
  const [updateTaskForm, setUpdateTaskForm] = useState({ status: 'pending', actual_points: 0 })

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/campus/schedule')
      setSchedules(Array.isArray(data) ? data : [])
    } catch { setSchedules([]) }
    finally { setLoading(false) }
  }, [])

  const fetchInternships = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/campus/internships')
      setInternships(Array.isArray(data) ? data : [])
    } catch { setInternships([]) }
    finally { setLoading(false) }
  }, [])

  const fetchAmbassadors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/campus/ambassadors')
      setAmbassadors(Array.isArray(data) ? data : [])
    } catch { setAmbassadors([]) }
    finally { setLoading(false) }
  }, [])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/campus/dashboard')
      setDashboardData(data || {})
    } catch { setDashboardData({}) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'schedule') fetchSchedules()
    else if (activeTab === 'internships') fetchInternships()
    else if (activeTab === 'ambassadors') fetchAmbassadors()
    else if (activeTab === 'dashboard') fetchDashboard()
  }, [activeTab, fetchSchedules, fetchInternships, fetchAmbassadors, fetchDashboard])

  const submitSchedule = async () => {
    setSubmitting(true)
    try {
      await api.post('/campus/schedule', scheduleForm)
      setScheduleModal(false)
      setScheduleForm({ university_name: '', event_type: '宣讲会', event_date: '', location: '', contact_person: '', description: '', attendees_count: 0, resumes_received: 0, status: 'planned' })
      fetchSchedules()
    } catch {} finally { setSubmitting(false) }
  }

  const updateScheduleStatus = async (scheduleId, status) => {
    try {
      await api.patch(`/campus/schedule/${scheduleId}`, { status })
      fetchSchedules()
    } catch {}
  }

  const submitEval = async () => {
    if (!evalTarget) return
    setSubmitting(true)
    try {
      await api.patch(`/campus/internships/${evalTarget.id}`, {
        conversion_status: evalForm.conversion_status,
        conversion_probability: evalForm.conversion_probability / 100,
        performance_rating: evalForm.performance_rating,
        mentor_feedback: evalForm.mentor_feedback,
      })
      setEvalModal(false)
      setEvalTarget(null)
      fetchInternships()
    } catch {} finally { setSubmitting(false) }
  }

  const submitAmbassador = async () => {
    setSubmitting(true)
    try {
      await api.post('/campus/ambassadors', ambassadorForm)
      setAmbassadorModal(false)
      setAmbassadorForm({ name: '', university: '', email: '', phone: '' })
      fetchAmbassadors()
    } catch {} finally { setSubmitting(false) }
  }

  const submitTask = async () => {
    setSubmitting(true)
    try {
      await api.post('/campus/ambassador-tasks', taskForm)
      setTaskModal(false)
      setTaskForm({ ambassador_id: '', task_type: 'promotion', task_title: '', description: '', deadline: '', reward_points: 0, status: 'pending' })
      fetchAmbassadors()
    } catch {} finally { setSubmitting(false) }
  }

  const openUpdateTaskModal = (task) => {
    setUpdateTaskTarget(task)
    setUpdateTaskForm({
      status: task.status || 'pending',
      actual_points: task.reward_points || 0,
    })
    setUpdateTaskModal(true)
  }

  const submitUpdateTask = async () => {
    if (!updateTaskTarget) return
    setSubmitting(true)
    try {
      await api.patch(`/campus/ambassador-tasks/${updateTaskTarget.id}`, {
        status: updateTaskForm.status,
        actual_points: updateTaskForm.actual_points,
      })
      setUpdateTaskModal(false)
      setUpdateTaskTarget(null)
      fetchAmbassadors()
    } catch {} finally { setSubmitting(false) }
  }

  const openEvalModal = (intern) => {
    setEvalTarget(intern)
    setEvalForm({
      conversion_status: intern.conversion_status || 'pending',
      conversion_probability: Math.round((intern.conversion_probability ?? 0.5) * 100),
      performance_rating: intern.performance_rating || 3,
      mentor_feedback: intern.mentor_feedback || '',
    })
    setEvalModal(true)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">校招渠道</h1>
          <p className="mt-2 text-sm text-slate-500">校招日程、实习生管理和校园大使运营</p>
        </div>
      </section>

      <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'schedule' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setScheduleModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              <Plus size={16} />
              新增日程
            </button>
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="animate-pulse p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-slate-200" />
                ))}
              </div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <Calendar size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">暂无校招日程</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">学校</th>
                      <th className="px-4 py-3 text-left font-semibold">活动类型</th>
                      <th className="px-4 py-3 text-left font-semibold">日期</th>
                      <th className="px-4 py-3 text-left font-semibold">地点</th>
                      <th className="px-4 py-3 text-left font-semibold">参会人数</th>
                      <th className="px-4 py-3 text-left font-semibold">收获简历</th>
                      <th className="px-4 py-3 text-left font-semibold">状态</th>
                      <th className="px-4 py-3 text-left font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{s.university_name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${eventTypeColor[s.event_type] || 'bg-slate-50 text-slate-500'}`}>
                            {s.event_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{s.event_date || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{s.location || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} className="text-slate-400" />
                            {s.attendees_count ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <FileText size={14} className="text-slate-400" />
                            {s.resumes_received ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${scheduleStatusColor[s.status] || 'bg-slate-50 text-slate-500'}`}>
                            {scheduleStatusLabel[s.status] || s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={s.status || ''}
                            onChange={(e) => updateScheduleStatus(s.id, e.target.value)}
                            className="text-xs rounded border border-border bg-white px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">更新状态</option>
                            <option value="planned">待举办</option>
                            <option value="ongoing">进行中</option>
                            <option value="completed">已完成</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'internships' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm h-64" />
              ))}
            </div>
          ) : internships.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <GraduationCap size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">暂无实习生数据</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {internships.map((intern) => {
                const convProb = intern.conversion_probability ?? 0
                const isHighRisk = convProb < 0.4
                const isMediumRisk = convProb >= 0.4 && convProb < 0.7
                return (
                  <div key={intern.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{intern.candidate_name || `实习生 #${intern.id}`}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{intern.university} · {intern.major}</p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${convStatusColor[intern.conversion_status] || 'bg-slate-50 text-slate-500'}`}>
                        {convStatusLabel[intern.conversion_status] || intern.conversion_status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <p>导师: {intern.mentor_name || '-'}</p>
                      <p>{intern.start_date || '?'} ~ {intern.end_date || '?'}</p>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">实习表现评分</span>
                        <Stars rating={intern.performance_rating || 0} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">转正率预测</span>
                        <span className={`font-medium ${isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {Math.round(convProb * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            convProb >= 0.7 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                            convProb >= 0.4 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${Math.round(convProb * 100)}%` }}
                        />
                      </div>
                      {isHighRisk && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 p-2">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-red-500" />
                          <p className="text-xs text-red-600">转正风险较高，建议加强辅导</p>
                        </div>
                      )}
                      {isMediumRisk && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2">
                          <TrendingUp size={12} className="mt-0.5 shrink-0 text-amber-500" />
                          <p className="text-xs text-amber-600">有转正潜力，需持续关注</p>
                        </div>
                      )}
                    </div>

                    {intern.mentor_feedback && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 mb-1">导师评价</p>
                        <p className="text-xs text-slate-700">{intern.mentor_feedback}</p>
                      </div>
                    )}

                    <button
                      onClick={() => openEvalModal(intern)}
                      className="mt-4 w-full rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      评估转正
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'ambassadors' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">大使总数</p>
                  <p className="text-xl font-bold text-slate-900">{ambassadors.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">任务完成率</p>
                  <p className="text-xl font-bold text-slate-900">
                    {ambassadors.length > 0
                      ? Math.round(
                          (ambassadors.reduce((sum, a) => sum + (a.completed_tasks ?? 0), 0) /
                            Math.max(1, ambassadors.reduce((sum, a) => sum + (a.total_tasks ?? 0), 0))) * 100
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">总发放积分</p>
                  <p className="text-xl font-bold text-slate-900">
                    {ambassadors.reduce((sum, a) => sum + (a.reward_points ?? 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAmbassadorModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              <Plus size={16} />
              注册大使
            </button>
            <button
              onClick={() => {
                setTaskForm((f) => ({ ...f, ambassador_id: '' }))
                setTaskModal(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              <Plus size={16} />
              发布任务
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm h-48" />
              ))}
            </div>
          ) : ambassadors.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <Award size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">暂无校园大使</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ambassadors.map((amb) => {
                const completionRate = amb.total_tasks > 0 ? Math.round((amb.completed_tasks ?? 0) / amb.total_tasks * 100) : 0
                return (
                  <div key={amb.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {(amb.name || '?').charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{amb.name}</h3>
                          <p className="text-xs text-slate-500">{amb.university} · {amb.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>任务 <strong className="text-slate-900">{amb.completed_tasks ?? 0}</strong>/{amb.total_tasks ?? 0}</span>
                        <span>积分 <strong className="text-amber-600">{amb.reward_points ?? 0}</strong></span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">任务完成率</span>
                        <span className="font-medium text-slate-700">{completionRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            completionRate >= 70 ? 'bg-emerald-500' :
                            completionRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {amb.tasks && amb.tasks.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-slate-500">任务列表</p>
                        {amb.tasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskTypeColor[t.task_type] || 'bg-slate-50 text-slate-500'}`}>
                                {taskTypeLabel[t.task_type] || t.task_type}
                              </span>
                              <span className="text-sm text-slate-700 truncate">{t.task_title}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-amber-600 font-medium">+{t.reward_points}积分</span>
                              <button
                                onClick={() => openUpdateTaskModal(t)}
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusColor[t.status] || 'bg-slate-50 text-slate-500'} hover:opacity-80 transition-opacity cursor-pointer`}
                              >
                                {taskStatusLabel[t.status] || t.status}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'dashboard' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm h-32" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">校招活动总数</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{dashboardData?.total_events ?? 0}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Calendar size={20} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-emerald-600">+{dashboardData?.event_growth ?? 0}%</span>
                    <span className="text-slate-400">较上月</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">累计参会人数</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{dashboardData?.total_attendees ?? 0}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-emerald-600">+{dashboardData?.attendee_growth ?? 0}%</span>
                    <span className="text-slate-400">较上月</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">收获简历总数</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{dashboardData?.total_resumes ?? 0}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <FileText size={20} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-emerald-600">+{dashboardData?.resume_growth ?? 0}%</span>
                    <span className="text-slate-400">较上月</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">实习转正率</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{dashboardData?.conversion_rate ?? 0}%</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Target size={20} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-emerald-600">+{dashboardData?.conversion_growth ?? 0}%</span>
                    <span className="text-slate-400">较上月</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">活动状态分布</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">待举办</span>
                        <span className="font-medium text-amber-600">{dashboardData?.planned_events ?? 0} 场</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${dashboardData?.planned_events_percent ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">进行中</span>
                        <span className="font-medium text-blue-600">{dashboardData?.ongoing_events ?? 0} 场</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${dashboardData?.ongoing_events_percent ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">已完成</span>
                        <span className="font-medium text-emerald-600">{dashboardData?.completed_events ?? 0} 场</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${dashboardData?.completed_events_percent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">校园大使概况</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">活跃大使</p>
                          <p className="text-lg font-bold text-slate-900">{dashboardData?.active_ambassadors ?? 0}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">总积分发放</p>
                        <p className="text-lg font-bold text-amber-600">{dashboardData?.total_points ?? 0}</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">任务整体完成率</span>
                        <span className="font-medium text-slate-700">{dashboardData?.overall_task_completion ?? 0}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                          style={{ width: `${dashboardData?.overall_task_completion ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">待开始任务</p>
                        <p className="text-lg font-bold text-slate-600">{dashboardData?.pending_tasks ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">已完成任务</p>
                        <p className="text-lg font-bold text-emerald-600">{dashboardData?.completed_tasks ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">实习生概况</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap size={16} className="text-slate-400" />
                      <span className="text-xs text-slate-500">在籍实习生</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{dashboardData?.total_interns ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span className="text-xs text-emerald-600">已转正</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{dashboardData?.converted_interns ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-amber-500" />
                      <span className="text-xs text-amber-600">评估中</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{dashboardData?.under_review_interns ?? 0}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <Modal open={scheduleModal} onClose={() => setScheduleModal(false)} title="新增日程">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">学校名称</label>
            <input
              type="text"
              value={scheduleForm.university_name}
              onChange={(e) => setScheduleForm((f) => ({ ...f, university_name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="学校名称"
            />
          </div>
          <SelectField
            label="活动类型"
            value={scheduleForm.event_type}
            onChange={(v) => setScheduleForm((f) => ({ ...f, event_type: v }))}
            options={[{ value: '宣讲会', label: '宣讲会' }, { value: '笔试', label: '笔试' }, { value: '面试日', label: '面试日' }]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">日期</label>
            <input
              type="date"
              value={scheduleForm.event_date}
              onChange={(e) => setScheduleForm((f) => ({ ...f, event_date: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">地点</label>
            <input
              type="text"
              value={scheduleForm.location}
              onChange={(e) => setScheduleForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="活动地点"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">参会人数</label>
              <input
                type="number"
                min={0}
                value={scheduleForm.attendees_count}
                onChange={(e) => setScheduleForm((f) => ({ ...f, attendees_count: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">收获简历数</label>
              <input
                type="number"
                min={0}
                value={scheduleForm.resumes_received}
                onChange={(e) => setScheduleForm((f) => ({ ...f, resumes_received: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
            </div>
          </div>
          <SelectField
            label="状态"
            value={scheduleForm.status}
            onChange={(v) => setScheduleForm((f) => ({ ...f, status: v }))}
            options={[
              { value: 'planned', label: '待举办' },
              { value: 'ongoing', label: '进行中' },
              { value: 'completed', label: '已完成' },
            ]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">联系人</label>
            <input
              type="text"
              value={scheduleForm.contact_person}
              onChange={(e) => setScheduleForm((f) => ({ ...f, contact_person: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="联系人姓名"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">描述</label>
            <textarea
              value={scheduleForm.description}
              onChange={(e) => setScheduleForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="活动描述..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setScheduleModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitSchedule}
              disabled={submitting || !scheduleForm.university_name || !scheduleForm.event_date}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={evalModal} onClose={() => setEvalModal(false)} title={`评估转正 - ${evalTarget?.candidate_name || ''}`}>
        <div className="space-y-4">
          <SelectField
            label="转正状态"
            value={evalForm.conversion_status}
            onChange={(v) => setEvalForm((f) => ({ ...f, conversion_status: v }))}
            options={[
              { value: 'pending', label: '待评估' },
              { value: 'under_review', label: '评估中' },
              { value: 'approved', label: '通过' },
              { value: 'rejected', label: '未通过' },
            ]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              转正概率: {evalForm.conversion_probability}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={evalForm.conversion_probability}
              onChange={(e) => setEvalForm((f) => ({ ...f, conversion_probability: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">实习表现评分</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEvalForm((f) => ({ ...f, performance_rating: n }))}
                  className="focus:outline-none p-1"
                >
                  <Star
                    size={24}
                    className={n <= evalForm.performance_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">导师评价</label>
            <textarea
              value={evalForm.mentor_feedback}
              onChange={(e) => setEvalForm((f) => ({ ...f, mentor_feedback: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="请输入导师对实习生的评价..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEvalModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitEval}
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '确认评估'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={ambassadorModal} onClose={() => setAmbassadorModal(false)} title="注册大使">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">姓名</label>
            <input
              type="text"
              value={ambassadorForm.name}
              onChange={(e) => setAmbassadorForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="姓名"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">学校</label>
            <input
              type="text"
              value={ambassadorForm.university}
              onChange={(e) => setAmbassadorForm((f) => ({ ...f, university: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="学校名称"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">邮箱</label>
            <input
              type="email"
              value={ambassadorForm.email}
              onChange={(e) => setAmbassadorForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="邮箱地址"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">电话</label>
            <input
              type="text"
              value={ambassadorForm.phone}
              onChange={(e) => setAmbassadorForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="手机号码"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAmbassadorModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitAmbassador}
              disabled={submitting || !ambassadorForm.name || !ambassadorForm.university}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '注册'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="发布任务">
        <div className="space-y-4">
          <SelectField
            label="大使"
            value={taskForm.ambassador_id}
            onChange={(v) => setTaskForm((f) => ({ ...f, ambassador_id: v }))}
            options={ambassadors.map((a) => ({ value: String(a.id), label: `${a.name} (${a.university})` }))}
            placeholder="-- 选择大使 --"
          />
          <SelectField
            label="任务类型"
            value={taskForm.task_type}
            onChange={(v) => setTaskForm((f) => ({ ...f, task_type: v }))}
            options={[
              { value: 'promotion', label: '推广' },
              { value: 'referral', label: '推荐' },
              { value: 'event_support', label: '活动支持' },
              { value: 'content', label: '内容' },
            ]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">任务标题</label>
            <input
              type="text"
              value={taskForm.task_title}
              onChange={(e) => setTaskForm((f) => ({ ...f, task_title: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="任务标题"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">描述</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="任务描述..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">截止日期</label>
            <input
              type="date"
              value={taskForm.deadline}
              onChange={(e) => setTaskForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">奖励积分</label>
            <input
              type="number"
              min={0}
              value={taskForm.reward_points}
              onChange={(e) => setTaskForm((f) => ({ ...f, reward_points: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setTaskModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitTask}
              disabled={submitting || !taskForm.ambassador_id || !taskForm.task_title}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '发布'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={updateTaskModal} onClose={() => setUpdateTaskModal(false)} title={`更新任务 - ${updateTaskTarget?.task_title || ''}`}>
        <div className="space-y-4">
          <SelectField
            label="任务状态"
            value={updateTaskForm.status}
            onChange={(v) => setUpdateTaskForm((f) => ({ ...f, status: v }))}
            options={[
              { value: 'pending', label: '待开始' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已完成' },
            ]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">实际奖励积分</label>
            <input
              type="number"
              min={0}
              value={updateTaskForm.actual_points}
              onChange={(e) => setUpdateTaskForm((f) => ({ ...f, actual_points: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setUpdateTaskModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitUpdateTask}
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '确认更新'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
