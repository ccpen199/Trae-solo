import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { Download, Calendar, ChevronRight } from 'lucide-react'
import { supervisionData } from '@/mocks'

function QualityTrendChart() {
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderColor: '#374151',
      textStyle: { color: '#f9fafb', fontSize: 12 },
    },
    grid: { left: 50, right: 30, bottom: 30, top: 20 },
    xAxis: {
      type: 'category',
      data: supervisionData.trendData.map(d => d.month),
      axisLabel: { color: '#6b7280', fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    yAxis: {
      type: 'value',
      min: 93,
      max: 100,
      axisLabel: { color: '#6b7280', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    series: [
      {
        type: 'line',
        data: supervisionData.trendData.map(d => d.passRate),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#4ade80', width: 3 },
        itemStyle: { color: '#4ade80', borderColor: '#1f2937', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(74,222,128,0.25)' },
              { offset: 1, color: 'rgba(74,222,128,0)' },
            ],
          },
        },
        markPoint: {
          data: [
            { type: 'max', name: '最高' },
            { type: 'min', name: '最低' },
          ],
          symbolSize: 40,
          itemStyle: { color: '#D4A017' },
          label: { color: '#1f2937', fontWeight: 'bold', fontSize: 10 },
        },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 280 }} />
}

function CategoryRadarChart() {
  const categories = supervisionData.categoryStats.map(c => c.category)
  const passRates = supervisionData.categoryStats.map(c => c.passRate)
  const counts = supervisionData.categoryStats.map(c => {
    const maxCount = Math.max(...supervisionData.categoryStats.map(s => s.count))
    return Math.round((c.count / maxCount) * 100)
  })

  const option = {
    tooltip: {
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderColor: '#374151',
      textStyle: { color: '#f9fafb', fontSize: 12 },
    },
    legend: {
      data: ['合格率', '规模指数'],
      textStyle: { color: '#9ca3af', fontSize: 11 },
      bottom: 0,
    },
    radar: {
      indicator: categories.map(c => ({ name: c, max: 100 })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#d1d5db', fontSize: 11 },
      splitArea: { areaStyle: { color: ['rgba(74,222,128,0.02)', 'rgba(74,222,128,0.05)'] } },
      splitLine: { lineStyle: { color: '#374151' } },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: passRates,
            name: '合格率',
            lineStyle: { color: '#4ade80', width: 2 },
            itemStyle: { color: '#4ade80' },
            areaStyle: { color: 'rgba(74,222,128,0.15)' },
          },
          {
            value: counts,
            name: '规模指数',
            lineStyle: { color: '#D4A017', width: 2 },
            itemStyle: { color: '#D4A017' },
            areaStyle: { color: 'rgba(212,160,23,0.15)' },
          },
        ],
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 320 }} />
}

function RegionalHeatmap() {
  const categories = supervisionData.categoryStats.map(c => c.category)
  const regions = supervisionData.regionStats.map(r => r.region)

  const heatmapData: [number, number, number][] = []
  const regionBaseRates = [97.2, 98.0, 96.5, 95.8, 96.1, 94.3, 97.0, 95.5]
  const categoryOffsets = [0.3, -0.2, 0.5, -0.8, 0.1, 0.2]

  regions.forEach((_, rIdx) => {
    categories.forEach((_, cIdx) => {
      const val = regionBaseRates[rIdx] + categoryOffsets[cIdx] + (Math.random() - 0.5) * 1.5
      heatmapData.push([cIdx, rIdx, Math.round(val * 10) / 10])
    })
  })

  const option = {
    tooltip: {
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderColor: '#374151',
      textStyle: { color: '#f9fafb', fontSize: 12 },
      formatter: (params: { data: number[] }) => {
        const [cIdx, rIdx, val] = params.data
        return `${regions[rIdx]} · ${categories[cIdx]}<br/>合格率: <b>${val}%</b>`
      },
    },
    grid: { left: 100, right: 60, bottom: 40, top: 10 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#d1d5db', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    yAxis: {
      type: 'category',
      data: regions,
      axisLabel: { color: '#d1d5db', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    visualMap: {
      min: 92,
      max: 100,
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      inRange: {
        color: ['#7f1d1d', '#dc2626', '#f59e0b', '#22c55e', '#15803d'],
      },
      textStyle: { color: '#9ca3af', fontSize: 10 },
    },
    series: [
      {
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          fontSize: 9,
          color: '#e5e7eb',
          formatter: (params: { data: number[] }) => `${params.data[2]}%`,
        },
        itemStyle: { borderWidth: 2, borderColor: '#1f2937' },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 360 }} />
}

export default function SupervisionReport() {
  const [dateRange, setDateRange] = useState({ start: '2025-07', end: '2026-06' })

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-white">区域农产品质量趋势分析报告</h1>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="month"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <span className="text-gray-500">至</span>
                <input
                  type="month"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white text-sm rounded-lg transition-colors">
                <Download size={16} />
                导出PDF
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="font-serif text-lg font-semibold text-gray-200 mb-3">报告摘要</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            本报告基于{dateRange.start}至{dateRange.end}期间的农产品质量抽检数据，对全国主要农业生产区域的农产品质量状况进行了系统性分析。
            期间共完成抽检批次{supervisionData.totalBatches.toLocaleString()}批，其中已溯源{supervisionData.tracedBatches.toLocaleString()}批，
            溯源覆盖率达{supervisionData.traceRate}%。整体抽检合格率为{supervisionData.passRate}%，违规率控制在{supervisionData.violationRate}%。
            从趋势来看，合格率呈稳步上升态势，从期初的94.2%提升至期末的96.3%，累计提升2.1个百分点；
            违规数量从期初的186起下降至105起，降幅达43.5%。分品类看，粮食类合格率最高达98.2%，
            水产类合格率相对偏低为93.7%，需加强监管力度。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="font-serif text-lg font-semibold text-gray-200 mb-4">整体质量趋势</h2>
          <QualityTrendChart />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <h2 className="font-serif text-lg font-semibold text-gray-200 mb-4">品类对比分析</h2>
            <CategoryRadarChart />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <h2 className="font-serif text-lg font-semibold text-gray-200 mb-4">区域 × 品类合格率热力图</h2>
            <RegionalHeatmap />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="font-serif text-lg font-semibold text-gray-200 mb-4">关键发现</h2>
          <div className="space-y-3">
            {[
              { label: '合格率持续向好', text: '12个月内合格率从94.2%提升至96.3%，整体质量水平稳步提升，反映出监管措施的有效性。' },
              { label: '违规数量显著下降', text: '违规数量从186起降至105起，降幅43.5%，其中水产和畜牧品类仍是重点监控领域。' },
              { label: '区域差异明显', text: '黑龙江省合格率最高(98.0%)，广东省偏低(94.3%)，建议针对低合格率地区加强抽检频次和溯源覆盖率。' },
              { label: '品类分化趋势', text: '粮食类(98.2%)和茶叶类(97.5%)表现优异，水产类(93.7%)和畜牧类(94.5%)需重点关注，建议出台品类专项治理方案。' },
            ].map((finding, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                <ChevronRight size={16} className="text-gold-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-400">{finding.label}</h4>
                  <p className="text-sm text-gray-400 mt-1">{finding.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
