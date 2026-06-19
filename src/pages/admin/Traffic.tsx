import { useState, useEffect } from 'react'
import { BarChart3, Eye, Phone, ShoppingCart, Percent, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { api } from '@/utils/api'
import { CATEGORIES, type FunnelData, type TimeSeriesPoint } from '@/types'

interface KpiItem { label: string; value: string; trend: number; icon: React.ReactNode }

const FUNNEL_STEPS = [
  { key: 'views' as const, label: '浏览', color: 'bg-navy-800' },
  { key: 'clicks' as const, label: '点击', color: 'bg-navy-600' },
  { key: 'leads' as const, label: '留资', color: 'bg-accent-500' },
  { key: 'conversions' as const, label: '成交', color: 'bg-emerald-500' },
]

export default function Traffic() {
  const [viewsTrend, setViewsTrend] = useState<TimeSeriesPoint[]>([])
  const [leadsTrend, setLeadsTrend] = useState<TimeSeriesPoint[]>([])
  const [funnel, setFunnel] = useState<FunnelData>({ views: 0, clicks: 0, leads: 0, conversions: 0 })
  const [categoryData, setCategoryData] = useState<{ category: string; count: number; color: string }[]>([])

  useEffect(() => {
    api.stats.traffic().then(d => { setViewsTrend(d.viewsTrend); setLeadsTrend(d.leadsTrend) }).catch(() => {
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 13 + i)
        return d.toISOString().slice(5, 10)
      })
      setViewsTrend(days.map(d => ({ date: d, value: Math.floor(Math.random() * 5000 + 8000) })))
      setLeadsTrend(days.map(d => ({ date: d, value: Math.floor(Math.random() * 300 + 400) })))
    })
    api.stats.funnel().then(setFunnel).catch(() => {
      setFunnel({ views: 125600, clicks: 43200, leads: 3840, conversions: 876 })
    })
    setCategoryData(CATEGORIES.slice(0, 8).map(c => ({ category: c.label, count: Math.floor(Math.random() * 2000 + 200), color: c.color })))
  }, [])

  const totalViews = viewsTrend.reduce((s, p) => s + p.value, 0)
  const totalLeads = leadsTrend.reduce((s, p) => s + p.value, 0)
  const kpis: KpiItem[] = [
    { label: '总浏览量', value: totalViews.toLocaleString(), trend: 12.5, icon: <Eye className="w-5 h-5 text-navy-600" /> },
    { label: '留资数', value: totalLeads.toLocaleString(), trend: 8.3, icon: <Phone className="w-5 h-5 text-navy-600" /> },
    { label: '转化数', value: funnel.conversions.toLocaleString(), trend: -2.1, icon: <ShoppingCart className="w-5 h-5 text-navy-600" /> },
    { label: '留资率', value: funnel.views ? ((funnel.leads / funnel.views) * 100).toFixed(1) + '%' : '0%', trend: 5.7, icon: <Percent className="w-5 h-5 text-navy-600" /> },
  ]

  const funnelMax = funnel.views || 1

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-navy-800" />
        <h1 className="text-2xl font-bold text-navy-800">流量分发看板</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{k.label}</span>
              {k.icon}
            </div>
            <div className="text-2xl font-bold text-navy-800">{k.value}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${k.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {k.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {k.trend >= 0 ? '+' : ''}{k.trend}%
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-navy-800 mb-3">浏览趋势</h2>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line data={viewsTrend} type="monotone" dataKey="value" name="浏览量" stroke="#0F2B46" strokeWidth={2} dot={false} />
              <Line data={leadsTrend} type="monotone" dataKey="value" name="留资数" stroke="#FF6B35" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-navy-800 mb-4">转化漏斗</h2>
        <div className="space-y-3">
          {FUNNEL_STEPS.map((step, i) => {
            const value = funnel[step.key]
            const width = (value / funnelMax) * 100
            const nextStep = FUNNEL_STEPS[i + 1]
            const nextValue = nextStep ? funnel[nextStep.key] : 0
            const convRate = i < FUNNEL_STEPS.length - 1 && value ? ((nextValue / value) * 100).toFixed(1) : null
            return (
              <div key={step.key} className="flex items-center gap-4">
                <span className="w-12 text-sm text-slate-600 text-right">{step.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden relative">
                  <div className={`${step.color} h-full rounded-full flex items-center px-3 transition-all`} style={{ width: `${Math.max(width, 8)}%` }}>
                    <span className="text-white text-xs font-medium">{value.toLocaleString()}</span>
                  </div>
                </div>
                {convRate !== null && <span className="text-xs text-slate-500 w-16">{convRate}%</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-navy-800 mb-3">分类分布</h2>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
