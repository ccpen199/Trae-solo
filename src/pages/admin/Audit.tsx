import { useState, useEffect } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { api } from '@/utils/api'
import type { AuditRecord } from '@/types'

const STAGES = [
  { key: 'initial', label: '初审' },
  { key: 'review', label: '复审' },
  { key: 'top_recommend', label: '置顶推荐' },
] as const

interface QueueItem {
  id: string; title: string; category: string; region: string; riskScore: number; description: string; price?: number; sensitiveWords: string[]
}

const mockQueue: QueueItem[] = [
  { id: '1', title: '高薪招聘网络兼职日入500', category: '求职招聘', region: '北京市', riskScore: 82, description: '在家即可轻松赚钱，日入500+', sensitiveWords: ['虚假投资', '高薪'] },
  { id: '2', title: '朝阳区精装两室出租', category: '房屋出租', region: '北京市朝阳区', riskScore: 15, description: '紧邻地铁，精装修拎包入住', sensitiveWords: [] },
  { id: '3', title: '二手iPhone15低价出售', category: '二手物品', region: '上海市', riskScore: 45, description: '95新iPhone15 Pro Max', sensitiveWords: ['低价'] },
  { id: '4', title: '投资理财年化收益30%', category: '招商加盟', region: '深圳市', riskScore: 91, description: '保本保息年化30%收益', sensitiveWords: ['投资理财', '保本保息'] },
  { id: '5', title: '专业家政服务预约', category: '本地服务', region: '广州市', riskScore: 8, description: '提供专业家政保洁服务', sensitiveWords: [] },
]

const mockChart = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 6 + i)
  return { date: d.toISOString().slice(5, 10), approved: Math.floor(Math.random() * 40 + 30), rejected: Math.floor(Math.random() * 15 + 5) }
})

export default function Audit() {
  const [stats, setStats] = useState({ pending: 0, reviewing: 0, approved: 0, rejected: 0 })
  const [stage, setStage] = useState<string>('initial')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [chartData, setChartData] = useState(mockChart)

  useEffect(() => {
    api.audit.stats().then(d => setStats({ pending: d.pending, reviewing: d.total - d.approved - d.rejected - d.pending, approved: d.approved, rejected: d.rejected })).catch(() => {
      setStats({ pending: 128, reviewing: 56, approved: 1842, rejected: 324 })
    })
    setChartData(mockChart)
  }, [])

  const selectedItem = mockQueue.find(q => q.id === selectedId)

  const statCards = [
    { label: '待初审', count: stats.pending, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: '待复审', count: stats.reviewing, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: '已通过', count: stats.approved, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: '已驳回', count: stats.rejected, color: 'bg-red-50 text-red-700 border-red-200' },
  ]

  const handleAction = (result: string) => {
    if (!selectedId) return
    api.audit.action(selectedId, { result, comment }).catch(() => {})
    setComment('')
    setSelectedId(null)
  }

  const riskColor = (score: number) => score >= 80 ? 'text-red-500' : score >= 50 ? 'text-amber-500' : 'text-emerald-500'
  const riskBg = (score: number) => score >= 80 ? 'border-red-300 bg-red-50' : score >= 50 ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="w-8 h-8 text-navy-800" />
        <h1 className="text-2xl font-bold text-navy-800">分级审核管理</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className={`card p-4 border ${s.color}`}>
            <div className="text-sm opacity-80">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.count}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {STAGES.map(s => (
          <button key={s.key} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${stage === s.key ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setStage(s.key)}>{s.label}</button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="w-1/2 card p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-navy-800 mb-3">审核队列</h3>
          <div className="space-y-2">
            {mockQueue.map(item => (
              <div key={item.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedId === item.id ? 'bg-navy-50 border-navy-300' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => setSelectedId(item.id)}>
                <p className="text-sm font-medium truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-info">{item.category}</span>
                  <span className="text-xs text-slate-500">{item.region}</span>
                  <span className={`text-xs font-bold ml-auto ${riskColor(item.riskScore)}`}>{item.riskScore}分</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/2 card p-4">
          <h3 className="font-semibold text-navy-800 mb-3">帖子详情</h3>
          {selectedItem ? (
            <div>
              <h4 className="font-semibold text-lg mb-2">{selectedItem.title}</h4>
              <p className="text-sm text-slate-600 mb-3">{selectedItem.description}</p>
              {selectedItem.price && <p className="text-sm mb-2"><span className="text-slate-500">价格：</span><span className="text-accent-500 font-bold">¥{selectedItem.price}</span></p>}
              <p className="text-sm mb-3"><span className="text-slate-500">地区：</span>{selectedItem.region}</p>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${riskBg(selectedItem.riskScore)}`}>
                  <span className={`text-xl font-bold ${riskColor(selectedItem.riskScore)}`}>{selectedItem.riskScore}</span>
                </div>
                <span className="text-sm text-slate-500">风险评分</span>
              </div>
              {selectedItem.sensitiveWords.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm text-slate-500">敏感词：</span>
                  {selectedItem.sensitiveWords.map(w => <span key={w} className="badge badge-danger ml-1">{w}</span>)}
                </div>
              )}
              <textarea className="input-field mb-3" rows={2} placeholder="审核备注..." value={comment} onChange={e => setComment(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn-primary text-sm" onClick={() => handleAction('approved')}>通过</button>
                <button className="btn-danger text-sm" onClick={() => handleAction('rejected')}>驳回</button>
                <button className="btn-outline text-sm" onClick={() => handleAction('flagged')}>标记</button>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">请从左侧选择待审核帖子</p>
          )}
        </div>
      </div>

      <div className="card p-4 mt-6">
        <h2 className="font-semibold text-navy-800 mb-3">审核统计</h2>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" name="通过" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="驳回" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
