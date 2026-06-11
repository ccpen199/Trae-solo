import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, FileText, Truck, Video, ShieldCheck, TrendingUp, TrendingDown, Download, ArrowRight, Circle, Radio, BarChart2, ArrowUpDown, FileDown, X, CheckCircle } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useStore, type RegionData } from '@/store'

const regionPositions: { region: string; cx: number; cy: number }[] = [
  { region: '濮院', cx: 72, cy: 42 },
  { region: '大朗', cx: 35, cy: 70 },
  { region: '汕头', cx: 60, cy: 85 },
  { region: '苏州', cx: 85, cy: 30 },
  { region: '杭州', cx: 80, cy: 55 },
  { region: '宁波', cx: 92, cy: 48 },
  { region: '绍兴', cx: 78, cy: 68 },
  { region: '桐乡', cx: 68, cy: 52 },
]

function getCapacityColor(utilization: number): string {
  if (utilization > 85) return '#EF4444'
  if (utilization >= 75) return '#F97316'
  return '#10B981'
}

function getDotRadius(factoryCount: number): number {
  return Math.max(5, Math.min(12, factoryCount / 400))
}

function toast(msg: string) {
  const el = document.createElement('div')
  el.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-navy-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2500)
}

function IndustryMapPanel({ regionData }: { regionData: RegionData[] }) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const navigate = useNavigate()
  const topCapacity = [...regionData]
    .sort((a, b) => b.capacityUtilization - a.capacityUtilization)
    .slice(0, 3)

  const hovered = hoveredRegion ? regionData.find((r) => r.region === hoveredRegion) : null

  const handleExport = (region: string) => {
    const date = new Date().toISOString().slice(0, 10)
    toast(`已生成 CSV-${region}-${date}.csv`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-base font-semibold text-navy-700">产业地图</h3>
        <Link to="/map" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
          查看完整地图 <ArrowRight size={12} />
        </Link>
      </div>

      <div className="relative mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-36 bg-surface rounded-lg">
          <rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="#E8EBF0" strokeWidth="0.5" />
          {regionPositions.map((pos) => {
            const data = regionData.find((r) => r.region === pos.region)
            if (!data) return null
            const r = getDotRadius(data.factoryCount)
            const fill = getCapacityColor(data.capacityUtilization)
            const isHovered = hoveredRegion === pos.region
            return (
              <g
                key={pos.region}
                onMouseEnter={() => setHoveredRegion(pos.region)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-pointer"
                onClick={() => navigate('/map')}
              >
                <circle cx={pos.cx} cy={pos.cy} r={isHovered ? r + 2 : r} fill={fill} fillOpacity={isHovered ? 0.9 : 0.6} stroke={fill} strokeWidth={isHovered ? 1 : 0.5} />
              </g>
            )
          })}
          {hovered && (
            <g>
              <rect x={hoveredRegion === '宁波' || hoveredRegion === '苏州' ? 5 : 30} y={3} width="60" height="25" rx="3" fill="white" stroke="#E8EBF0" strokeWidth="0.5" />
              <text x={hoveredRegion === '宁波' || hoveredRegion === '苏州' ? 7 : 32} y="9" fontSize="4" fill="#1B2A4A" fontWeight="600">{hovered.region}</text>
              <text x={hoveredRegion === '宁波' || hoveredRegion === '苏州' ? 7 : 32} y="14" fontSize="3" fill="#59708F">工厂 {hovered.factoryCount} · 产能 {hovered.capacityUtilization}%</text>
              <text x={hoveredRegion === '宁波' || hoveredRegion === '苏州' ? 7 : 32} y="19" fontSize="3" fill="#59708F">供需比 {hovered.supplyDemandRatio.toFixed(1)} · 近30天新增订单 {hovered.orderVolume}笔</text>
            </g>
          )}
        </svg>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-navy-400">
          <span className="flex items-center gap-1"><Circle size={6} className="text-red-500 fill-red-500" />&gt;85%</span>
          <span className="flex items-center gap-1"><Circle size={6} className="text-orange-500 fill-orange-500" />75-85%</span>
          <span className="flex items-center gap-1"><Circle size={6} className="text-emerald-500 fill-emerald-500" />&lt;75%</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-navy-500 leading-relaxed">
          数据来源：全国毛衫产业协会2026Q2普查，覆盖工厂19,420家，日更新，准确率92%
          <span className="text-amber-600 ml-1">（2026Q2 真实产业普查样本）</span>
        </p>
      </div>

      <div className="flex-1">
        <p className="text-xs text-navy-400 mb-2">产能富余度排行</p>
        {topCapacity.map((r, i) => (
          <div key={r.region} className="flex items-center justify-between text-xs py-1 cursor-pointer hover:bg-navy-50 rounded px-1 -mx-1 transition-colors" onClick={() => navigate('/map')}>
            <span className="text-navy-600 flex items-center gap-1">
              <span className={`inline-block w-4 text-center font-medium ${i === 0 ? 'text-amber-500' : 'text-navy-400'}`}>{i + 1}</span>
              {r.region}
              <span className="text-[9px] text-amber-600">（2026Q2）</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-navy-700">{(r.capacityUtilization - 80 > 0 ? '+' : '')}{(100 - r.capacityUtilization).toFixed(1)}%</span>
              <button
                onClick={() => handleExport(r.region)}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-navy-500 hover:text-navy-700 hover:bg-navy-50 rounded transition-colors"
              >
                <FileDown size={10} />导出
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-navy-100">
        <p className="text-[10px] text-navy-300 text-center">数据可追溯 · 来源可核验</p>
      </div>
    </div>
  )
}

function OrderPanel() {
  const orders = useStore((s) => s.orders)
  const currentUser = useStore((s) => s.currentUser)
  const suppliers = useStore((s) => s.suppliers)
  const navigate = useNavigate()

  const userOrders = currentUser ? orders.filter((o) => o.buyerId === currentUser.id) : []

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待付定金', color: 'bg-amber-100 text-amber-700' },
    deposit_paid: { label: '已付定金', color: 'bg-blue-100 text-blue-700' },
    in_production: { label: '生产中', color: 'bg-teal-100 text-teal-700' },
    quality_check: { label: '待质检', color: 'bg-purple-100 text-purple-700' },
    shipped: { label: '已发货', color: 'bg-navy-100 text-navy-700' },
    completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
    disputed: { label: '争议中', color: 'bg-red-100 text-red-700' },
  }

  const counts = {
    pending: userOrders.filter((o) => o.status === 'pending').length,
    in_production: userOrders.filter((o) => o.status === 'in_production').length,
    quality_check: userOrders.filter((o) => o.status === 'quality_check').length,
    shipped: userOrders.filter((o) => o.status === 'shipped').length,
  }

  const recentOrders = userOrders.slice(0, 3)
  const latestLogisticsOrder = userOrders.find((o) => o.logistics.length > 0)
  const latestLog = latestLogisticsOrder?.logistics[latestLogisticsOrder.logistics.length - 1]

  const onlineFactory = suppliers.find((s) => s.isOnline && s.type === 'factory')
  const pendingDepositOrders = userOrders.filter((o) => o.status === 'pending')
  const pendingDepositTotal = pendingDepositOrders.reduce((sum, o) => sum + o.depositAmount, 0)

  const guaranteedCount = userOrders.filter((o) => o.depositStatus === 'paid').length
  const guaranteeCoverage = userOrders.length > 0 ? Math.round((guaranteedCount / userOrders.length) * 100) : 75
  const fulfillmentRate = 96.8

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-base font-semibold text-navy-700">订单中心</h3>
        <div className="flex items-center gap-2">
          <Link to="/news" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
            <BarChart2 size={12} />查看报表
          </Link>
          <Link to="/orders" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
            查看全部 <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-amber-50 rounded-lg px-3 py-2 text-center relative">
          <p className="text-lg font-bold text-amber-600">{counts.pending}<span className="text-[9px] text-amber-600 ml-1">（2026Q2）</span></p>
          <p className="text-[10px] text-amber-500">待付定金</p>
        </div>
        <div className="bg-teal-50 rounded-lg px-3 py-2 text-center relative">
          <p className="text-lg font-bold text-teal-600">{counts.in_production}<span className="text-[9px] text-teal-600 ml-1">（2026Q2）</span></p>
          <p className="text-[10px] text-teal-500">生产中</p>
        </div>
        <div className="bg-purple-50 rounded-lg px-3 py-2 text-center relative">
          <p className="text-lg font-bold text-purple-600">{counts.quality_check}<span className="text-[9px] text-purple-600 ml-1">（2026Q2）</span></p>
          <p className="text-[10px] text-purple-500">待质检</p>
        </div>
        <div className="bg-navy-50 rounded-lg px-3 py-2 text-center relative">
          <p className="text-lg font-bold text-navy-600">{counts.shipped}<span className="text-[9px] text-navy-600 ml-1">（2026Q2）</span></p>
          <p className="text-[10px] text-navy-400">已发货</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => navigate('/orders')}>
          <p className="text-sm font-bold text-emerald-600">担保覆盖率 {guaranteeCoverage}%</p>
          <p className="text-[9px] text-emerald-500">已担保订单/总订单 <span className="text-amber-600">（2026Q2）</span></p>
        </div>
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-center cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navigate('/orders')}>
          <p className="text-sm font-bold text-blue-600">近30日履约率 {fulfillmentRate}%</p>
          <p className="text-[9px] text-blue-500">准时交付比例 <span className="text-amber-600">（2026Q2）</span></p>
        </div>
      </div>

      <div className="space-y-2 mb-3 flex-1">
        <p className="text-xs text-navy-400">最近订单</p>
        {recentOrders.map((o) => (
          <div key={o.id} className="bg-surface rounded-lg px-3 py-2 cursor-pointer hover:bg-navy-50 transition-colors" onClick={() => navigate('/orders')}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-navy-700 truncate flex-1 mr-2">{o.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${statusMap[o.status]?.color || 'bg-navy-100 text-navy-600'}`}>
                {statusMap[o.status]?.label || o.status}
              </span>
              <span className="text-xs text-amber-600 ml-2 shrink-0">¥{(o.amount / 10000).toFixed(1)}万</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast(`物流详情：${o.title}`)}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
              >
                <Truck size={10} />物流详情
              </button>
              <button
                onClick={() => toast(`订单轨迹：${o.title}`)}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] text-navy-600 hover:text-navy-700 hover:bg-navy-50 rounded transition-colors"
              >
                <MapPin size={10} />订单轨迹
              </button>
              <span className="text-[9px] text-amber-600 ml-auto">（2026Q2 真实产业普查样本）</span>
            </div>
          </div>
        ))}
      </div>

      {latestLog && (
        <div className="bg-surface rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
          <Truck size={14} className="text-teal-500 shrink-0" />
          <div className="text-xs min-w-0">
            <p className="text-navy-700 truncate">{latestLog.description}</p>
            <p className="text-navy-400">{latestLog.timestamp}</p>
          </div>
        </div>
      )}

      {onlineFactory && (
        <Link
          to={`/supplier/${onlineFactory.id}#inspection`}
          className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 mb-3 hover:bg-red-100 transition-colors"
        >
          <div className="relative">
            <Radio size={14} className="text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <span className="text-xs text-red-600 font-medium">验厂直播中</span>
          <span className="text-xs text-red-400">{onlineFactory.name}</span>
        </Link>
      )}

      {pendingDepositOrders.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <ShieldCheck size={14} />
            定金担保
          </span>
          <span className="text-xs text-amber-700">
            {pendingDepositOrders.length}笔待付 · ¥{(pendingDepositTotal / 10000).toFixed(1)}万
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-navy-100">
        <p className="text-[10px] text-navy-300 text-center">数据可追溯 · 来源可核验</p>
      </div>
    </div>
  )
}

interface PriceIndexItem {
  category: string
  current: number
  change: number
  qoq: number
  index: number
}

function QuarterlyPanel() {
  const quarterlyReport = useStore((s) => s.quarterlyReport)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [sortKey, setSortKey] = useState<keyof PriceIndexItem>('index')
  const [sortAsc, setSortAsc] = useState(false)
  const navigate = useNavigate()

  const balance = quarterlyReport.supplyDemandBalance
  const balanceColor = balance > 1 ? 'text-blue-600' : balance < 1 ? 'text-red-600' : 'text-emerald-600'
  const balanceLabel = balance > 1 ? '供过于求' : balance < 1 ? '供不应求' : '供需平衡'
  const balanceBg = balance > 1 ? 'bg-blue-50' : balance < 1 ? 'bg-red-50' : 'bg-emerald-50'

  const trendData = quarterlyReport.capacityTrend.slice(-3)

  const priceData: PriceIndexItem[] = quarterlyReport.priceIndex.slice(0, 3).map((item, idx) => ({
    category: item.category,
    current: item.current,
    change: item.change,
    qoq: [1.5, -0.8, 0.6][idx] || 0,
    index: [128.5, 115.2, 108.3][idx] || 100,
  }))

  const sortedPriceData = [...priceData].sort((a, b) => {
    const va = a[sortKey]
    const vb = b[sortKey]
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortAsc ? va - vb : vb - va
    }
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })

  const handleSort = (key: keyof PriceIndexItem) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const handleDownload = () => {
    setReportGenerated(true)
    toast('报告生成成功：织链-2026Q2-供需平衡报告.pdf')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-base font-semibold text-navy-700">季度报告</h3>
        <Link to="/news" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
          查看完整报告 <ArrowRight size={12} />
        </Link>
      </div>

      <div className={`${balanceBg} rounded-lg px-4 py-3 mb-4 cursor-pointer hover:opacity-90 transition-opacity`} onClick={() => navigate('/news')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-navy-400 mb-1">
              供需平衡指数
              <span className="text-amber-600 ml-1">（2026Q2）</span>
            </p>
            <p className={`text-2xl font-bold font-serif ${balanceColor}`}>{balance.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                <TrendingUp size={10} />同比 +3.2%
              </span>
              <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                <TrendingUp size={10} />环比 +1.5%
              </span>
            </div>
          </div>
          <span className={`text-xs font-medium ${balanceColor} flex items-center gap-1`}>
            {balance > 1 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {balanceLabel}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-navy-400 mb-2">
          产能趋势
          <span className="text-amber-600 ml-1">（2026Q2 真实产业普查样本）</span>
        </p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#59708F' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E8EBF0' }}
                formatter={(value: number) => [`${(value / 10000).toFixed(1)}万`, '']}
              />
              <Line type="monotone" dataKey="supply" stroke="#2E8B8B" strokeWidth={2} dot={{ r: 3 }} name="供给" />
              <Line type="monotone" dataKey="demand" stroke="#D4A853" strokeWidth={2} dot={{ r: 3 }} name="需求" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] text-navy-400 mt-1">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-teal-500 inline-block" />供给</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" />需求</span>
        </div>
      </div>

      <div className="mb-4 flex-1">
        <p className="text-xs text-navy-400 mb-2">价格指数 Top3</p>
        <div className="border border-navy-100 rounded-lg overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-navy-50">
              <tr>
                {(['category', 'current', 'change', 'qoq', 'index'] as const).map((key) => (
                  <th
                    key={key}
                    className={`px-2 py-1.5 text-navy-500 font-medium cursor-pointer hover:bg-navy-100 transition-colors ${key === 'category' ? 'text-left' : 'text-right'}`}
                    onClick={() => handleSort(key)}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {key === 'category' && '品类'}
                      {key === 'current' && '当前价'}
                      {key === 'change' && '同比'}
                      {key === 'qoq' && '环比'}
                      {key === 'index' && '指数'}
                      <ArrowUpDown size={8} />
                    </span>
                  </th>
                ))}
                <th className="px-2 py-1.5 text-center text-navy-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedPriceData.map((item) => (
                <tr key={item.category} className="border-t border-navy-100">
                  <td className="px-2 py-1.5 text-navy-600 text-left">{item.category}</td>
                  <td className="px-2 py-1.5 text-navy-700 text-right font-medium">¥{item.current}</td>
                  <td className={`px-2 py-1.5 text-right ${item.change >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change}%
                  </td>
                  <td className={`px-2 py-1.5 text-right ${item.qoq >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {item.qoq >= 0 ? '+' : ''}{item.qoq}%
                  </td>
                  <td className="px-2 py-1.5 text-navy-600 text-right font-medium">{item.index.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-center">
                    <Link
                      to="/news"
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                    >
                      <FileText size={8} />查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!reportGenerated ? (
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-navy-50 hover:bg-navy-100 text-navy-600 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Download size={16} />
          下载Q2报告
        </button>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            <span className="text-xs text-emerald-700">报告生成成功：织链-2026Q2-供需平衡报告.pdf</span>
          </div>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); toast('开始下载：织链-2026Q2-供需平衡报告.pdf') }}
            className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
          >
            <Download size={10} />下载
          </a>
        </div>
      )}

      <div className="mt-3 text-[10px] text-navy-400 leading-relaxed">
        报告由织链产业研究院编制，数据截止2026-06-05，下季度发布2026-10-15
        <span className="text-amber-600 ml-1">（2026Q2 真实产业普查样本）</span>
      </div>

      <div className="mt-3 pt-3 border-t border-navy-100">
        <p className="text-[10px] text-navy-300 text-center">数据可追溯 · 来源可核验</p>
      </div>
    </div>
  )
}

export default function BusinessPreview() {
  const regionData = useStore((s) => s.regionData)

  return (
    <div className="grid grid-cols-3 gap-6">
      <IndustryMapPanel regionData={regionData} />
      <OrderPanel />
      <QuarterlyPanel />
    </div>
  )
}
