import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { api } from '@/api/client'
import { TrendingUp, Repeat, TicketCheck, ArrowLeftRight } from 'lucide-react'
import type { CityMetrics, CrossCityFlow } from '@/types'

const topCities = ['成都', '宜宾', '绵阳', '德阳']
const months = ['1月', '2月', '3月', '4月', '5月', '6月']

const baseChartTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#9494ad', fontFamily: 'DM Sans, system-ui, sans-serif' },
}

function formatGmv(n: number): string {
  if (n >= 100000000) {
    return '¥' + (n / 100000000).toFixed(2) + '亿'
  }
  if (n >= 10000) {
    return '¥' + (n / 10000).toFixed(1) + '万'
  }
  return '¥' + n.toLocaleString()
}

function GmvTrendChart({ metricsMap }: { metricsMap: Record<string, CityMetrics> }) {
  const series = topCities.map((city, idx) => {
    const m = metricsMap[city]
    return {
      name: city,
      type: 'line',
      smooth: true,
      data: m?.gmvTrend ?? [],
      lineStyle: {
        color: idx === 0 ? '#C41230' : '#D4A843',
        width: 2,
        type: idx === 0 ? 'solid' : idx === 1 ? 'dashed' : idx === 2 ? 'dotted' : 'dashed',
      },
      itemStyle: { color: idx === 0 ? '#C41230' : '#D4A843' },
      areaStyle: {
        color: idx === 0
          ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(196,18,48,0.25)' }, { offset: 1, color: 'rgba(196,18,48,0)' }] }
          : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(212,168,67,0.10)' }, { offset: 1, color: 'rgba(212,168,67,0)' }] },
      },
    }
  })

  const option = {
    ...baseChartTheme,
    tooltip: { trigger: 'axis', backgroundColor: '#2D2D3A', borderColor: '#4d4d5f', textStyle: { color: '#fff' } },
    legend: { data: topCities, textStyle: { color: '#9494ad' }, top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: '#5e5e74' } }, axisLabel: { color: '#9494ad' } },
    yAxis: { type: 'value', name: '万元', nameTextStyle: { color: '#9494ad' }, splitLine: { lineStyle: { color: '#2D2D3A' } }, axisLabel: { color: '#9494ad' } },
    series,
  }

  return (
    <div className="rounded-2xl bg-wudu-800 p-5">
      <h3 className="font-serif text-lg text-white mb-3">GMV 趋势</h3>
      <ReactECharts option={option} style={{ height: 300 }} />
    </div>
  )
}

function RepurchaseRateChart({ metrics }: { metrics: CityMetrics[] }) {
  const sorted = [...metrics].sort((a, b) => b.repurchaseRate - a.repurchaseRate)

  const option = {
    ...baseChartTheme,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#2D2D3A', borderColor: '#4d4d5f', textStyle: { color: '#fff' } },
    grid: { left: 70, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'value',
      max: 0.55,
      axisLabel: { color: '#9494ad', formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
      splitLine: { lineStyle: { color: '#2D2D3A' } },
    },
    yAxis: { type: 'category', data: sorted.map((m) => m.city), axisLine: { lineStyle: { color: '#5e5e74' } }, axisLabel: { color: '#9494ad' } },
    series: [
      {
        type: 'bar',
        data: sorted.map((m) => ({
          value: m.repurchaseRate,
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#C41230' }, { offset: 1, color: '#D4A843' }] },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: 14,
      },
      {
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#D4A843', type: 'dashed', width: 1.5 },
          data: [{ xAxis: 0.30, label: { formatter: '行业基准 30%', color: '#D4A843', fontSize: 11 } }],
        },
        data: [],
      },
    ],
  }

  return (
    <div className="rounded-2xl bg-wudu-800 p-5">
      <h3 className="font-serif text-lg text-white mb-3">复购率对比</h3>
      <ReactECharts option={option} style={{ height: 340 }} />
    </div>
  )
}

function CouponRedemptionChart({ metrics }: { metrics: CityMetrics[] }) {
  const avgRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.couponRedemptionRate, 0) / metrics.length
    : 0
  const avgTrend = metrics.length > 0
    ? metrics.reduce(
        (acc, m) => m.couponTrend.map((v, i) => (acc[i] ?? 0) + v / metrics.length),
        [] as number[]
      )
    : []

  const gaugeOption = {
    ...baseChartTheme,
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 1,
        radius: '85%',
        progress: { show: true, width: 14, itemStyle: { color: '#D4A843' } },
        axisLine: { lineStyle: { width: 14, color: [[1, '#2D2D3A']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: { valueAnimation: true, fontSize: 28, fontWeight: 'bold', color: '#D4A843', offsetCenter: [0, '10%'], formatter: (v: number) => `${(v * 100).toFixed(1)}%` },
        data: [{ value: avgRate }],
      },
    ],
  }

  const sparkOption = {
    ...baseChartTheme,
    grid: { left: 0, right: 0, top: 5, bottom: 5 },
    xAxis: { type: 'category', show: false, data: months },
    yAxis: { type: 'value', show: false, min: 0.3 },
    series: [{
      type: 'line',
      data: avgTrend,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#D4A843', width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(212,168,67,0.3)' }, { offset: 1, color: 'rgba(212,168,67,0)' }] } },
    }],
  }

  return (
    <div className="rounded-2xl bg-wudu-800 p-5">
      <h3 className="font-serif text-lg text-white mb-3">券核销率</h3>
      <ReactECharts option={gaugeOption} style={{ height: 200 }} />
      <div className="mt-2">
        <p className="text-wudu-400 text-xs mb-1">均值趋势</p>
        <ReactECharts option={sparkOption} style={{ height: 50 }} />
      </div>
    </div>
  )
}

function CrossCityFlowChart({ flows }: { flows: CrossCityFlow[] }) {
  const top6 = [...flows].sort((a, b) => b.amount - a.amount).slice(0, 6)
  const maxAmount = top6[0]?.amount ?? 1

  return (
    <div className="rounded-2xl bg-wudu-800 p-5">
      <h3 className="font-serif text-lg text-white mb-4">跨城消费流向</h3>
      <div className="space-y-3">
        {top6.map((flow) => {
          const pct = (flow.amount / maxAmount) * 100
          const isOutbound = flow.fromCity === '成都'
          return (
            <div key={`${flow.fromCity}-${flow.toCity}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-wudu-500" />
                  {flow.fromCity} → {flow.toCity}
                </span>
                <span className="text-wudu-400 text-xs">{flow.transactions.toLocaleString()} 笔</span>
              </div>
              <div className="h-2 rounded-full bg-wudu-900 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: isOutbound
                      ? 'linear-gradient(90deg, #C41230, #a80e28)'
                      : 'linear-gradient(90deg, #D4A843, #a87322)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<CityMetrics[]>([])
  const [flows, setFlows] = useState<CrossCityFlow[]>([])
  const [totalGmv, setTotalGmv] = useState(0)
  const [crossCityTransactions, setCrossCityTransactions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsData, flowsData, summaryData] = await Promise.all([
          api.dashboard.metrics(),
          api.dashboard.crossCityFlows(),
          api.dashboard.summary(),
        ])
        setMetrics(metricsData)
        setFlows(flowsData)
        setTotalGmv(summaryData.totalGmv)
        setCrossCityTransactions(summaryData.crossCityTransactions)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const metricsMap = Object.fromEntries(metrics.map((m) => [m.city, m]))
  const avgRepurchaseRate = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + m.repurchaseRate, 0) / metrics.length * 100).toFixed(1) + '%'
    : '0%'
  const avgCouponRate = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + m.couponRedemptionRate, 0) / metrics.length * 100).toFixed(1) + '%'
    : '0%'

  const topStats = [
    { label: '总GMV', value: formatGmv(totalGmv), change: '+12.3%', up: true, icon: TrendingUp },
    { label: '平均复购率', value: avgRepurchaseRate, change: '', up: true, icon: Repeat },
    { label: '券核销率', value: avgCouponRate, change: '', up: true, icon: TicketCheck },
    { label: '跨城消费', value: (crossCityTransactions / 10000).toFixed(1) + '万笔', change: '', up: true, icon: ArrowLeftRight },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-wudu-950 px-4 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wudu-950 px-4 py-8 max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl text-white mb-8">运营看板</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {topStats.map((s) => (
          <div key={s.label} className="rounded-xl bg-wudu-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-wudu-400 text-sm">{s.label}</span>
              <s.icon className="w-5 h-5 text-wudu-500" />
            </div>
            <p className="text-white text-2xl font-bold">{s.value}</p>
            {s.change && (
              <span className={`text-sm font-medium ${s.up ? 'text-jinguan-400' : 'text-shujin-600'}`}>
                {s.change}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GmvTrendChart metricsMap={metricsMap} />
        <RepurchaseRateChart metrics={metrics} />
        <CouponRedemptionChart metrics={metrics} />
        <CrossCityFlowChart flows={flows} />
      </div>
    </div>
  )
}
