import { useState } from 'react'
import ReactECharts from 'echarts-for-react'

const tabs = [
  { key: 'drug', label: '药品维度' },
  { key: 'reaction', label: '反应类型' },
  { key: 'severity', label: '严重程度' },
  { key: 'timeline', label: '时效趋势' },
  { key: 'duplicate', label: '重复病例' },
]

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('drug')

  const drugBarOption = {
    title: { text: '药品不良反应分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 5 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: ['阿莫西林胶囊', '布洛芬缓释胶囊', '头孢呋辛钠', '奥美拉唑肠溶胶囊', '阿司匹林肠溶片', '左氧氟沙星片'],
    },
    series: [
      {
        name: '轻度',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#00B42A' },
        data: [45, 32, 28, 22, 18, 15],
      },
      {
        name: '中度',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#FF7D00' },
        data: [25, 18, 22, 12, 10, 8],
      },
      {
        name: '重度',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#F53F3F' },
        data: [8, 5, 10, 3, 4, 2],
      },
    ],
  }

  const reactionPieOption = {
    title: { text: '不良反应类型分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        center: ['60%', '50%'],
        data: [
          { value: 68, name: '皮肤及其附件损害', itemStyle: { color: '#165DFF' } },
          { value: 52, name: '胃肠系统损害', itemStyle: { color: '#F53F3F' } },
          { value: 38, name: '全身性损害', itemStyle: { color: '#FF7D00' } },
          { value: 32, name: '神经系统损害', itemStyle: { color: '#00B42A' } },
          { value: 25, name: '呼吸系统损害', itemStyle: { color: '#722ED1' } },
          { value: 18, name: '心血管系统', itemStyle: { color: '#13C2C2' } },
          { value: 12, name: '其他', itemStyle: { color: '#8C8C8C' } },
        ],
      },
    ],
  }

  const severityTrendOption = {
    title: { text: '严重程度趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['轻度', '中度', '重度'], bottom: 5 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '轻度',
        type: 'line',
        smooth: true,
        data: [20, 25, 22, 28, 30, 32],
        itemStyle: { color: '#00B42A' },
      },
      {
        name: '中度',
        type: 'line',
        smooth: true,
        data: [12, 15, 18, 14, 16, 18],
        itemStyle: { color: '#FF7D00' },
      },
      {
        name: '重度',
        type: 'line',
        smooth: true,
        data: [3, 5, 4, 6, 5, 7],
        itemStyle: { color: '#F53F3F' },
      },
    ],
  }

  const timelineOption = {
    title: { text: '上报时效分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['<1小时', '1-6小时', '6-24小时', '1-3天', '3-7天', '>7天'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#165DFF' },
              { offset: 1, color: '#84ADFF' },
            ],
          },
        },
        data: [15, 45, 68, 42, 25, 12],
      },
    ],
  }

  const duplicateOption = {
    title: { text: '重复病例分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [
        { name: '相同药品', max: 100 },
        { name: '相同反应', max: 100 },
        { name: '相同人群', max: 100 },
        { name: '时间集中', max: 100 },
        { name: '区域集中', max: 100 },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [85, 70, 60, 45, 30],
            name: '阿莫西林',
            areaStyle: { color: 'rgba(22, 93, 255, 0.3)' },
            lineStyle: { color: '#165DFF' },
            itemStyle: { color: '#165DFF' },
          },
          {
            value: [60, 80, 75, 50, 40],
            name: '布洛芬',
            areaStyle: { color: 'rgba(245, 63, 63, 0.3)' },
            lineStyle: { color: '#F53F3F' },
            itemStyle: { color: '#F53F3F' },
          },
        ],
      },
    ],
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'drug':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <ReactECharts option={drugBarOption} style={{ height: '400px' }} />
            </div>
            <div className="card p-5">
              <ReactECharts option={reactionPieOption} style={{ height: '400px' }} />
            </div>
          </div>
        )
      case 'reaction':
        return (
          <div className="card p-5">
            <ReactECharts option={reactionPieOption} style={{ height: '500px' }} />
          </div>
        )
      case 'severity':
        return (
          <div className="card p-5">
            <ReactECharts option={severityTrendOption} style={{ height: '500px' }} />
          </div>
        )
      case 'timeline':
        return (
          <div className="card p-5">
            <ReactECharts option={timelineOption} style={{ height: '500px' }} />
          </div>
        )
      case 'duplicate':
        return (
          <div className="card p-5">
            <ReactECharts option={duplicateOption} style={{ height: '500px' }} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">分析报表</h1>
      </div>

      <div className="card">
        <div className="border-b border-gray-100">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
