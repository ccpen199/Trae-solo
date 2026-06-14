import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { supervisionData } from '@/mocks'

function CategoryBarChart() {
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderColor: '#374151',
      textStyle: { color: '#f9fafb', fontSize: 12 },
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['批次数量', '合格率'],
      textStyle: { color: '#9ca3af', fontSize: 11 },
      top: 0,
    },
    grid: { left: 80, right: 50, bottom: 30, top: 40 },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    yAxis: {
      type: 'category',
      data: supervisionData.categoryStats.map(c => c.category),
      axisLabel: { color: '#d1d5db', fontSize: 12 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    series: [
      {
        name: '批次数量',
        type: 'bar',
        data: supervisionData.categoryStats.map(c => c.count),
        barWidth: 14,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#0D7C3E' },
              { offset: 1, color: '#4fae76' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
      },
      {
        name: '合格率',
        type: 'bar',
        data: supervisionData.categoryStats.map(c => c.passRate),
        barWidth: 14,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#D4A017' },
              { offset: 1, color: '#e8c34d' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 300 }} />
}

function TrendChart() {
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderColor: '#374151',
      textStyle: { color: '#f9fafb', fontSize: 12 },
    },
    legend: {
      data: ['合格率', '违规数量'],
      textStyle: { color: '#9ca3af', fontSize: 11 },
      top: 0,
    },
    grid: { left: 50, right: 50, bottom: 30, top: 40 },
    xAxis: {
      type: 'category',
      data: supervisionData.trendData.map(d => d.month),
      axisLabel: { color: '#6b7280', fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '合格率(%)',
        nameTextStyle: { color: '#4ade80', fontSize: 10 },
        min: 93,
        max: 100,
        axisLabel: { color: '#4ade80', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1f2937' } },
      },
      {
        type: 'value',
        name: '违规数',
        nameTextStyle: { color: '#f87171', fontSize: 10 },
        axisLabel: { color: '#f87171', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '合格率',
        type: 'line',
        data: supervisionData.trendData.map(d => d.passRate),
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#4ade80', width: 2 },
        itemStyle: { color: '#4ade80' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(74,222,128,0.2)' },
              { offset: 1, color: 'rgba(74,222,128,0)' },
            ],
          },
        },
      },
      {
        name: '违规数量',
        type: 'bar',
        data: supervisionData.trendData.map(d => d.violationCount),
        yAxisIndex: 1,
        barWidth: 16,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(248,113,113,0.6)' },
              { offset: 1, color: 'rgba(248,113,113,0.1)' },
            ],
          },
          borderRadius: [3, 3, 0, 0],
        },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 300 }} />
}

export default function SupervisionPage() {
  const kpis = [
    { label: '总批次', value: supervisionData.totalBatches.toLocaleString(), color: 'text-white', icon: FileText },
    { label: '已溯源', value: supervisionData.tracedBatches.toLocaleString(), color: 'text-green-400', icon: CheckCircle2 },
    { label: '溯源覆盖率', value: `${supervisionData.traceRate}%`, color: 'text-green-400', icon: TrendingUp },
    { label: '抽检合格率', value: `${supervisionData.passRate}%`, color: 'text-yellow-400', icon: TrendingUp },
    { label: '违规率', value: `${supervisionData.violationRate}%`, color: 'text-red-400', icon: AlertTriangle },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-white">监管数据看板</h1>
              <p className="mt-1 text-gray-400 text-sm">实时监控 · 数据驱动 · 安全保障</p>
            </div>
            <Link
              to="/supervision/report"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors"
            >
              <FileText size={16} />
              趋势报告
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 py-6">
          {kpis.map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-4 lg:p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={16} className="text-gray-400" />
                <span className="text-xs text-gray-400">{kpi.label}</span>
              </div>
              <p className={`text-2xl lg:text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-5"
          >
            <h3 className="font-serif text-base font-semibold text-gray-200 mb-4">品类统计</h3>
            <CategoryBarChart />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-5"
          >
            <h3 className="font-serif text-base font-semibold text-gray-200 mb-4">区域统计</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">区域</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">批次</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">合格率</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisionData.regionStats.map((region, idx) => (
                    <motion.tr
                      key={region.region}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-300">{region.region}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{region.count.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={region.passRate >= 97 ? 'text-green-400' : region.passRate >= 95 ? 'text-yellow-400' : 'text-red-400'}>
                          {region.passRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {region.passRate >= 97 ? (
                          <CheckCircle2 size={16} className="text-green-400 inline-block" />
                        ) : region.passRate >= 95 ? (
                          <TrendingUp size={16} className="text-yellow-400 inline-block" />
                        ) : (
                          <TrendingDown size={16} className="text-red-400 inline-block" />
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-8"
        >
          <h3 className="font-serif text-base font-semibold text-gray-200 mb-4">质量趋势</h3>
          <TrendChart />
        </motion.div>
      </div>
    </div>
  )
}
