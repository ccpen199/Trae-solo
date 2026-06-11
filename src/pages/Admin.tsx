import { useState } from 'react'
import {
  BarChart3, Users, DollarSign, ShieldCheck, BookOpen, FileCheck,
  ChevronDown, ChevronUp, Search, AlertTriangle, CheckCircle,
  Clock, Hash, FileText,
} from 'lucide-react'
import { mockCredits, mockInspections, mockKnowledge, mockContracts } from '@/mocks/data'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const tabs = [
  { key: 'overview', label: '概览', icon: BarChart3 },
  { key: 'credit', label: '信用评级', icon: Users },
  { key: 'inspection', label: 'AI质检', icon: ShieldCheck },
  { key: 'knowledge', label: '知识库', icon: BookOpen },
  { key: 'compliance', label: '合规存证', icon: FileCheck },
]

const weeklyData = [
  { day: '周一', orders: 420 }, { day: '周二', orders: 380 },
  { day: '周三', orders: 510 }, { day: '周四', orders: 460 },
  { day: '周五', orders: 530 }, { day: '周六', orders: 620 }, { day: '周日', orders: 336 },
]

const stats = [
  { icon: BarChart3, value: '3,256', label: '总工单数', trend: '↑', pct: '12.5%', up: true },
  { icon: Users, value: '127', label: '在线工程师', trend: '↑', pct: '3.2%', up: true },
  { icon: DollarSign, value: '¥48,560', label: '今日营收', trend: '↑', pct: '8.1%', up: true },
  { icon: ShieldCheck, value: '94.2%', label: 'AI质检通过率', trend: '↓', pct: '1.3%', up: false },
]

const levelColors: Record<string, string> = {
  S: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  A: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30',
  B: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
  C: 'bg-orange-400/20 text-orange-400 border-orange-400/30',
  D: 'bg-red-400/20 text-red-400 border-red-400/30',
}

const inspStatusMap: Record<string, { color: string; label: string }> = {
  pass: { color: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30', label: '通过' },
  fail: { color: 'bg-red-400/20 text-red-400 border-red-400/30', label: '未通过' },
  pending: { color: 'bg-orange-400/20 text-orange-400 border-orange-400/30', label: '待检' },
}

const contractStatusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-navy-200/20 text-navy-200 border-navy-200/30', label: '草稿' },
  pending_sign: { color: 'bg-orange-400/20 text-orange-400 border-orange-400/30', label: '待签署' },
  signed: { color: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30', label: '已签署' },
  archived: { color: 'bg-blue-400/20 text-blue-400 border-blue-400/30', label: '已归档' },
}

const evidenceIconMap: Record<string, React.ElementType> = {
  contract: FileText, photo_before: Clock, photo_after: CheckCircle,
  signature: Hash, inspection: ShieldCheck,
}

const categoryLabels: Record<string, string> = {
  air_conditioner: '空调', water_heater: '热水器',
  washing_machine: '洗衣机', refrigerator: '冰箱', tv: '电视',
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card glass-card-hover cyber-border p-5">
            <s.icon className="w-8 h-8 text-cyber-400 mb-3" />
            <div className="text-2xl font-bold text-navy-50">{s.value}</div>
            <div className="text-sm text-navy-200 mt-1">{s.label}</div>
            <div className={`text-xs mt-2 ${s.up ? 'text-cyber-400' : 'text-warm-400'}`}>
              {s.trend} {s.pct}
            </div>
          </div>
        ))}
      </div>
      <div className="glass-card cyber-border p-5">
        <h3 className="text-lg font-semibold text-navy-50 mb-4">本周工单趋势</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <XAxis dataKey="day" stroke="#8BA3BD" fontSize={12} />
            <YAxis stroke="#8BA3BD" fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#0A2647', border: '1px solid rgba(46,242,165,0.3)', borderRadius: 8 }}
              labelStyle={{ color: '#E8EDF2' }}
            />
            <Bar dataKey="orders" fill="#2EF2A5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CreditTab() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      {mockCredits.map((c) => (
        <div key={c.engineerId} className="glass-card glass-card-hover cyber-border overflow-hidden">
          <div className="p-5 cursor-pointer flex items-center gap-4" onClick={() => setExpanded(expanded === c.engineerId ? null : c.engineerId)}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-navy-900 font-bold text-lg shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-navy-50">{c.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded border ${levelColors[c.level]}`}>{c.level}</span>
              </div>
              <div className="flex gap-4 text-xs text-navy-200 mt-1">
                <span>工单 {c.totalOrders}</span>
                <span>完成率 {c.completionRate}%</span>
                <span>评分 {c.avgRating}</span>
                <span>AI通过率 {c.aiInspectionPassRate}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-cyber-400">{c.score}</div>
            {expanded === c.engineerId ? <ChevronUp className="w-5 h-5 text-navy-200" /> : <ChevronDown className="w-5 h-5 text-navy-200" />}
          </div>
          <AnimatePresence>
            {expanded === c.engineerId && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-5 pb-5 border-t border-cyber-400/10 pt-4">
                  {c.creditHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${h.scoreChange > 0 ? 'bg-cyber-400' : 'bg-warm-400'}`} />
                      <span className="text-navy-200 w-24 shrink-0">{h.date}</span>
                      <span className="text-navy-50 flex-1">{h.event}</span>
                      <span className={h.scoreChange > 0 ? 'text-cyber-400' : 'text-warm-400'}>{h.scoreChange > 0 ? '+' : ''}{h.scoreChange}</span>
                      <span className="text-navy-200">→ {h.currentScore}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function InspectionTab() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const passCount = mockInspections.filter(i => i.status === 'pass').length
  const pendingCount = mockInspections.filter(i => i.status === 'pending').length
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="glass-card cyber-border p-4 flex-1 text-center">
          <div className="text-xl font-bold text-cyber-400">{((passCount / mockInspections.length) * 100).toFixed(0)}%</div>
          <div className="text-xs text-navy-200 mt-1">通过率</div>
        </div>
        <div className="glass-card cyber-border p-4 flex-1 text-center">
          <div className="text-xl font-bold text-navy-50">{mockInspections.length}</div>
          <div className="text-xs text-navy-200 mt-1">已质检</div>
        </div>
        <div className="glass-card cyber-border p-4 flex-1 text-center">
          <div className="text-xl font-bold text-orange-400">{pendingCount}</div>
          <div className="text-xs text-navy-200 mt-1">待检</div>
        </div>
      </div>
      <div className="flex justify-end">
        <button className="btn-primary text-sm py-2">发起抽检</button>
      </div>
      {mockInspections.map((ins) => (
        <div key={ins.id} className="glass-card glass-card-hover cyber-border overflow-hidden">
          <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => ins.status === 'fail' && setExpanded(expanded === ins.id ? null : ins.id)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-navy-50 text-sm">{ins.orderId}</span>
                <span className={`px-2 py-0.5 text-xs rounded border ${inspStatusMap[ins.status].color}`}>{inspStatusMap[ins.status].label}</span>
              </div>
              <div className="text-xs text-navy-200 mt-1">{ins.engineerName} · {ins.checkDate}</div>
            </div>
            <div className="text-xl font-bold text-navy-50">{ins.aiScore}</div>
            {ins.status === 'fail' && (expanded === ins.id ? <ChevronUp className="w-4 h-4 text-navy-200" /> : <ChevronDown className="w-4 h-4 text-navy-200" />)}
          </div>
          <AnimatePresence>
            {expanded === ins.id && ins.status === 'fail' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 border-t border-red-400/20 pt-3">
                  {ins.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 text-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                      <span className="text-warm-400">{issue}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function KnowledgeTab() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const filtered = mockKnowledge.filter(k => {
    const matchSearch = k.title.includes(search) || k.content.includes(search)
    const matchFilter = filter === 'all' || k.category === filter
    return matchSearch && matchFilter
  })
  const categories = ['all', ...new Set(mockKnowledge.map(k => k.category))]
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索知识库..." className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-600/60 border border-cyber-400/20 text-navy-50 placeholder:text-navy-300 focus:outline-none focus:border-cyber-400/50" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded text-xs border transition-all ${filter === c ? 'bg-cyber-400/20 text-cyber-400 border-cyber-400/40' : 'text-navy-200 border-navy-300/20 hover:border-cyber-400/30'}`}>
            {c === 'all' ? '全部' : categoryLabels[c] || c}
          </button>
        ))}
      </div>
      {filtered.map(k => (
        <div key={k.id} className="glass-card glass-card-hover cyber-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-navy-50 flex-1">{k.title}</h3>
            <span className="tag-cyber">{categoryLabels[k.category] || k.category}</span>
            <span className="tag-warm">{k.brand}</span>
          </div>
          <p className="text-sm text-navy-200 line-clamp-2">{k.content}</p>
          <div className="text-xs text-navy-300 mt-2">更新于 {k.lastUpdated}</div>
        </div>
      ))}
    </div>
  )
}

function ComplianceTab() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      {mockContracts.map(ct => (
        <div key={ct.id} className="glass-card glass-card-hover cyber-border overflow-hidden">
          <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded === ct.id ? null : ct.id)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-navy-50 text-sm">{ct.orderId}</span>
                <span className={`px-2 py-0.5 text-xs rounded border ${contractStatusMap[ct.status].color}`}>{contractStatusMap[ct.status].label}</span>
              </div>
              <div className="text-xs text-navy-200 mt-1">{ct.customerName} · {ct.engineerName}{ct.signedAt && ` · ${ct.signedAt}`}</div>
            </div>
            {expanded === ct.id ? <ChevronUp className="w-4 h-4 text-navy-200" /> : <ChevronDown className="w-4 h-4 text-navy-200" />}
          </div>
          <AnimatePresence>
            {expanded === ct.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 border-t border-cyber-400/10 pt-3 space-y-2">
                  {ct.evidenceChain.map((ev, i) => {
                    const EvIcon = evidenceIconMap[ev.type] || FileText
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <EvIcon className="w-4 h-4 text-cyber-400 shrink-0" />
                        <span className="text-navy-200 w-28 shrink-0">{ev.timestamp}</span>
                        <span className="text-navy-50 flex-1">{ev.description}</span>
                        <span className="text-xs text-navy-300 font-mono">{ev.hash}</span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export default function Admin() {
  const [active, setActive] = useState('overview')
  const tabComponents: Record<string, () => JSX.Element> = {
    overview: OverviewTab,
    credit: CreditTab,
    inspection: InspectionTab,
    knowledge: KnowledgeTab,
    compliance: ComplianceTab,
  }
  const ActiveComponent = tabComponents[active]
  return (
    <div className="min-h-screen bg-navy-500 grid-bg">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold gradient-text-cyber mb-6">管理后台</h1>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActive(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${active === t.key ? 'bg-cyber-400/20 text-cyber-400 border border-cyber-400/40' : 'text-navy-200 border border-transparent hover:text-navy-100'}`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
        <ActiveComponent />
      </div>
    </div>
  )
}
