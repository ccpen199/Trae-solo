import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { Package, Truck, Handshake, Navigation, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

interface CostItem {
  date: string
  index: number
  province: string
  fuel: number
  toll: number
  labor: number
  warehouse: number
}

interface SupplyDemandItem {
  period: string
  province: string
  cargo_demand: number
  vehicle_supply: number
  avg_price: number
  avg_transit_days: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [costData, setCostData] = useState<CostItem[]>([])
  const [sdData, setSdData] = useState<SupplyDemandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const [statsRes, costRes, sdRes] = await Promise.all([
          api.get<any>('/api/dashboard/stats'),
          api.get<any>('/api/dashboard/cost-index'),
          api.get<any>('/api/dashboard/supply-demand'),
        ])
        const s = statsRes?.data ?? statsRes
        setStats(s)
        const c = costRes?.data ?? costRes
        setCostData(Array.isArray(c) ? c : [])
        const sd = sdRes?.data ?? sdRes
        setSdData(Array.isArray(sd) ? sd : [])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '获取数据失败'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
    )
  }

  const statCards = [
    { label: '总货源数', value: stats?.totals?.cargo ?? stats?.pending_cargo ?? 0, icon: Package, color: '#E8722A', bg: 'bg-orange-50' },
    { label: '总车源数', value: stats?.totals?.vehicles ?? stats?.idle_vehicle ?? 0, icon: Truck, color: '#1B2A4A', bg: 'bg-blue-50' },
    { label: '运输任务', value: stats?.totals?.tasks ?? stats?.active_tasks ?? 0, icon: Handshake, color: '#16A34A', bg: 'bg-green-50' },
    { label: '在途任务', value: stats?.active_tasks ?? 0, icon: Navigation, color: '#7C3AED', bg: 'bg-purple-50' },
  ]

  const provinces = [...new Set(costData.map((d) => d.province))]

  const latestCostByProvince = provinces.map((prov) => {
    const items = costData.filter((c) => c.province === prov)
    const latest = items[items.length - 1]
    return { province: prov, index: latest?.index ?? 0, fuel: latest?.fuel ?? 0, toll: latest?.toll ?? 0, labor: latest?.labor ?? 0, warehouse: latest?.warehouse ?? 0 }
  }).sort((a, b) => b.index - a.index)

  const barOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['综合成本', '燃油', '过路费', '人工', '仓储'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: latestCostByProvince.map((d) => d.province),
      axisLabel: { fontSize: 11, color: '#6B7280' },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#6B7280' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [
      { name: '综合成本', type: 'bar' as const, data: latestCostByProvince.map((d) => d.index), itemStyle: { color: '#E8722A', borderRadius: [4, 4, 0, 0] }, barWidth: '18%' },
      { name: '燃油', type: 'bar' as const, data: latestCostByProvince.map((d) => d.fuel), itemStyle: { color: '#1B2A4A', borderRadius: [4, 4, 0, 0] }, barWidth: '18%' },
      { name: '过路费', type: 'bar' as const, data: latestCostByProvince.map((d) => d.toll), itemStyle: { color: '#7C3AED', borderRadius: [4, 4, 0, 0] }, barWidth: '18%' },
      { name: '人工', type: 'bar' as const, data: latestCostByProvince.map((d) => d.labor), itemStyle: { color: '#16A34A', borderRadius: [4, 4, 0, 0] }, barWidth: '18%' },
      { name: '仓储', type: 'bar' as const, data: latestCostByProvince.map((d) => d.warehouse), itemStyle: { color: '#DC2626', borderRadius: [4, 4, 0, 0] }, barWidth: '18%' },
    ],
  }

  const sdProvinces = [...new Set(sdData.map((d) => d.province))].slice(0, 5)
  const sdDates = [...new Set(sdData.map((d) => d.period))].sort().slice(-8)

  const lineOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['货运需求', '运力供给', '均价'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 60, right: 60, top: 40, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: sdDates.map((d) => d.substring(5)),
      axisLabel: { color: '#6B7280', fontSize: 11 },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      boundaryGap: false,
    },
    yAxis: [
      { type: 'value' as const, name: '数量', axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#F3F4F6' } } },
      { type: 'value' as const, name: '均价(元)', axisLabel: { color: '#6B7280' }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '货运需求',
        type: 'line' as const,
        data: sdDates.map((d) => sdData.filter((s) => s.period === d).reduce((sum, s) => sum + s.cargo_demand, 0)),
        smooth: true, symbol: 'circle', symbolSize: 4,
        lineStyle: { color: '#E8722A', width: 2 },
        itemStyle: { color: '#E8722A' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(232,114,42,0.2)' }, { offset: 1, color: 'rgba(232,114,42,0.02)' }]) },
      },
      {
        name: '运力供给',
        type: 'line' as const,
        data: sdDates.map((d) => sdData.filter((s) => s.period === d).reduce((sum, s) => sum + s.vehicle_supply, 0)),
        smooth: true, symbol: 'circle', symbolSize: 4,
        lineStyle: { color: '#1B2A4A', width: 2 },
        itemStyle: { color: '#1B2A4A' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(27,42,74,0.15)' }, { offset: 1, color: 'rgba(27,42,74,0.02)' }]) },
      },
      {
        name: '均价',
        type: 'line' as const, yAxisIndex: 1,
        data: sdDates.map((d) => { const items = sdData.filter((s) => s.period === d); return items.length > 0 ? Math.round(items.reduce((sum, s) => sum + s.avg_price, 0) / items.length) : null }),
        smooth: true, symbol: 'diamond', symbolSize: 4,
        lineStyle: { color: '#7C3AED', width: 2 },
        itemStyle: { color: '#7C3AED' },
      },
    ],
  }

  const latestSdByProvince = [...new Set(sdData.map((d) => d.province))].map((prov) => {
    const items = sdData.filter((s) => s.province === prov)
    const latest = items[items.length - 1]
    return { province: prov, demand: latest?.cargo_demand ?? 0, supply: latest?.vehicle_supply ?? 0, price: latest?.avg_price ?? 0, days: latest?.avg_transit_days ?? 0 }
  }).sort((a, b) => b.demand - a.demand)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1B2A4A]">数据看板</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className="h-6 w-6" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-[#1B2A4A]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
            <TrendingUp className="h-4 w-4 text-[#E8722A]" />
            区域物流成本指数（最新月度）
          </h3>
          <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 320 }} />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
            <TrendingDown className="h-4 w-4 text-[#1B2A4A]" />
            运力供需趋势与均价
          </h3>
          <ReactEChartsCore echarts={echarts} option={lineOption} style={{ height: 320 }} />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-[#1B2A4A]">各省供需比与均价概览</h3>
        {latestSdByProvince.length === 0 ? (
          <div className="py-12 text-center text-gray-400">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F5F6FA]">
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">省份</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">货运需求</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">运力供给</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">供需比</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">均价(元)</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">平均时效(天)</th>
                </tr>
              </thead>
              <tbody>
                {latestSdByProvince.map((d, i) => {
                  const ratio = d.supply > 0 ? (d.demand / d.supply).toFixed(2) : '-'
                  const ratioNum = parseFloat(ratio as string)
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-700 font-medium">{d.province}</td>
                      <td className="px-4 py-3 text-[#E8722A] font-medium">{d.demand.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[#1B2A4A] font-medium">{d.supply.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${isNaN(ratioNum) || ratioNum <= 1 ? 'bg-red-100 text-red-600' : ratioNum <= 1.5 ? 'bg-orange-100 text-[#E8722A]' : 'bg-green-100 text-green-600'}`}>
                          {ratio}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">¥{d.price.toFixed(0)}</td>
                      <td className="px-4 py-3 text-gray-700">{d.days}天</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
