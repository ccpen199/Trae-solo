import { useState } from 'react'
import { Card, Row, Col, Statistic, Select, DatePicker, Space, Tabs } from 'antd'
import {
  DollarOutlined, RiseOutlined, BarChartOutlined, ArrowUpOutlined,
  FundOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { formatMoney } from '@/utils'

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
const weeks = ['第1周', '第2周', '第3周', '第4周']
const days = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)

const monthlyCharge = [125600, 148200, 132500, 168900, 189500, 215600, 231800, 245200, 228600, 256800, 278500, 295600]
const monthlyService = [12560, 14820, 13250, 16890, 18950, 21560, 23180, 24520, 22860, 25680, 27850, 29560]

const stationRanking = [
  { name: 'G4京港澳-武汉站', value: 386200 },
  { name: 'G2京沪-济南服务区站', value: 342800 },
  { name: 'G1京哈-山海关服务区站', value: 298500 },
  { name: 'G15沈海-青岛站', value: 256800 },
  { name: 'G4京港澳-郑州站', value: 234600 },
  { name: 'G2京沪-泰安站', value: 198500 },
  { name: 'G15沈海-福州站', value: 178200 },
  { name: 'G5京昆-西安站', value: 156300 },
  { name: 'G6京藏-张家口站', value: 125800 },
  { name: 'G15沈海-厦门站', value: 108500 }
]

const stationCompare = [
  { name: 'G4京港澳-武汉站', chargeIncome: 348000, serviceIncome: 38200, utilization: 78.5, profitRate: 22.3 },
  { name: 'G2京沪-济南服务区站', chargeIncome: 308000, serviceIncome: 34800, utilization: 72.3, profitRate: 19.8 },
  { name: 'G1京哈-山海关服务区站', chargeIncome: 268000, serviceIncome: 30500, utilization: 68.2, profitRate: 18.5 },
  { name: 'G15沈海-青岛站', chargeIncome: 231000, serviceIncome: 25800, utilization: 65.8, profitRate: 16.2 }
]

const roiData = [
  { name: 'G4京港澳-武汉站', cost: 1200000, revenue: 386200, paybackMonths: 31, utilization: 78.5, profitRate: 22.3 },
  { name: 'G2京沪-济南服务区站', cost: 980000, revenue: 342800, paybackMonths: 26, utilization: 72.3, profitRate: 19.8 },
  { name: 'G1京哈-山海关服务区站', cost: 860000, revenue: 298500, paybackMonths: 28, utilization: 68.2, profitRate: 18.5 },
  { name: 'G15沈海-青岛站', cost: 720000, revenue: 256800, paybackMonths: 27, utilization: 65.8, profitRate: 16.2 },
  { name: 'G4京港澳-郑州站', cost: 650000, revenue: 234600, paybackMonths: 25, utilization: 62.5, profitRate: 15.8 },
  { name: 'G2京沪-泰安站', cost: 580000, revenue: 198500, paybackMonths: 29, utilization: 58.3, profitRate: 14.2 },
  { name: 'G15沈海-福州站', cost: 520000, revenue: 178200, paybackMonths: 28, utilization: 55.6, profitRate: 13.5 },
  { name: 'G5京昆-西安站', cost: 460000, revenue: 156300, paybackMonths: 30, utilization: 52.1, profitRate: 12.8 },
  { name: 'G6京藏-张家口站', cost: 380000, revenue: 125800, paybackMonths: 32, utilization: 48.5, profitRate: 11.2 },
  { name: 'G15沈海-厦门站', cost: 340000, revenue: 108500, paybackMonths: 33, utilization: 45.2, profitRate: 10.5 }
]

const highwayRevenue = [185600, 228500, 196800, 245600, 278200, 315800]
const cityRevenue = [142300, 168900, 152600, 186500, 212600, 245800]

const operatorRevenue = [
  { name: '国网', value: 486200 },
  { name: '特来电', value: 398500 },
  { name: '星星充电', value: 256800 },
  { name: '小桔充电', value: 186300 },
  { name: '云快充', value: 125600 }
]

function Revenue() {
  const [timeRange, setTimeRange] = useState('month')

  const getXAxisData = () => {
    switch (timeRange) {
      case 'day': return days
      case 'week': return weeks
      case 'quarter': return quarters
      default: return months
    }
  }

  const getChargeData = () => {
    switch (timeRange) {
      case 'day': return Array.from({ length: 30 }, () => Math.floor(6000 + Math.random() * 6000))
      case 'week': return [42800, 38600, 45200, 51200]
      case 'quarter': return [406300, 574000, 705600, 830900]
      default: return monthlyCharge
    }
  }

  const getServiceData = () => {
    switch (timeRange) {
      case 'day': return Array.from({ length: 30 }, () => Math.floor(600 + Math.random() * 600))
      case 'week': return [4280, 3860, 4520, 5120]
      case 'quarter': return [40630, 57400, 70560, 83090]
      default: return monthlyService
    }
  }

  const trendOption = {
    title: { text: '收益趋势分析', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['充电收入', '服务费收入'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: getXAxisData() },
    yAxis: [
      { type: 'value', name: '充电收入(元)', position: 'left' },
      { type: 'value', name: '服务费(元)', position: 'right' }
    ],
    series: [
      { name: '充电收入', type: 'line', smooth: true, data: getChargeData(), itemStyle: { color: '#1890ff' }, areaStyle: { opacity: 0.2 } },
      { name: '服务费收入', type: 'line', smooth: true, yAxisIndex: 1, data: getServiceData(), itemStyle: { color: '#fa8c16' }, areaStyle: { opacity: 0.2 } }
    ]
  }

  const rankingOption = {
    title: { text: '场站收益排名 Top10', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params: any) => `${params[0].name}<br/>收益: ¥${params[0].value.toLocaleString()}` },
    grid: { left: '25%', right: '8%', bottom: '3%', top: '12%' },
    xAxis: { type: 'value', name: '元' },
    yAxis: { type: 'category', data: stationRanking.map(s => s.name).reverse(), axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: stationRanking.map(s => s.value).reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#69c0ff' }
          ])
      },
      label: { show: true, position: 'right', formatter: (p: any) => `¥${(p.value / 10000).toFixed(1)}万`, fontSize: 11 }
    }]
  }

  const compareOption = {
    title: { text: '场站收益对比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['充电收入', '服务费收入'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: stationCompare.map(s => s.name) },
    yAxis: { type: 'value', name: '元' },
    series: [
      { name: '充电收入', type: 'bar', data: stationCompare.map(s => s.chargeIncome), itemStyle: { color: '#1890ff' } },
      { name: '服务费收入', type: 'bar', data: stationCompare.map(s => s.serviceIncome), itemStyle: { color: '#fa8c16' } }
    ]
  }

  const scatterOption = {
    title: { text: '利用率 vs 收益率散点分析', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      formatter: (params: any) => {
        const d = roiData[params.dataIndex]
        return `${d.name}<br/>利用率: ${d.utilization}%<br/>收益率: ${d.profitRate}%<br/>投资回收期: ${d.paybackMonths}月`
      }
    },
    grid: { left: '10%', right: '10%', bottom: '10%', containLabel: true },
    xAxis: { type: 'value', name: '利用率(%)', min: 40, max: 85 },
    yAxis: { type: 'value', name: '收益率(%)', min: 8, max: 25 },
    series: [{
      type: 'scatter',
      data: roiData.map(d => [d.utilization, d.profitRate]),
      symbolSize: (val: number[]) => Math.max(12, val[1] * 2),
      itemStyle: { color: '#1890ff' },
      label: { show: true, formatter: (p: any) => roiData[p.dataIndex].name.substring(0, 6), position: 'top', fontSize: 10 }
    }]
  }

  const highwayVsCityOption = {
    title: { text: '高速网络 vs 城市公共桩收益对比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['高速网络', '城市公共桩'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', name: '元' },
    series: [
      { name: '高速网络', type: 'bar', data: highwayRevenue, itemStyle: { color: '#1890ff' } },
      { name: '城市公共桩', type: 'bar', data: cityRevenue, itemStyle: { color: '#52c41a' } }
    ]
  }

  const operatorPieOption = {
    title: { text: '各运营商收益贡献占比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: operatorRevenue.map(o => ({ value: o.value, name: o.name }))
    }]
  }

  const tabItems = [
    { key: 'trend', label: '收益趋势' },
    { key: 'station', label: '场站分析' },
    { key: 'roi', label: 'ROI分析' }
  ]
  const [activeTab, setActiveTab] = useState('trend')

  const overviewData = {
    totalRevenue: 2512300,
    chargeRevenue: 2261070,
    serviceRevenue: 251230,
    avgOrderAmount: 58.95,
    yoyGrowth: 23.6
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <span>时间范围:</span>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }} options={[
            { value: 'day', label: '按日' }, { value: 'week', label: '按周' },
            { value: 'month', label: '按月' }, { value: 'quarter', label: '按季度' }
          ]} />
          <DatePicker.RangePicker onChange={() => {}} />
        </Space>
        <Row gutter={16}>
          <Col span={5}>
            <Card><Statistic title="总营收" value={overviewData.totalRevenue} precision={0} prefix={<DollarOutlined />} valueStyle={{ color: '#fa8c16' }} formatter={(v) => formatMoney(Number(v))} /></Card>
          </Col>
          <Col span={5}>
            <Card><Statistic title="充电收入" value={overviewData.chargeRevenue} precision={0} prefix={<RiseOutlined />} valueStyle={{ color: '#1890ff' }} formatter={(v) => formatMoney(Number(v))} /></Card>
          </Col>
          <Col span={5}>
            <Card><Statistic title="服务费收入" value={overviewData.serviceRevenue} precision={0} prefix={<BarChartOutlined />} valueStyle={{ color: '#52c41a' }} formatter={(v) => formatMoney(Number(v))} /></Card>
          </Col>
          <Col span={5}>
            <Card><Statistic title="平均单笔" value={overviewData.avgOrderAmount} precision={2} prefix={<FundOutlined />} valueStyle={{ color: '#722ed1' }} suffix="元" /></Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="同比增速" value={overviewData.yoyGrowth} precision={1} prefix={<ArrowUpOutlined />} suffix="%" valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab === 'trend' && (
          <>
            <Card style={{ marginBottom: 16 }}><ReactECharts option={trendOption} style={{ height: 380 }} /></Card>
            <Row gutter={16}>
              <Col span={12}><Card><ReactECharts option={highwayVsCityOption} style={{ height: 340 }} /></Card></Col>
              <Col span={12}><Card><ReactECharts option={operatorPieOption} style={{ height: 340 }} /></Card></Col>
            </Row>
          </>
        )}

        {activeTab === 'station' && (
          <Row gutter={16}>
            <Col span={12}><Card><ReactECharts option={rankingOption} style={{ height: 420 }} /></Card></Col>
            <Col span={12}><Card><ReactECharts option={compareOption} style={{ height: 420 }} /></Card></Col>
          </Row>
        )}

        {activeTab === 'roi' && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><Card><ReactECharts option={scatterOption} style={{ height: 380 }} /></Card></Col>
              <Col span={12}>
                <Card title="场站ROI数据" size="small">
                  <Row gutter={[16, 12]}>
                    {roiData.map((item) => (
                      <Col span={12} key={item.name}>
                        <Card size="small" style={{ borderColor: item.profitRate >= 18 ? '#52c41a' : item.profitRate >= 14 ? '#fa8c16' : '#f5222d' }}>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            建设成本: {formatMoney(item.cost)} | 月收益: {formatMoney(item.revenue)}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            回收期: <span style={{ color: item.paybackMonths <= 28 ? '#52c41a' : '#fa8c16' }}>{item.paybackMonths}月</span>
                            <span style={{ margin: '0 8px' }}>|</span>
                            收益率: <span style={{ color: item.profitRate >= 18 ? '#52c41a' : '#fa8c16' }}>{item.profitRate}%</span>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
            </Row>
            <Card>
              <Row gutter={16}>
                <Col span={12}><ReactECharts option={highwayVsCityOption} style={{ height: 320 }} /></Col>
                <Col span={12}><ReactECharts option={operatorPieOption} style={{ height: 320 }} /></Col>
              </Row>
            </Card>
          </>
        )}
      </Card>
    </div>
  )
}

export default Revenue
