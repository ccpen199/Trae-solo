import { useState } from 'react'
import { Card, Row, Col, Statistic, Select, DatePicker, Space } from 'antd'
import { DollarOutlined, RiseOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { formatMoney } from '@/utils'

const trendOption = {
  title: { text: '收益趋势', left: 'center' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['充电收入', '服务费收入'], bottom: 0 },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value',
    name: '元'
  },
  series: [
    {
      name: '充电收入',
      type: 'line',
      smooth: true,
      data: [125600, 148200, 132500, 168900, 189500, 215600],
      itemStyle: { color: '#5470c6' },
      areaStyle: { opacity: 0.3 }
    },
    {
      name: '服务费收入',
      type: 'line',
      smooth: true,
      data: [12560, 14820, 13250, 16890, 18950, 21560],
      itemStyle: { color: '#91cc75' },
      areaStyle: { opacity: 0.3 }
    }
  ]
}

const stationOption = {
  title: { text: '各场站收益占比', left: 'center' },
  tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 256800, name: '浦东充电站', itemStyle: { color: '#5470c6' } },
        { value: 198500, name: '虹桥充电站', itemStyle: { color: '#91cc75' } },
        { value: 156200, name: '徐汇充电站', itemStyle: { color: '#fac858' } },
        { value: 123600, name: '静安充电站', itemStyle: { color: '#ee6666' } },
        { value: 89300, name: '杨浦充电站', itemStyle: { color: '#73c0de' } }
      ]
    }
  ]
}

const barOption = {
  title: { text: '月度收益对比', left: 'center' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['今年', '去年'], bottom: 0 },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value',
    name: '元'
  },
  series: [
    {
      name: '今年',
      type: 'bar',
      data: [138160, 163020, 145750, 185790, 208450, 237160],
      itemStyle: { color: '#5470c6' }
    },
    {
      name: '去年',
      type: 'bar',
      data: [98500, 112300, 105600, 132800, 156200, 178900],
      itemStyle: { color: '#d4d4d4' }
    }
  ]
}

function Revenue() {
  const [timeRange, setTimeRange] = useState('month')

  const overviewData = {
    totalRevenue: 924400,
    chargingRevenue: 832300,
    serviceRevenue: 92100,
    orderCount: 15680,
    avgOrderAmount: 58.95
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <span>时间范围:</span>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 150 }}
            options={[
              { value: 'day', label: '今日' },
              { value: 'week', label: '本周' },
              { value: 'month', label: '本月' },
              { value: 'quarter', label: '本季度' },
              { value: 'year', label: '本年' }
            ]}
          />
          <DatePicker.RangePicker onChange={() => {}} />
        </Space>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总收益"
                value={overviewData.totalRevenue}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="充电收入"
                value={overviewData.chargingRevenue}
                precision={2}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="服务费收入"
                value={overviewData.serviceRevenue}
                precision={2}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="订单数"
                value={overviewData.orderCount}
                prefix={<PieChartOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card style={{ marginBottom: 16 }}>
            <ReactECharts option={trendOption} style={{ height: 350 }} />
          </Card>
          <Card>
            <ReactECharts option={barOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <ReactECharts option={stationOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Revenue
