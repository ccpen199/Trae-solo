import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Bell, Users, Plus, X, Loader2, Phone, Video, Hash, Sparkles, FileText, Clock, ChevronRight, User, Briefcase } from 'lucide-react'
import { api } from '../utils/api'

const TABS = [
  { key: 'comms', label: '沟通记录', icon: MessageSquare },
  { key: 'followups', label: '跟进提醒', icon: Bell },
  { key: 'clients', label: '客户管理', icon: Users },
]

const commTypeLabel = { phone: '电话', wechat: '微信', video: '视频' }
const commTypeColor = {
  phone: 'bg-blue-50 text-blue-700',
  wechat: 'bg-green-50 text-green-700',
  video: 'bg-purple-50 text-purple-700',
}
const commTypeIcon = { phone: Phone, wechat: Hash, video: Video }

const followupStatusLabel = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const followupStatusColor = {
  pending: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const priorityLabel = { high: '高', medium: '中', low: '低' }
const priorityColor = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
}

const sentimentColor = {
  positive: 'bg-emerald-50 text-emerald-700',
  neutral: 'bg-slate-50 text-slate-600',
  negative: 'bg-red-50 text-red-700',
}
const sentimentLabel = { positive: '积极', neutral: '中性', negative: '消极' }

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

export default function Headhunter() {
  const [activeTab, setActiveTab] = useState('comms')
  const [comms, setComms] = useState([])
  const [followups, setFollowups] = useState([])
  const [clients, setClients] = useState([])
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [headhunters, setHeadhunters] = useState([])
  const [loading, setLoading] = useState(true)
  const [commModal, setCommModal] = useState(false)
  const [followupModal, setFollowupModal] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [profileData, setProfileData] = useState({ comms: [], followups: [], matches: [] })
  const [submitting, setSubmitting] = useState(false)

  const [commForm, setCommForm] = useState({ headhunter_id: '', candidate_id: '', comm_type: 'phone', content: '' })
  const [followupForm, setFollowupForm] = useState({ headhunter_id: '', candidate_id: '', job_id: '', plan_text: '', scheduled_at: '', priority: 'medium' })

  useEffect(() => {
    Promise.all([
      api.get('/candidates?limit=50').catch(() => ({ items: [] })),
      api.get('/jobs?limit=50').catch(() => ({ items: [] })),
    ]).then(([cData, jData]) => {
      setCandidates((cData.items || []).map((c) => ({ value: c.id, label: c.name })))
      setJobs((jData.items || []).map((j) => ({ value: j.id, label: j.title })))
    })
  }, [])

  const fetchComms = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/headhunter/communications')
      setComms(Array.isArray(data) ? data : data.items || [])
    } catch { setComms([]) }
    finally { setLoading(false) }
  }, [])

  const fetchFollowups = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/headhunter/followups')
      setFollowups(Array.isArray(data) ? data : data.items || [])
    } catch { setFollowups([]) }
    finally { setLoading(false) }
  }, [])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/headhunter/clients')
      setClients(Array.isArray(data) ? data : data.items || [])
    } catch { setClients([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'comms') fetchComms()
    else if (activeTab === 'followups') fetchFollowups()
    else if (activeTab === 'clients') fetchClients()
  }, [activeTab, fetchComms, fetchFollowups, fetchClients])

  useEffect(() => {
    api.get('/headhunter/headhunters').then((data) => {
      const list = Array.isArray(data) ? data : data.items || []
      setHeadhunters(list.map((h) => ({ value: h.id, label: h.name || `猎头 #${h.id}` })))
    }).catch(() => {})
  }, [])

  const submitComm = async () => {
    setSubmitting(true)
    try {
      await api.post('/headhunter/communications', commForm)
      setCommModal(false)
      setCommForm({ headhunter_id: '', candidate_id: '', comm_type: 'phone', content: '' })
      fetchComms()
    } catch {} finally { setSubmitting(false) }
  }

  const submitFollowup = async () => {
    setSubmitting(true)
    try {
      await api.post('/headhunter/followups', followupForm)
      setFollowupModal(false)
      setFollowupForm({ headhunter_id: '', candidate_id: '', job_id: '', plan_text: '', scheduled_at: '' })
      fetchFollowups()
    } catch {} finally { setSubmitting(false) }
  }

  const markFollowupDone = async (id) => {
    try {
      await api.patch(`/headhunter/followups/${id}`, { status: 'completed' })
      fetchFollowups()
    } catch {}
  }

  const updateFollowupStatus = async (id, newStatus) => {
    try {
      await api.patch(`/headhunter/followups/${id}`, { status: newStatus })
      fetchFollowups()
    } catch {}
  }

  const openServiceProfile = async (candidate) => {
    setSelectedCandidate(candidate)
    setProfileModal(true)
    try {
      const cid = candidate.candidate_id || candidate.id
      const commsData = await api.get(`/headhunter/communications?candidate_id=${cid}`).catch(() => ({ items: [] }))
      const followupsData = await api.get(`/headhunter/followups?candidate_id=${cid}`).catch(() => ({ items: [] }))
      const matchesData = await api.get(`/headhunter/matches?candidate_id=${cid}`).catch(() => ({ items: [] }))
      setProfileData({
        comms: Array.isArray(commsData) ? commsData : commsData.items || [],
        followups: Array.isArray(followupsData) ? followupsData : followupsData.items || [],
        matches: Array.isArray(matchesData) ? matchesData : matchesData.items || [],
      })
    } catch {
      setProfileData({ comms: [], followups: [], matches: [] })
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">猎头工作台</h1>
          <p className="mt-2 text-sm text-slate-500">客户沟通、候选人触达和跟进提醒集中处理</p>
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

      {activeTab === 'comms' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setCommModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              <Plus size={16} />
              添加沟通
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 shadow-sm h-24" />
              ))}
            </div>
          ) : comms.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <p className="text-sm text-slate-400">暂无沟通记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comms.map((c) => {
                const CommIcon = commTypeIcon[c.comm_type] || MessageSquare
                return (
                  <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{c.headhunter_name || `猎头 #${c.headhunter_id}`}</span>
                          <span className="text-xs text-slate-400">→</span>
                          <span className="text-sm text-slate-700">{c.candidate_name || `候选人 #${c.candidate_id}`}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${commTypeColor[c.comm_type] || 'bg-slate-50 text-slate-500'}`}>
                            <CommIcon size={10} />
                            {commTypeLabel[c.comm_type] || c.comm_type}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{c.content}</p>
                        {c.summary && (
                          <div className="mt-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary border border-primary/10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
                                <Sparkles size={10} />
                                AI 摘要
                              </span>
                              {c.sentiment && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sentimentColor[c.sentiment] || 'bg-slate-50 text-slate-500'}`}>
                                  {sentimentLabel[c.sentiment] || c.sentiment}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{c.summary}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {c.sentiment && (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sentimentColor[c.sentiment] || 'bg-slate-50 text-slate-500'}`}>
                            {sentimentLabel[c.sentiment] || c.sentiment}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleString('zh-CN') : ''}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'followups' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setFollowupModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              <Plus size={16} />
              创建跟进
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 shadow-sm h-20" />
              ))}
            </div>
          ) : followups.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <p className="text-sm text-slate-400">暂无跟进提醒</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followups.map((f) => (
                <div key={f.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{f.candidate_name || `候选人 #${f.candidate_id}`}</span>
                        {f.job_title && <span className="text-sm text-slate-500">→ {f.job_title}</span>}
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${followupStatusColor[f.status] || 'bg-slate-50 text-slate-500'}`}>
                          {followupStatusLabel[f.status] || f.status}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[f.priority] || priorityColor.medium}`}>
                          {priorityLabel[f.priority] || '中'}优先级
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{f.plan_text}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {f.scheduled_at ? new Date(f.scheduled_at).toLocaleString('zh-CN') : ''}
                        </span>
                        <button
                          onClick={() => openServiceProfile({ id: f.candidate_id, candidate_name: f.candidate_name })}
                          className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
                        >
                          <FileText size={12} />
                          查看服务档案
                        </button>
                      </div>
                    </div>
                  </div>
                  {f.status !== 'completed' && f.status !== 'cancelled' && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-border">
                      {f.status === 'pending' && (
                        <button
                          onClick={() => updateFollowupStatus(f.id, 'in_progress')}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          开始处理
                        </button>
                      )}
                      {f.status === 'in_progress' && (
                        <button
                          onClick={() => updateFollowupStatus(f.id, 'completed')}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          标记完成
                        </button>
                      )}
                      <button
                        onClick={() => updateFollowupStatus(f.id, 'cancelled')}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'clients' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm h-32" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <p className="text-sm text-slate-400">暂无客户数据</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {clients.map((cl) => (
                <div key={cl.id || cl.candidate_id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {(cl.candidate_name || cl.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{cl.candidate_name || cl.name || `候选人 #${cl.candidate_id}`}</h3>
                      {cl.last_communication_at && (
                        <p className="truncate text-xs text-slate-400">最后沟通: {new Date(cl.last_communication_at).toLocaleDateString('zh-CN')}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm text-slate-500">
                    <span>沟通 <strong className="text-slate-900">{cl.communication_count ?? 0}</strong> 次</span>
                    <span>跟进 <strong className="text-slate-900">{cl.followup_count ?? 0}</strong> 次</span>
                  </div>
                  {cl.latest_followup_summary && (
                    <div className="mt-3 rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">最近跟进</p>
                      <p className="text-sm text-slate-700 line-clamp-2">{cl.latest_followup_summary}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      onClick={() => openServiceProfile(cl)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <FileText size={14} />
                      查看服务档案
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={commModal} onClose={() => setCommModal(false)} title="添加沟通记录">
        <div className="space-y-4">
          <SelectField label="猎头" value={commForm.headhunter_id} onChange={(v) => setCommForm((f) => ({ ...f, headhunter_id: v }))} options={headhunters} placeholder="-- 选择猎头 --" />
          <SelectField label="候选人" value={commForm.candidate_id} onChange={(v) => setCommForm((f) => ({ ...f, candidate_id: v }))} options={candidates} placeholder="-- 选择候选人 --" />
          <SelectField
            label="沟通方式"
            value={commForm.comm_type}
            onChange={(v) => setCommForm((f) => ({ ...f, comm_type: v }))}
            options={[{ value: 'phone', label: '电话' }, { value: 'wechat', label: '微信' }, { value: 'video', label: '视频' }]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">沟通内容</label>
            <textarea
              value={commForm.content}
              onChange={(e) => setCommForm((f) => ({ ...f, content: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="记录沟通内容..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCommModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitComm}
              disabled={submitting || !commForm.candidate_id || !commForm.content}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={followupModal} onClose={() => setFollowupModal(false)} title="创建跟进提醒">
        <div className="space-y-4">
          <SelectField label="猎头" value={followupForm.headhunter_id} onChange={(v) => setFollowupForm((f) => ({ ...f, headhunter_id: v }))} options={headhunters} placeholder="-- 选择猎头 --" />
          <SelectField label="候选人" value={followupForm.candidate_id} onChange={(v) => setFollowupForm((f) => ({ ...f, candidate_id: v }))} options={candidates} placeholder="-- 选择候选人 --" />
          <SelectField label="职位" value={followupForm.job_id} onChange={(v) => setFollowupForm((f) => ({ ...f, job_id: v }))} options={jobs} placeholder="-- 选择职位 --" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">跟进计划</label>
            <textarea
              value={followupForm.plan_text}
              onChange={(e) => setFollowupForm((f) => ({ ...f, plan_text: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="描述跟进计划..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">计划时间</label>
            <input
              type="datetime-local"
              value={followupForm.scheduled_at}
              onChange={(e) => setFollowupForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <SelectField
            label="优先级"
            value={followupForm.priority}
            onChange={(v) => setFollowupForm((f) => ({ ...f, priority: v }))}
            options={[{ value: 'high', label: '高优先级' }, { value: 'medium', label: '中优先级' }, { value: 'low', label: '低优先级' }]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setFollowupModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitFollowup}
              disabled={submitting || !followupForm.candidate_id || !followupForm.plan_text}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={profileModal} onClose={() => setProfileModal(false)} title="服务档案">
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="mb-6 flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base">
              {(selectedCandidate?.candidate_name || selectedCandidate?.name || '?').charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{selectedCandidate?.candidate_name || selectedCandidate?.name || '候选人'}</h4>
              <p className="text-sm text-slate-500">候选人服务档案</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <MessageSquare size={16} className="text-primary" />
                沟通历史时间线
              </h5>
              {profileData.comms.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">暂无沟通记录</p>
              ) : (
                <div className="relative pl-4 space-y-4">
                  <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-border" />
                  {profileData.comms.map((c) => {
                    const CommIcon = commTypeIcon[c.comm_type] || MessageSquare
                    return (
                      <div key={c.id} className="relative">
                        <div className="absolute -left-[22px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                          <CommIcon size={10} />
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${commTypeColor[c.comm_type] || 'bg-slate-50 text-slate-500'}`}>
                              {commTypeLabel[c.comm_type] || c.comm_type}
                            </span>
                            {c.sentiment && (
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sentimentColor[c.sentiment] || 'bg-slate-50 text-slate-500'}`}>
                                {sentimentLabel[c.sentiment] || c.sentiment}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleString('zh-CN') : ''}</span>
                          </div>
                          <p className="text-sm text-slate-700">{c.content}</p>
                          {c.summary && (
                            <div className="mt-2 rounded-md bg-primary/5 px-2 py-1.5 text-xs text-primary border border-primary/10">
                              <span className="inline-flex items-center gap-1 mr-2">
                                <Sparkles size={10} />
                                AI摘要
                              </span>
                              {c.summary}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <Bell size={16} className="text-primary" />
                跟进记录
              </h5>
              {profileData.followups.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">暂无跟进记录</p>
              ) : (
                <div className="space-y-2">
                  {profileData.followups.map((f) => (
                    <div key={f.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${followupStatusColor[f.status] || 'bg-slate-50 text-slate-500'}`}>
                          {followupStatusLabel[f.status] || f.status}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[f.priority] || priorityColor.medium}`}>
                          {priorityLabel[f.priority] || '中'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{f.plan_text}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        计划时间: {f.scheduled_at ? new Date(f.scheduled_at).toLocaleString('zh-CN') : '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <Briefcase size={16} className="text-primary" />
                匹配推荐记录
              </h5>
              {profileData.matches.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">暂无匹配推荐记录</p>
              ) : (
                <div className="space-y-2">
                  {profileData.matches.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{m.job_title || `职位 #${m.job_id}`}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                          m.status === 'rejected' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {m.status === 'accepted' ? '已接受' : m.status === 'rejected' ? '已拒绝' : '待反馈'}
                        </span>
                      </div>
                      {m.created_at && (
                        <p className="text-xs text-slate-400 mt-1">推荐时间: {new Date(m.created_at).toLocaleDateString('zh-CN')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
