import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { Package, Truck, CheckCircle, Navigation, Clock, GitMerge, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

interface Stats {
  pending_cargo: number
  idle_vehicle: number
  today_deals: number
  active_tasks: number
  totals?: { cargo: number; vehicles: number; tasks: number; users: number }
}

interface TodoItem {
  id: number
  title: string
  type: string
  created_at: string
}

interface MatchItem {
  id: number
  cargo: string
  vehicle: string
  score: number
  route: string
}

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

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
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
        if (s && typeof s === 'object') {
          setStats({
            pending_cargo: s.pending_cargo ?? 0,
            idle_vehicle: s.idle_vehicle ?? 0,
            today_deals: s.today_deals ?? 0,
            active_tasks: s.active_tasks ?? 0,
            totals: s.totals,
          })
          setTodos(Array.isArray(s.todos) ? s.todos : [])
          setMatches(Array.isArray(s.matches) ? s.matches : [])
        }

        const cd = costRes?.data ?? costRes
        setCostData(Array.isArray(cd) ? cd : [])

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
    { label: '待匹配货源', value: stats?.pending_cargo ?? 0, icon: Package, gradient: 'from-[#E8722A] to-[#F5A66B]', link: '/cargo' },
    { label: '空闲车源', value: stats?.idle_vehicle ?? 0, icon: Truck, gradient: 'from-[#1B2A4A] to-[#3B5A8A]', link: '/vehicle' },
    { label: '今日成交', value: stats?.today_deals ?? 0, icon: CheckCircle, gradient: 'from-[#16A34A] to-[#4ADE80]', link: '/contract' },
    { label: '在途任务', value: stats?.active_tasks ?? 0, icon: Navigation, gradient: 'from-[#7C3AED] to-[#A78BFA]', link: '/tracking' },
  ]

  const provinces = [...new Set(costData.map((d) => d.province))].slice(0, 5)
  const dates = [...new Set(costData.map((d) => d.date))].sort()

  const costChartOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: provinces, top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: dates.map((d) => d.substring(5)),
      axisLabel: { color: '#6B7280', fontSize: 11 },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#6B7280' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: provinces.map((prov, idx) => ({
      name: prov,
      type: 'line' as const,
      data: dates.map((d) => {
        const item = costData.find((c) => c.date === d && c.province === prov)
        return item?.index ?? null
      }),
      smooth: true,
      symbol: 'circle',
      symbolSize: 3,
      lineStyle: { width: 2 },
    })),
    color: ['#E8722A', '#1B2A4A', '#16A34A', '#7C3AED', '#DC2626'],
  }

  const sdProvinces = [...new Set(sdData.map((d) => d.province))].slice(0, 4)
  const sdDates = [...new Set(sdData.map((d) => d.period))].sort().slice(-6)

  const sdChartOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['货运需求', '运力供给'], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: sdDates.map((d) => d.substring(5)),
      axisLabel: { color: '#6B7280', fontSize: 11 },
    },
    yAxis: [
      { type: 'value' as const, name: '数量', axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#F3F4F6' } } },
      { type: 'value' as const, name: '均价(元)', axisLabel: { color: '#6B7280' }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '货运需求',
        type: 'bar' as const,
        data: sdDates.map((d) => {
          const items = sdData.filter((s) => s.period === d)
          return items.reduce((sum, s) => sum + s.cargo_demand, 0)
        }),
        itemStyle: { color: '#E8722A' },
        barWidth: 12,
      },
      {
        name: '运力供给',
        type: 'bar' as const,
        data: sdDates.map((d) => {
          const items = sdData.filter((s) => s.period === d)
          return items.reduce((sum, s) => sum + s.vehicle_supply, 0)
        }),
        itemStyle: { color: '#1B2A4A' },
        barWidth: 12,
      },
      {
        name: '均价',
        type: 'line' as const,
        yAxisIndex: 1,
        data: sdDates.map((d) => {
          const items = sdData.filter((s) => s.period === d)
          return items.length > 0 ? Math.round(items.reduce((sum, s) => sum + s.avg_price, 0) / items.length) : null
        }),
        lineStyle: { color: '#7C3AED', width: 2 },
        itemStyle: { color: '#7C3AED' },
        smooth: true,
      },
    ],
    color: ['#E8722A', '#1B2A4A', '#7C3AED'],
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1B2A4A]">工作台</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl p-5 text-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">{s.label}</p>
                <s.icon className="h-8 w-8 text-white/40" />
              </div>
              <p className="mt-2 text-3xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
            <Clock className="h-4 w-4 text-[#E8722A]" />
            待办事项
            {todos.length > 0 && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#E8722A]/10 text-[#E8722A]">{todos.length}项</span>}
          </h3>
          {todos.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">暂无待办事项</div>
          ) : (
            <div className="space-y-3">
              {todos.map((t) => (
                <div key={`${t.type}-${t.id}`} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${t.type === '货源匹配' ? 'bg-[#E8722A]' : t.type === '合同签署' ? 'bg-[#16A34A]' : 'bg-[#7C3AED]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1B2A4A] truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.type} · {t.created_at?.substring(0, 10)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
            <GitMerge className="h-4 w-4 text-[#E8722A]" />
            最新匹配推荐
            {matches.length > 0 && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#1B2A4A]/10 text-[#1B2A4A]">{matches.length}条</span>}
          </h3>
          {matches.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">暂无匹配推荐</div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B2A4A]/10">
                    <GitMerge className="h-4 w-4 text-[#1B2A4A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1B2A4A]">
                      {m.cargo} ↔ {m.vehicle}
                    </p>
                    <p className="text-xs text-gray-400">{m.route}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.score >= 80 ? 'bg-green-50 text-green-600' : m.score >= 60 ? 'bg-[#E8722A]/10 text-[#E8722A]' : 'bg-yellow-50 text-yellow-600'}`}>
                    {m.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
            <TrendingUp className="h-4 w-4 text-[#E8722A]" />
            区域物流成本指数趋势
          </h3>
          {costData.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">暂无成本指数数据</div>
          ) : (
            <ReactEChartsCore echarts={echarts} option={costChartOption} style={{ height: 280 }} />
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
            <TrendingDown className="h-4 w-4 text-[#1B2A4A]" />
            运力供需趋势与均价
          </h3>
          {sdData.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">暂无供需数据</div>
          ) : (
            <ReactEChartsCore echarts={echarts} option={sdChartOption} style={{ height: 280 }} />
          )}
        </div>
      </div>

      {stats?.totals && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-[#1B2A4A]">平台数据总览</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-[#E8722A]">{stats.totals.cargo}</p>
              <p className="text-xs text-gray-500 mt-1">货源总量</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-[#1B2A4A]">{stats.totals.vehicles}</p>
              <p className="text-xs text-gray-500 mt-1">车源总量</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-[#16A34A]">{stats.totals.tasks}</p>
              <p className="text-xs text-gray-500 mt-1">运输任务</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-[#7C3AED]">{stats.totals.users}</p>
              <p className="text-xs text-gray-500 mt-1">注册用户</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
