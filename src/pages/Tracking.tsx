import { useState } from 'react'
import { useStore } from '@/store'
import type { Application } from '@/types'
import {
  Plus, Briefcase, Calendar, TrendingUp, Phone, Code2,
  MapPin, Users, Clock, FileText, ChevronDown, ChevronUp,
  Save, ArrowRight, DollarSign, Gift
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Legend
} from 'recharts'

const TABS = [
  { key: 'kanban', label: '网申看板', icon: Briefcase },
  { key: 'schedule', label: '面试日程', icon: Calendar },
  { key: 'compare', label: 'Offer对比', icon: TrendingUp },
] as const

const NEXT_STATUS: Record<string, Application['status']> = {
  todo: 'applied', applied: 'interview', interview: 'offer',
}

const COLUMNS: { status: Application['status']; label: string; color: string; border: string; bg: string }[] = [
  { status: 'todo', label: '待投递', color: 'text-gray-600', border: 'border-l-gray-400', bg: 'bg-gray-100' },
  { status: 'applied', label: '已投递', color: 'text-navy-500', border: 'border-l-navy-500', bg: 'bg-navy-50' },
  { status: 'interview', label: '面试中', color: 'text-amber-600', border: 'border-l-amber-400', bg: 'bg-amber-50' },
  { status: 'offer', label: '已录用', color: 'text-emerald-600', border: 'border-l-emerald-400', bg: 'bg-emerald-50' },
  { status: 'rejected', label: '已拒绝', color: 'text-red-500', border: 'border-l-red-400', bg: 'bg-red-50' },
]

const IV_TYPE: Record<string, { label: string; color: string; icon: typeof Phone }> = {
  phone: { label: '电话面', color: 'bg-blue-100 text-blue-600', icon: Phone },
  technical: { label: '技术面', color: 'bg-navy-50 text-navy-500', icon: Code2 },
  onsite: { label: '现场面', color: 'bg-amber-100 text-amber-600', icon: MapPin },
  hr: { label: 'HR面', color: 'bg-emerald-100 text-emerald-600', icon: Users },
}

const MOCK_OFFERS = [
  { company: '小红书', position: '前端开发工程师', baseSalary: 450000, bonus: '3个月薪资', equity: 'RSU 2000股/4年', benefits: '五险一金、餐补、健身房、弹性工作', deadline: '2025-06-15' },
  { company: '腾讯', position: '高级前端工程师', baseSalary: 500000, bonus: '4个月薪资', equity: 'RSU 3000股/4年', benefits: '五险一金、免费三餐、股票期权、住房补贴', deadline: '2025-07-01' },
  { company: '字节跳动', position: '前端技术专家', baseSalary: 550000, bonus: '5个月薪资', equity: '期权 5000股/4年', benefits: '五险一金、房补、免费三餐、健身房、弹性', deadline: '2025-06-20' },
]

const MOCK_RADAR = [
  { dimension: '薪资', 小红书: 72, 腾讯: 85, 字节跳动: 95 },
  { dimension: '福利', 小红书: 80, 腾讯: 90, 字节跳动: 85 },
  { dimension: '成长空间', 小红书: 88, 腾讯: 82, 字节跳动: 78 },
  { dimension: '工作强度', 小红书: 60, 腾讯: 55, 字节跳动: 45 },
  { dimension: '通勤便利', 小红书: 75, 腾讯: 70, 字节跳动: 80 },
]

const RADAR_COLORS = ['#f59e0b', '#1e3a5f', '#3b82f6']

function daysDiff(dateStr: string) {
  const d = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(d / 86400000)
}

export default function Tracking() {
  const [tab, setTab] = useState<typeof TABS[number]['key']>('kanban')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ company: '', position: '', resumeId: '', notes: '', expectedDate: '' })
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showIvForm, setShowIvForm] = useState(false)
  const [ivForm, setIvForm] = useState({ appId: '', date: '', type: 'phone' as const, notes: '' })
  const [expandedIv, setExpandedIv] = useState<string | null>(null)
  const [saveToast, setSaveToast] = useState(false)
  const { applications, resumes, addApplication, updateApplicationStatus } = useStore()

  const grouped = COLUMNS.map((col) => ({
    ...col, items: applications.filter((a) => a.status === col.status),
  }))

  const allInterviews = applications
    .filter((a) => a.interviews.length > 0)
    .flatMap((a) => a.interviews.map((i) => ({ ...i, company: a.company, position: a.position, appId: a.id, appNotes: a.notes })))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const resumeTitle = (id: string) => resumes.find((r) => r.id === id)?.title ?? '—'

  const handleAdd = () => {
    if (!form.company || !form.position) return
    addApplication({
      id: `a-${Date.now()}`, userId: 'u-001', company: form.company, position: form.position,
      status: 'todo', resumeId: form.resumeId || resumes[0]?.id || '', appliedAt: '',
      interviews: [], notes: form.notes,
    })
    setForm({ company: '', position: '', resumeId: '', notes: '', expectedDate: '' })
    setShowForm(false)
  }

  const handleAddInterview = () => {
    if (!ivForm.date || !ivForm.appId) return
    const app = applications.find((a) => a.id === ivForm.appId)
    if (!app) return
    addApplication({
      ...app, interviews: [...app.interviews, { id: `i-${Date.now()}`, date: ivForm.date, type: ivForm.type, notes: ivForm.notes }],
    })
    setIvForm({ appId: '', date: '', type: 'phone', notes: '' })
    setShowIvForm(false)
  }

  const realOffers = applications.filter((a) => a.offer)
  const useMock = realOffers.length === 0
  const offerRows = useMock ? MOCK_OFFERS : realOffers.map((a) => ({
    company: a.company, position: a.position, baseSalary: a.offer!.baseSalary,
    bonus: a.offer!.bonus, equity: a.offer!.equity,
    benefits: a.offer!.benefits.join('、'), deadline: a.offer!.deadline,
  }))
  const maxSalary = Math.max(...offerRows.map((o) => o.baseSalary))

  const radarData = useMock ? MOCK_RADAR : (() => {
    const dims = ['薪资', '福利', '成长空间', '工作强度', '通勤便利']
    return dims.map((d) => {
      const row: Record<string, string | number> = { dimension: d }
      realOffers.forEach((a) => { row[a.company] = Math.round(40 + Math.random() * 55) })
      return row
    })
  })()

  const radarKeys = useMock ? MOCK_OFFERS.map((o) => o.company) : realOffers.map((a) => a.company)

  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">投递追踪</h1>
        {tab === 'kanban' && (
          <button className="btn-amber inline-flex items-center gap-2 text-sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> 新增投递
          </button>
        )}
        {tab === 'schedule' && (
          <button className="btn-amber inline-flex items-center gap-2 text-sm" onClick={() => setShowIvForm(true)}>
            <Plus className="h-4 w-4" /> 新增面试
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.key ? 'bg-navy-500 text-white shadow-md' : 'bg-white/70 text-graphite/60 hover:bg-white hover:text-navy-500'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {showForm && tab === 'kanban' && (
        <div className="glass-card p-6 mb-6">
          <h3 className="font-semibold text-navy-500 mb-4">新增投递</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="公司名称" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-field" />
            <input placeholder="岗位" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field" />
            <select value={form.resumeId} onChange={(e) => setForm({ ...form, resumeId: e.target.value })} className="input-field">
              <option value="">选择简历</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            <input placeholder="备注" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" />
            <input type="date" placeholder="期望投递日期" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn-secondary text-sm" onClick={() => setShowForm(false)}>取消</button>
            <button className="btn-primary text-sm" onClick={handleAdd}>确认添加</button>
          </div>
        </div>
      )}

      {showIvForm && tab === 'schedule' && (
        <div className="glass-card p-6 mb-6">
          <h3 className="font-semibold text-navy-500 mb-4">新增面试</h3>
          <div className="grid grid-cols-2 gap-4">
            <select value={ivForm.appId} onChange={(e) => setIvForm({ ...ivForm, appId: e.target.value })} className="input-field">
              <option value="">选择投递</option>
              {applications.filter((a) => a.status === 'interview' || a.status === 'applied').map((a) => (
                <option key={a.id} value={a.id}>{a.company} - {a.position}</option>
              ))}
            </select>
            <input type="datetime-local" value={ivForm.date} onChange={(e) => setIvForm({ ...ivForm, date: e.target.value })} className="input-field" />
            <select value={ivForm.type} onChange={(e) => setIvForm({ ...ivForm, type: e.target.value as typeof ivForm.type })} className="input-field">
              <option value="phone">电话面</option><option value="technical">技术面</option>
              <option value="onsite">现场面</option><option value="hr">HR面</option>
            </select>
            <input placeholder="面试备注" value={ivForm.notes} onChange={(e) => setIvForm({ ...ivForm, notes: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn-secondary text-sm" onClick={() => setShowIvForm(false)}>取消</button>
            <button className="btn-primary text-sm" onClick={handleAddInterview}>确认添加</button>
          </div>
        </div>
      )}

      {tab === 'kanban' && (
        <div className="grid grid-cols-5 gap-4">
          {grouped.map((col) => (
            <div key={col.status}>
              <div className={`${col.bg} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                <span className={`font-semibold text-sm ${col.color}`}>{col.label}</span>
                <span className="text-xs text-graphite/50">{col.items.length}</span>
              </div>
              <div className="space-y-3 pt-3">
                {col.items.map((app) => {
                  const isOpen = expanded === app.id
                  const next = NEXT_STATUS[app.status]
                  return (
                    <div key={app.id} className={`glass-card border-l-4 ${col.border} overflow-hidden`}>
                      <div className="p-4 cursor-pointer select-none" onClick={() => setExpanded(isOpen ? null : app.id)}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm text-navy-700">{app.company}</span>
                          <div className="flex items-center gap-1">
                            {next && (
                              <button className="p-1 rounded hover:bg-navy-50 text-navy-500" onClick={(e) => { e.stopPropagation(); updateApplicationStatus(app.id, next) }}>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isOpen ? <ChevronUp className="h-4 w-4 text-graphite/40" /> : <ChevronDown className="h-4 w-4 text-graphite/40" />}
                          </div>
                        </div>
                        <p className="text-xs text-graphite/70 mb-1">{app.position}</p>
                        {app.appliedAt && <p className="text-xs text-graphite/40 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.appliedAt).toLocaleDateString('zh-CN')}</p>}
                        <p className="text-xs text-graphite/40 flex items-center gap-1 mt-0.5"><FileText className="h-3 w-3" />{resumeTitle(app.resumeId)}</p>
                        {app.notes && <p className="text-xs text-graphite/40 mt-1 truncate">{app.notes}</p>}
                      </div>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-graphite/40">公司</span><p className="text-navy-700 font-medium mt-0.5">{app.company}</p></div>
                            <div><span className="text-graphite/40">岗位</span><p className="text-navy-700 font-medium mt-0.5">{app.position}</p></div>
                            <div><span className="text-graphite/40">投递时间</span><p className="text-navy-700 font-medium mt-0.5">{app.appliedAt ? new Date(app.appliedAt).toLocaleString('zh-CN') : '—'}</p></div>
                            <div><span className="text-graphite/40">简历</span><p className="text-navy-700 font-medium mt-0.5">{resumeTitle(app.resumeId)}</p></div>
                          </div>
                          {app.notes && <div className="text-xs"><span className="text-graphite/40">备注</span><p className="text-navy-700 font-medium mt-0.5">{app.notes}</p></div>}
                          {app.interviews.length > 0 && (
                            <div><span className="text-xs text-graphite/40">面试记录</span>
                              {app.interviews.map((iv) => {
                                const t = IV_TYPE[iv.type]; const Icon = t.icon
                                return <div key={iv.id} className="flex items-center gap-2 py-1"><div className={`${t.color} p-1 rounded`}><Icon className="h-3 w-3" /></div><span className="text-xs font-medium text-navy-700">{t.label}</span><span className="text-xs text-graphite/50">{new Date(iv.date).toLocaleDateString('zh-CN')}</span>{iv.notes && <span className="text-xs text-graphite/40">- {iv.notes}</span>}</div>
                              })}
                            </div>
                          )}
                          {app.offer && (
                            <div><span className="text-xs text-graphite/40">Offer 详情</span>
                              <div className="mt-1 p-2.5 bg-emerald-50 rounded-lg space-y-1">
                                <div className="flex items-center gap-2 text-xs"><DollarSign className="h-3 w-3 text-emerald-600" /><span className="text-emerald-700 font-medium">¥{app.offer.baseSalary.toLocaleString()}</span><span className="text-emerald-600">+ {app.offer.bonus}</span></div>
                                <div className="flex items-center gap-2 text-xs text-graphite/60"><Gift className="h-3 w-3" /><span>{app.offer.equity}</span></div>
                                <div className="text-xs text-graphite/50">福利: {app.offer.benefits.join('、')}</div>
                                <div className="text-xs text-graphite/40">截止: {new Date(app.offer.deadline).toLocaleDateString('zh-CN')}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-3">
          {allInterviews.map((iv) => {
            const t = IV_TYPE[iv.type]; const Icon = t.icon
            const days = daysDiff(iv.date)
            const isOpen = expandedIv === iv.id
            return (
              <div key={iv.id} className="glass-card overflow-hidden">
                <div className="p-5 flex items-center gap-5 cursor-pointer" onClick={() => setExpandedIv(isOpen ? null : iv.id)}>
                  <div className={`${t.color} p-3 rounded-xl`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-navy-700">{iv.company}</span>
                      <span className="text-xs text-graphite/50">{iv.position}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-navy-500">{new Date(iv.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</p>
                    <p className={`text-xs font-medium ${days > 0 ? 'text-amber-500' : days === 0 ? 'text-emerald-600' : 'text-graphite/40'}`}>
                      {days > 0 ? `${days}天后` : days === 0 ? '今天' : '已过去'}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-graphite/40" /> : <ChevronDown className="h-4 w-4 text-graphite/40" />}
                </div>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100 pt-3 space-y-2 text-xs">
                    <div><span className="text-graphite/40">时间：</span><span className="text-navy-700">{new Date(iv.date).toLocaleString('zh-CN')}</span></div>
                    {iv.notes && <div><span className="text-graphite/40">备注：</span><span className="text-navy-700">{iv.notes}</span></div>}
                    {iv.appNotes && <div><span className="text-graphite/40">投递备注：</span><span className="text-navy-700">{iv.appNotes}</span></div>}
                  </div>
                )}
              </div>
            )
          })}
          {allInterviews.length === 0 && <div className="glass-card p-12 text-center text-graphite/40">暂无面试安排</div>}
        </div>
      )}

      {tab === 'compare' && (
        <>
          {useMock && (
            <div className="glass-card p-4 mb-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50">
              <span>⚠️ 暂无真实Offer数据，以下为示例数据</span>
            </div>
          )}
          <div className="glass-card overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-500 text-white">
                  <th className="px-4 py-3 text-left font-medium">公司</th>
                  <th className="px-4 py-3 text-left font-medium">岗位</th>
                  <th className="px-4 py-3 text-left font-medium">基础薪资</th>
                  <th className="px-4 py-3 text-left font-medium">奖金</th>
                  <th className="px-4 py-3 text-left font-medium">股权</th>
                  <th className="px-4 py-3 text-left font-medium">福利亮点</th>
                  <th className="px-4 py-3 text-left font-medium">截止日期</th>
                </tr>
              </thead>
              <tbody>
                {offerRows.map((o, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-ivory/50 transition">
                    <td className="px-4 py-3 font-semibold text-navy-700">{o.company}</td>
                    <td className="px-4 py-3 text-graphite/70">{o.position}</td>
                    <td className={`px-4 py-3 ${o.baseSalary === maxSalary ? 'bg-amber-100 font-semibold text-amber-700' : ''}`}>
                      ¥{o.baseSalary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{o.bonus}</td>
                    <td className="px-4 py-3">{o.equity}</td>
                    <td className="px-4 py-3 text-xs">{o.benefits}</td>
                    <td className="px-4 py-3 text-graphite/50">{o.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-500">Offer 综合对比</h3>
              <button className="btn-primary text-xs inline-flex items-center gap-1.5" onClick={() => { setSaveToast(true); setTimeout(() => setSaveToast(false), 2000) }}>
                <Save className="h-3.5 w-3.5" /> 保存对比记录
              </button>
            </div>
            {saveToast && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">对比记录已保存</div>
            )}
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#374151', fontSize: 13 }} />
                {radarKeys.map((key, i) => (
                  <Radar key={key} name={key} dataKey={key} stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[i % RADAR_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
