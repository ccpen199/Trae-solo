import { useState, useEffect } from 'react'
import { TrendingUp, BarChart3, Target, Download, X, Lightbulb, FileText } from 'lucide-react'
import {
  ComposedChart, BarChart, Bar, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const STATIONS = [
  '国网北京朝阳站', '特来电上海浦东站', '星星充电深圳南山站',
  '云快充广州天河站', '小桔充电杭州西湖站', 'e充电成都武侯站',
  '国家电网南京建邺站', '特来电武汉洪山站', '星星充电重庆渝北站',
  '云快充长沙岳麓站',
]

const PERIODS = ['近7天', '近30天', '近90天', '近一年'] as const
const COLORS = ['#00E599', '#4FC3F7', '#FF8C00']

const ROI_DATA = [
  { name: '国网北京朝阳站', 日均收益: 8520, 利用率: 78, ROI: 23.5, 回本周期: 4.2, 投资额: 320, 投资明细: '设备180万+安装80万+运营60万', 月趋势: [7800, 8100, 8350, 8520] },
  { name: '特来电上海浦东站', 日均收益: 7830, 利用率: 72, ROI: 19.8, 回本周期: 5.0, 投资额: 350, 投资明细: '设备200万+安装90万+运营60万', 月趋势: [7200, 7500, 7680, 7830] },
  { name: '星星充电深圳南山站', 日均收益: 6940, 利用率: 65, ROI: 16.2, 回本周期: 6.1, 投资额: 280, 投资明细: '设备150万+安装70万+运营60万', 月趋势: [6200, 6500, 6780, 6940] },
  { name: '云快充广州天河站', 日均收益: 6210, 利用率: 61, ROI: 14.7, 回本周期: 6.8, 投资额: 260, 投资明细: '设备140万+安装60万+运营60万', 月趋势: [5800, 5900, 6050, 6210] },
  { name: '小桔充电杭州西湖站', 日均收益: 5680, 利用率: 56, ROI: 12.3, 回本周期: 8.1, 投资额: 240, 投资明细: '设备130万+安装50万+运营60万', 月趋势: [5100, 5300, 5490, 5680] },
  { name: 'e充电成都武侯站', 日均收益: 5130, 利用率: 52, ROI: 10.8, 回本周期: 9.2, 投资额: 220, 投资明细: '设备120万+安装40万+运营60万', 月趋势: [4600, 4800, 4980, 5130] },
  { name: '国家电网南京建邺站', 日均收益: 4870, 利用率: 48, ROI: 9.5, 回本周期: 10.5, 投资额: 210, 投资明细: '设备110万+安装40万+运营60万', 月趋势: [4200, 4400, 4680, 4870] },
  { name: '特来电武汉洪山站', 日均收益: 4520, 利用率: 45, ROI: 8.2, 回本周期: 12.1, 投资额: 200, 投资明细: '设备100万+安装40万+运营60万', 月趋势: [3800, 4000, 4280, 4520] },
  { name: '星星充电重庆渝北站', 日均收益: 3980, 利用率: 40, ROI: 6.8, 回本周期: 14.7, 投资额: 190, 投资明细: '设备90万+安装40万+运营60万', 月趋势: [3200, 3500, 3760, 3980] },
  { name: '云快充长沙岳麓站', 日均收益: 3540, 利用率: 36, ROI: 5.5, 回本周期: 18.2, 投资额: 180, 投资明细: '设备80万+安装40万+运营60万', 月趋势: [2800, 3100, 3320, 3540] },
]

const EFFICIENCY_DATA = ROI_DATA.map(s => ({
  name: s.name.length > 6 ? s.name.slice(0, 6) + '…' : s.name,
  单桩日收益: Math.round(s.日均收益 / (s.投资额 / 10)),
}))

const generateTrend = (station: string) => {
  const data = []
  const base = ROI_DATA.find(r => r.name === station)?.日均收益 ?? 5200
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    data.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, [station]: Math.round(base + Math.sin(i / 7) * base * 0.2 + Math.random() * base * 0.12) })
  }
  return data
}

const formatYuan = (v: number) => `¥${v.toLocaleString()}`
const formatPercent = (v: number) => `${v}%`

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-deep-blue-light border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="data-text">
          {p.name}: {typeof p.value === 'number' && p.name.includes('收益') ? formatYuan(p.value) : `${p.value}${p.name.includes('ROI') || p.name.includes('率') ? '%' : ''}`}
        </p>
      ))}
    </div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1, w = 60, h = 20
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return <svg width={w} height={h} className="inline-block"><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} /></svg>
}

const SUGGESTIONS = [
  { title: '建议提升桩利用率', desc: '国网北京朝阳站利用率偏低（78%），建议调整定价策略吸引更多用户', action: '生成报告' as const, color: 'text-amber-orange', icon: Target },
  { title: '建议增加快充桩', desc: '特来电上海浦东站快充需求旺盛，高峰期排队时长超25分钟', action: '查看详情' as const, color: 'text-ice-blue', icon: BarChart3 },
  { title: '建议调整峰谷电价', desc: '星星充电广州天河站峰谷价差过小，无法有效引导错峰充电', action: '编辑定价' as const, color: 'text-electric-green', icon: TrendingUp },
]

const REPORT_DATA = [
  { month: '1月', 当前定价收益: 8500, 优化后收益: 9200 },
  { month: '2月', 当前定价收益: 8700, 优化后收益: 9500 },
  { month: '3月', 当前定价收益: 8900, 优化后收益: 9800 },
  { month: '4月', 当前定价收益: 8400, 优化后收益: 9600 },
  { month: '5月', 当前定价收益: 8600, 优化后收益: 9900 },
  { month: '6月', 当前定价收益: 8520, 优化后收益: 10200 },
]

export default function Revenue() {
  const [selectedStations, setSelectedStations] = useState<string[]>([STATIONS[0]])
  const [period, setPeriod] = useState<string>('近30天')
  const [hoverRow, setHoverRow] = useState<number | null>(null)
  const [toast, setToast] = useState(false)
  const [reportModal, setReportModal] = useState(false)

  useEffect(() => {}, [selectedStations, period])

  const toggleStation = (s: string) => {
    setSelectedStations(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s)
      if (prev.length >= 3) return prev
      return [...prev, s]
    })
  }

  const trendData = selectedStations.length > 0
    ? generateTrend(selectedStations[0]).map((d, i) => {
        const point: any = { date: d.date }
        selectedStations.forEach(s => { point[s] = generateTrend(s)[i]?.[s] })
        return point
      })
    : []

  const handleExport = () => { setToast(true); setTimeout(() => setToast(false), 2500) }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="section-title flex items-center gap-2 mb-0"><TrendingUp className="w-5 h-5 text-amber-orange" />收益分析</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1.5 max-w-[360px]">
            {STATIONS.map(s => {
              const idx = selectedStations.indexOf(s)
              const selected = idx >= 0
              return (
                <button key={s} onClick={() => toggleStation(s)}
                  className={`px-2.5 py-1 rounded text-xs transition-all border ${selected ? 'border-transparent' : 'border-white/10 text-gray-500'}`}
                  style={selected ? { backgroundColor: `${COLORS[idx]}20`, color: COLORS[idx], borderColor: `${COLORS[idx]}40` } : {}}>
                  {s.slice(0, 4)}
                </button>
              )
            })}
          </div>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${period === p ? 'bg-electric-green/20 text-electric-green border border-electric-green/40' : 'text-gray-400 hover:text-gray-200 border border-transparent'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1 text-sm"><Download className="w-4 h-4" />导出报表</button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 glass-card px-4 py-3 flex items-center gap-2 animate-slide-up border border-electric-green/30">
          <span className="text-electric-green text-sm">报表已开始下载</span>
          <button onClick={() => setToast(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      )}

      <div className="glass-card p-5">
        <h3 className="section-title flex items-center gap-2 text-base mb-4"><Target className="w-4 h-4 text-amber-orange" />场站ROI分析</h3>
        <div className="h-[320px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ROI_DATA} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="name" tick={{ fill: '#8892A4', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis yAxisId="left" tick={{ fill: '#8892A4', fontSize: 11 }} tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8892A4', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8892A4' }} />
              <Bar yAxisId="left" dataKey="日均收益" fill="#00E599" radius={[3, 3, 0, 0]} barSize={28} />
              <Line yAxisId="right" dataKey="ROI" stroke="#FF8C00" strokeWidth={2} dot={{ fill: '#FF8C00', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 text-gray-400"><th className="text-left py-2 px-3">场站名称</th><th className="text-right py-2 px-3">日均收益</th><th className="text-right py-2 px-3">利用率</th><th className="text-right py-2 px-3">ROI</th><th className="text-right py-2 px-3">回本周期</th><th className="text-right py-2 px-3">投资额(万)</th></tr></thead>
            <tbody>{ROI_DATA.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors relative" onMouseEnter={() => setHoverRow(i)} onMouseLeave={() => setHoverRow(null)}>
                <td className="py-2 px-3 text-gray-200">{r.name}</td>
                <td className="py-2 px-3 text-right data-text text-electric-green">{formatYuan(r.日均收益)}</td>
                <td className="py-2 px-3 text-right data-text text-ice-blue">{formatPercent(r.利用率)}</td>
                <td className="py-2 px-3 text-right data-text text-amber-orange">{formatPercent(r.ROI)}</td>
                <td className="py-2 px-3 text-right data-text text-gray-300">{r.回本周期}年</td>
                <td className="py-2 px-3 text-right data-text text-gray-300">¥{r.投资额}万</td>
                {hoverRow === i && (
                  <td className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-deep-blue-light border border-white/10 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                    <div className="text-gray-300 mb-1">{r.投资明细}</div>
                    <div className="text-gray-400">月趋势 <Sparkline data={r.月趋势} color="#00E599" /></div>
                  </td>
                )}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="section-title flex items-center gap-2 text-base mb-4"><BarChart3 className="w-4 h-4 text-ice-blue" />坪效对比</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EFFICIENCY_DATA} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="name" tick={{ fill: '#8892A4', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#8892A4', fontSize: 11 }} tickFormatter={v => `¥${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="单桩日收益" fill="#4FC3F7" radius={[3, 3, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="section-title flex items-center gap-2 text-base mb-4">
          <TrendingUp className="w-4 h-4 text-electric-green" />趋势预测
          <span className="text-xs text-gray-500 font-normal ml-2">已选 {selectedStations.length}/3 站对比</span>
        </h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="date" tick={{ fill: '#8892A4', fontSize: 11 }} interval={14} />
              <YAxis tick={{ fill: '#8892A4', fontSize: 11 }} tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8892A4' }} />
              {selectedStations.map((s, i) => (
                <Area key={s} type="monotone" dataKey={s} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
          {selectedStations.map((s, i) => (
            <span key={s} className="flex items-center gap-1"><span className="inline-block w-5 h-0.5" style={{ backgroundColor: COLORS[i] }} /> {s}</span>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="section-title flex items-center gap-2 text-base mb-4"><Lightbulb className="w-4 h-4 text-amber-orange" />优化建议</h3>
        <div className="grid grid-cols-3 gap-4">
          {SUGGESTIONS.map((s, i) => (
            <div key={i} className="stat-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <h4 className="text-sm font-medium text-gray-100">{s.title}</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              <button
                onClick={() => { if (s.action === '生成报告') setReportModal(true) }}
                className={`text-xs px-3 py-1.5 rounded ${s.action === '编辑定价' ? 'btn-secondary' : 'btn-primary'}`}
              >
                {s.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setReportModal(false)}>
          <div className="glass-card p-6 w-[600px] max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-gray-100 font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-amber-orange" />定价优化报告预览</h3>
              <button onClick={() => setReportModal(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button>
            </div>
            <div className="stat-card p-3 text-xs space-y-1">
              <div className="text-gray-300 font-medium">国网北京朝阳站 — 定价策略优化</div>
              <div className="text-gray-400">当前日均收益：<span className="data-text text-ice-blue">¥8,520</span></div>
              <div className="text-gray-400">预计优化后收益：<span className="data-text text-electric-green">¥10,200</span></div>
              <div className="text-gray-400">预期提升：<span className="data-text text-amber-orange">+19.7%</span></div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REPORT_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis dataKey="month" tick={{ fill: '#8892A4', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8892A4', fontSize: 11 }} tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#111D33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#8892A4' }} />
                  <Bar dataKey="当前定价收益" fill="#4FC3F7" radius={[3, 3, 0, 0]} barSize={20} />
                  <Bar dataKey="优化后收益" fill="#00E599" radius={[3, 3, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>优化策略：低谷期降价15%吸引流量，高峰期提价8%提升利润</div>
              <div>预计实施周期：2周</div>
              <div>风险评估：低风险，可A/B测试验证</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReportModal(false)} className="btn-secondary text-sm">关闭</button>
              <button onClick={() => setReportModal(false)} className="btn-primary text-sm">下载完整报告</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
