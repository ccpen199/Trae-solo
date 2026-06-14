import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { Plus, TrendingUp, MapPin, Tag, Filter, Search } from 'lucide-react'
import type { SupplyDemand } from '@/types'
import { supplyDemandItems } from '@/mocks'

const categories = ['全部', '蔬菜', '水果', '粮食', '畜牧', '水产']
const regions = ['全部地区', '山东省', '黑龙江省', '新疆', '上海市', '北京市', '广东省', '江苏省', '云南省', '辽宁省']

type TypeFilter = '全部' | '供给' | '需求'

function SupplyDemandCard({ item }: { item: SupplyDemand }) {
  const isSupply = item.type === 'supply'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border-l-4 ${
        isSupply ? 'border-l-primary-500' : 'border-l-gold-500'
      } p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                isSupply
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-gold-50 text-gold-700'
              }`}
            >
              {isSupply ? '供给' : '需求'}
            </span>
            <span className="text-xs bg-earth-50 text-earth-600 px-2 py-0.5 rounded">
              {item.category}
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-earth-500">
            {item.productName}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-primary-600 font-bold text-lg">
            ¥{item.price}
          </span>
          <span className="text-gray-400 text-xs">/kg</span>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-2">{item.specification}</p>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Tag size={12} />
          {item.quantity}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {item.region}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{item.publisher}</span>
        <span>{item.publishDate}</span>
      </div>

      {item.matchScore !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">匹配度</span>
            <span className="font-medium text-primary-600">{item.matchScore}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.matchScore}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-gradient-to-r from-primary-400 to-primary-600 h-1.5 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function SupplyDemandHall() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('全部')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [regionFilter, setRegionFilter] = useState('全部地区')
  const [keyword, setKeyword] = useState('')
  const [submitStatus, setSubmitStatus] = useState('可发布供给或需求信息')

  const filtered = supplyDemandItems.filter((item) => {
    if (keyword.trim()) {
      const q = keyword.trim()
      if (![item.productName, item.category, item.region, item.publisher].some((value) => value.includes(q))) return false
    }
    if (typeFilter !== '全部') {
      if (typeFilter === '供给' && item.type !== 'supply') return false
      if (typeFilter === '需求' && item.type !== 'demand') return false
    }
    if (categoryFilter !== '全部' && item.category !== categoryFilter) return false
    if (regionFilter !== '全部地区' && !item.region.includes(regionFilter)) return false
    return true
  })

  const submitMarketInfo = async (type: 'supply' | 'demand') => {
    setSubmitStatus('正在提交...')
    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          productName: type === 'supply' ? '演示供给农产品' : '演示采购需求',
          category: categoryFilter === '全部' ? '蔬菜' : categoryFilter,
          region: regionFilter === '全部地区' ? '山东省' : regionFilter,
        }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(payload.error || '提交失败')
      setSubmitStatus(`${type === 'supply' ? '供给' : '需求'}提交成功，单号 ${payload.data.id}`)
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : '提交失败')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索产品、地区、发布方"
            className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['全部', '供给', '需求'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-primary-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => submitMarketInfo('supply')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus size={16} />
            发布供给
          </button>
          <button
            onClick={() => submitMarketInfo('demand')}
            className="flex items-center gap-1.5 px-4 py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors"
          >
            <Plus size={16} />
            发布需求
          </button>
        </div>
      </div>
      <div className="mb-4 text-sm text-primary-600 bg-primary-50 border border-primary-100 rounded-lg px-4 py-2">
        {submitStatus}
      </div>

      <div className="flex flex-wrap gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="w-[calc(33.333%-0.667rem)] min-w-[300px]">
            <SupplyDemandCard item={item} />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Filter size={48} className="mx-auto mb-3 opacity-50" />
          <p>暂无符合条件的供需信息</p>
        </div>
      )}
    </div>
  )
}

function PriceTrends() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  const vegetablePrices = [3.2, 3.5, 4.1, 3.8, 4.3, 4.0]
  const fruitPrices = [5.1, 5.8, 6.2, 5.5, 6.8, 7.1]
  const grainPrices = [2.1, 2.0, 2.2, 2.3, 2.1, 2.4]

  const lineChartOption = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8f5ee',
      textStyle: { color: '#1a1a1a' },
    },
    legend: {
      data: ['蔬菜', '水果', '粮食'],
      bottom: 0,
      textStyle: { color: '#666' },
    },
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category' as const,
      data: months,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#666' },
    },
    yAxis: {
      type: 'value' as const,
      name: '元/kg',
      nameTextStyle: { color: '#999' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#666' },
    },
    series: [
      {
        name: '蔬菜',
        type: 'line',
        data: vegetablePrices,
        smooth: true,
        lineStyle: { color: '#0D7C3E', width: 2.5 },
        itemStyle: { color: '#0D7C3E' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(13,124,62,0.15)' },
              { offset: 1, color: 'rgba(13,124,62,0.01)' },
            ],
          },
        },
      },
      {
        name: '水果',
        type: 'line',
        data: fruitPrices,
        smooth: true,
        lineStyle: { color: '#D4A017', width: 2.5 },
        itemStyle: { color: '#D4A017' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(212,160,23,0.15)' },
              { offset: 1, color: 'rgba(212,160,23,0.01)' },
            ],
          },
        },
      },
      {
        name: '粮食',
        type: 'line',
        data: grainPrices,
        smooth: true,
        lineStyle: { color: '#3E2723', width: 2.5 },
        itemStyle: { color: '#3E2723' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(62,39,35,0.10)' },
              { offset: 1, color: 'rgba(62,39,35,0.01)' },
            ],
          },
        },
      },
    ],
  }

  const regionalRegions = ['山东', '黑龙江', '新疆', '云南', '江苏']
  const barChartOption = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8f5ee',
      textStyle: { color: '#1a1a1a' },
    },
    legend: {
      data: ['蔬菜', '水果', '粮食'],
      bottom: 0,
      textStyle: { color: '#666' },
    },
    grid: { top: 30, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category' as const,
      data: regionalRegions,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#666' },
    },
    yAxis: {
      type: 'value' as const,
      name: '元/kg',
      nameTextStyle: { color: '#999' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#666' },
    },
    series: [
      {
        name: '蔬菜',
        type: 'bar',
        data: [3.8, 2.9, 3.2, 3.5, 4.1],
        itemStyle: { color: '#0D7C3E', borderRadius: [4, 4, 0, 0] },
        barWidth: 20,
      },
      {
        name: '水果',
        type: 'bar',
        data: [6.2, 4.8, 7.1, 5.9, 5.5],
        itemStyle: { color: '#D4A017', borderRadius: [4, 4, 0, 0] },
        barWidth: 20,
      },
      {
        name: '粮食',
        type: 'bar',
        data: [2.3, 2.5, 2.0, 2.1, 2.4],
        itemStyle: { color: '#3E2723', borderRadius: [4, 4, 0, 0] },
        barWidth: 20,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-primary-500" />
          <h3 className="font-serif text-lg font-bold text-earth-500">
            价格趋势
          </h3>
        </div>
        <ReactECharts option={lineChartOption} style={{ height: 360 }} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-gold-500" />
          <h3 className="font-serif text-lg font-bold text-earth-500">
            区域价格对比
          </h3>
        </div>
        <ReactECharts option={barChartOption} style={{ height: 360 }} />
      </div>
    </div>
  )
}

export default function Market() {
  const [activeTab, setActiveTab] = useState<'hall' | 'price'>('hall')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-earth-500">交易市场</h1>
        <p className="text-gray-500 mt-1">供需大厅 · 智能撮合 · 价格行情</p>
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 w-fit">
        <button
          onClick={() => setActiveTab('hall')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'hall'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-primary-600'
          }`}
        >
          供需大厅
        </button>
        <button
          onClick={() => setActiveTab('price')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'price'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-primary-600'
          }`}
        >
          价格行情
        </button>
      </div>

      {activeTab === 'hall' ? <SupplyDemandHall /> : <PriceTrends />}
    </div>
  )
}
