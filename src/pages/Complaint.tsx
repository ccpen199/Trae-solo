import React, { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, Search, Clock, UserX, HelpCircle, Building2, AlertOctagon,
  Plus, X, Upload, CheckCircle2,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import type { ComplaintTicket } from '../../shared/types'

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待分派' },
  { key: 'assigned', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' },
] as const

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
  damage: { icon: AlertTriangle, label: '破损', cls: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  lost: { icon: Search, label: '丢失', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
  delay: { icon: Clock, label: '延误', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
  service: { icon: UserX, label: '服务', cls: 'bg-purple-500/15 text-purple-400 border border-purple-500/20' },
  other: { icon: HelpCircle, label: '其他', cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待分派', assigned: '已分派', processing: '处理中', resolved: '已解决', closed: '已关闭',
}

const TIMELINE_STEPS = ['pending', 'assigned', 'processing', 'resolved', 'closed']

type CreateForm = {
  waybillNo: string; type: string; description: string; evidence: string
}

const emptyForm: CreateForm = { waybillNo: '', type: 'damage', description: '', evidence: '' }

function SlaIndicator({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(0)
  const totalSla = 48 * 3600 * 1000

  const calc = useCallback(() => {
    const diff = new Date(deadline).getTime() - Date.now()
    setRemaining(Math.max(0, diff))
  }, [deadline])

  useEffect(() => { calc(); const t = setInterval(calc, 60000); return () => clearInterval(t) }, [calc])

  const pct = Math.min(1, remaining / totalSla)
  const overdue = remaining <= 0
  const color = overdue ? 'red' : pct > 0.5 ? 'emerald' : pct > 0.25 ? 'amber' : 'red'
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  const fmtTime = (ms: number) => {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `剩余 ${h}h ${m}m`
  }

  if (overdue) {
    return (
      <div className="flex flex-col items-center gap-1 animate-pulse">
        <AlertOctagon className="w-6 h-6 text-red-500" />
        <span className="text-xs font-medium text-red-400">已超时</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-800" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className={color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : 'text-red-400'}
        />
      </svg>
      <span className={`text-[10px] font-mono-num ${color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>
        {fmtTime(remaining)}
      </span>
    </div>
  )
}

export default function ComplaintPage() {
  const [list, setList] = useState<ComplaintTicket[]>([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<{ branch: string; sla: string } | null>(null)

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/complaint?${params}`)
      const data = await res.json()
      setList(Array.isArray(data) ? data : data.records ?? [])
    } catch { setList([]) }
  }, [status, search])

  useEffect(() => { fetchList() }, [fetchList])

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setCreateResult({ branch: data.assignedBranch, sla: data.slaDeadline })
      fetchList()
    } catch {}
  }

  const closeCreate = () => { setShowCreate(false); setForm(emptyForm); setCreateResult(null) }

  const set = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const stepIdx = (s: string) => TIMELINE_STEPS.indexOf(s)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />新建工单
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input-field w-64 pl-9" placeholder="搜索运单号、描述..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              status === tab.key ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.length === 0 && <div className="card text-center py-10 text-slate-500">暂无投诉工单</div>}
        {list.map((t) => {
          const cfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.other
          const Icon = cfg.icon
          const isExpanded = expanded === t.id
          return (
            <div key={t.id} className={`card-hover cursor-pointer ${isExpanded ? '!border-amber-500/40' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : t.id)}>
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${cfg.cls}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    <span className="font-mono-num text-sm text-slate-200">{t.waybillNo}</span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{t.description}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{t.assignedBranch || '待分派'}</span>
                    <span>{new Date(t.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={t.status} label={STATUS_LABELS[t.status] ?? t.status} />
                  <SlaIndicator deadline={t.slaDeadline} />
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-slide-up">
                  <p className="text-sm text-slate-300">{t.description}</p>
                  <div className="flex items-center gap-2">
                    {TIMELINE_STEPS.map((s, i) => (
                      <React.Fragment key={s}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${i <= stepIdx(t.status) ? 'bg-amber-500' : 'bg-slate-700'}`} />
                          <span className="text-[10px] text-slate-500">{STATUS_LABELS[s]}</span>
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 ${i < stepIdx(t.status) ? 'bg-amber-500' : 'bg-slate-700'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  {t.status === 'resolved' && (
                    <div className="flex justify-end">
                      <button className="btn-primary flex items-center gap-1.5" onClick={(e) => { e.stopPropagation() }}>
                        <CheckCircle2 className="w-4 h-4" />确认处理
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeCreate}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">新建工单</h3>
              <button onClick={closeCreate} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            {createResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-slate-200">工单创建成功</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3"><p className="text-xs text-slate-500">分派网点</p><p className="text-sm text-slate-200 flex items-center gap-1 mt-1"><Building2 className="w-3.5 h-3.5 text-amber-500" />{createResult.branch}</p></div>
                  <div className="bg-slate-800 rounded-lg p-3"><p className="text-xs text-slate-500">SLA 截止</p><p className="text-sm text-slate-200 font-mono-num mt-1">{new Date(createResult.sla).toLocaleString('zh-CN')}</p></div>
                </div>
                <button className="btn-primary w-full" onClick={closeCreate}>确定</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input className="input-field w-full" placeholder="运单号" value={form.waybillNo} onChange={set('waybillNo')} />
                <select className="input-field w-full" value={form.type} onChange={set('type')}>
                  <option value="damage">破损</option>
                  <option value="lost">丢失</option>
                  <option value="delay">延误</option>
                  <option value="service">服务</option>
                  <option value="other">其他</option>
                </select>
                <textarea className="input-field w-full min-h-[80px]" placeholder="问题描述" value={form.description} onChange={set('description')} />
                <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-amber-500/50 transition-colors">
                  <Upload className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                  <p className="text-xs text-slate-500">上传证据文件</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn-secondary" onClick={closeCreate}>取消</button>
                  <button className="btn-primary" onClick={handleCreate}>提交</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
