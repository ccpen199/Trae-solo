import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { STYLES, LEVELS, HOUSE_TYPES } from '@/lib/types'
import { fetchApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { CostResult } from '@/lib/types'

const PIE_COLORS = ['#C4A882', '#8B9E7E', '#9A7B52', '#D4B896', '#B8956A']
const BREAKDOWN_LABELS: Record<string, string> = {
  labor: '人工费',
  auxiliary: '辅料费',
  mainMaterial: '主材费',
  furniture: '家具费',
  appliance: '家电费',
}

const inputCls = 'w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-sand-900 outline-none focus:border-sand-400'

interface CalcResponse {
  total: number
  breakdown: Record<string, { unit_price: number; total: number; unit: string }>
  city: string
  area: number
  style: string
  quality: string
  houseType?: string
  constructionTimeline?: Array<{ name: string; phase: string; duration_days: number; description: string; order_num: number }>
  recommendedMaterials?: Array<{ name: string; category: string; brand: string; unit: string; price: number }>
}

export default function Calculator() {
  const [cities, setCities] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [houseType, setHouseType] = useState<string>(HOUSE_TYPES[2])
  const [style, setStyle] = useState<string>(STYLES[0])
  const [level, setLevel] = useState<string>(LEVELS[1].value)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CalcResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchApi<string[]>('/api/calculator/cities')
      .then(setCities)
      .catch(() => setCities([]))
  }, [])

  const onSubmit = async () => {
    if (!city || !area) { setError('请填写城市和面积'); return }
    setError('')
    setSubmitting(true)
    try {
      const levelLabel = LEVELS.find((l) => l.value === level)?.label || '标准'
      const data = await fetchApi<CalcResponse>('/api/calculator', {
        method: 'POST',
        body: JSON.stringify({ city, area: Number(area), house_type: houseType, style, quality: levelLabel }),
      })
      setResult(data)
    } catch (e) {
      setError('计算失败，请重试')
    } finally { setSubmitting(false) }
  }

  const pieData = result
    ? Object.entries(result.breakdown).map(([key, val]) => ({ name: key, value: val.total }))
    : []

  const barData = result
    ? Object.entries(result.breakdown).map(([key, val]) => ({ name: key, unit_price: val.unit_price }))
    : []

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <header className="border-b border-sand-200 bg-white/60">
        <div className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-sand-900">装修成本计算器</h1>
          <p className="mt-2 text-sm text-sand-900/60">根据城市、面积和风格，快速估算装修费用</p>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 font-display text-lg font-semibold text-sand-900">基本信息</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">城市</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls}>
                    <option value="">请选择城市</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">面积 (㎡)</label>
                  <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="100" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">户型</label>
                  <select value={houseType} onChange={(e) => setHouseType(e.target.value)} className={inputCls}>
                    {HOUSE_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">风格</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className={inputCls}>
                    {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">装修档次</label>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                      <button key={l.value} onClick={() => setLevel(l.value)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${level === l.value ? 'bg-sand-400 text-white' : 'border border-sand-200 text-sand-900/70 hover:bg-sand-100'}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button onClick={onSubmit} disabled={submitting} className="w-full rounded-lg bg-sand-400 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sand-500 disabled:opacity-50">
                  {submitting ? '计算中…' : '开始计算'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {!result ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white py-24">
                <div className="mb-4 h-32 w-32 rounded-full bg-sand-100 flex items-center justify-center">
                  <svg className="h-16 w-16 text-sand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <p className="font-display text-xl text-sand-900/40">填写信息，开始计算</p>
                <p className="mt-2 text-sm text-sand-900/30">结果将在此处展示</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-sand-200 bg-white p-6">
                  <p className="text-sm text-sand-900/60">预估总价</p>
                  <p className="mt-1 font-display text-4xl font-bold text-sand-900">¥{formatPrice(result.total)}</p>
                  <p className="mt-1 text-xs text-sand-900/40">{result.city} · {result.area}㎡ · {result.style} · {result.quality}</p>
                </div>

                <div className="rounded-2xl border border-sand-200 bg-white p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold text-sand-900">费用明细</h3>
                  <div className="space-y-3">
                    {Object.entries(result.breakdown).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between border-b border-sand-100 pb-3 last:border-0 last:pb-0">
                        <span className="text-sm text-sand-900/70">{key}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-sand-900">¥{formatPrice(val.total)}</span>
                          <span className="ml-2 text-xs text-sand-900/40">{val.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-sand-200 bg-white p-6">
                    <h3 className="mb-4 font-display text-lg font-semibold text-sand-900">费用占比</h3>
                    <PieChart width={280} height={280}>
                      <Pie data={pieData} cx={140} cy={140} innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `¥${formatPrice(v)}`} />
                    </PieChart>
                    <div className="mt-2 flex flex-wrap justify-center gap-3">
                      {pieData.map((d, i) => (
                        <span key={d.name} className="flex items-center gap-1.5 text-xs text-sand-900/60">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sand-200 bg-white p-6">
                    <h3 className="mb-4 font-display text-lg font-semibold text-sand-900">单价对比</h3>
                    <BarChart width={280} height={280} data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#C4A882" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#C4A882" />
                      <Tooltip formatter={(v: number) => `¥${formatPrice(v)}/㎡`} />
                      <Bar dataKey="unit_price" fill="#C4A882" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </div>
                </div>

                {result.constructionTimeline && result.constructionTimeline.length > 0 && (
                  <div className="rounded-2xl border border-sand-200 bg-white p-6">
                    <div className="mb-4 flex items-end justify-between">
                      <h3 className="font-display text-lg font-semibold text-sand-900">施工工期规划</h3>
                      <span className="text-sm text-sand-900/50">
                        总工期 {result.constructionTimeline.reduce((s, n) => s + (n.duration_days || 0), 0)} 天
                      </span>
                    </div>
                    <div className="relative py-3">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-sand-200" />
                      <div className="relative flex items-start justify-between gap-2 overflow-x-auto">
                        {result.constructionTimeline.map((node) => (
                          <div key={node.order_num} className="flex flex-shrink-0 flex-col items-center" style={{ minWidth: 110 }}>
                            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-sand-400 bg-sand-100">
                              <span className="text-xs font-semibold text-sand-600">{node.order_num}</span>
                            </div>
                            <div className="mt-3 text-center">
                              <p className="text-sm font-medium text-sand-900">{node.name}</p>
                              <p className="mt-0.5 text-xs text-sage-600">{node.duration_days}天</p>
                              <p className="mt-1 text-xs text-sand-900/50 line-clamp-2">{node.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result.recommendedMaterials && result.recommendedMaterials.length > 0 && (
                  <div className="rounded-2xl border border-sand-200 bg-white p-6">
                    <h3 className="mb-4 font-display text-lg font-semibold text-sand-900">推荐材料清单</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-sand-200 bg-sand-50">
                            <th className="px-4 py-3 text-left font-medium text-sand-900/60">材料</th>
                            <th className="px-4 py-3 text-left font-medium text-sand-900/60">分类</th>
                            <th className="px-4 py-3 text-left font-medium text-sand-900/60">品牌</th>
                            <th className="px-4 py-3 text-right font-medium text-sand-900/60">单价</th>
                            <th className="px-4 py-3 text-right font-medium text-sand-900/60">单位</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.recommendedMaterials.map((m, i) => (
                            <tr key={i} className="border-b border-sand-100 last:border-0">
                              <td className="px-4 py-3 font-medium text-sand-900">{m.name}</td>
                              <td className="px-4 py-3 text-sand-900/60">{m.category}</td>
                              <td className="px-4 py-3 text-sand-900/60">{m.brand}</td>
                              <td className="px-4 py-3 text-right text-sand-900">¥{formatPrice(m.price)}</td>
                              <td className="px-4 py-3 text-right text-sand-900/60">{m.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
