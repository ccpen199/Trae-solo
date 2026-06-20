import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import {
  getFulfillmentMetrics,
  getTrendsData,
  getSupplyDemand,
  getCreditRanking,
  type FulfillmentMetrics,
  type TrendDataItem,
  type SupplyDemandItem,
  type CreditRankingItem
} from '@/api'

interface TopDriver {
  key: string
  rank: number
  name: string
  onTimeRate: number
  credit: number
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<FulfillmentMetrics | null>(null)
  const [trendData, setTrendData] = useState<TrendDataItem[]>([])
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([])
  const [supplyDemandData, setSupplyDemandData] = useState<SupplyDemandItem[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        getFulfillmentMetrics(),
        getTrendsData(),
        getSupplyDemand(),
        getCreditRanking(5)
      ])

      if (results[0].status === 'fulfilled') {
        const metricsRes = results[0].value
        if (metricsRes.code === 0) {
          setMetrics(metricsRes.data)
        }
      } else {
        console.error('获取履约指标失败', results[0].reason)
      }

      if (results[1].status === 'fulfilled') {
        const trendsRes = results[1].value
        if (trendsRes.code === 0) {
          setTrendData(trendsRes.data)
        }
      } else {
        console.error('获取趋势数据失败', results[1].reason)
      }

      if (results[2].status === 'fulfilled') {
        const supplyRes = results[2].value
        if (supplyRes.code === 0) {
          setSupplyDemandData(supplyRes.data)
        }
      } else {
        console.error('获取供需数据失败', results[2].reason)
      }

      if (results[3].status === 'fulfilled') {
        const creditRes = results[3].value
        if (creditRes.code === 0 && Array.isArray(creditRes.data)) {
          const drivers: TopDriver[] = creditRes.data.map((item: any, index: number) => ({
            key: String(item.driver_id ?? item.driverId ?? index),
            rank: index + 1,
            name: item.driver_name ?? item.driverName ?? `司机${index + 1}`,
            onTimeRate: Number(item.on_time_rate ?? item.onTimeRate ?? 0),
            credit: Number(item.score ?? item.credit_score ?? item.creditScore ?? 0)
          }))
          setTopDrivers(drivers)
        }
      } else {
        console.error('获取信用排名失败', results[3].reason)
      }
    } catch (error) {
      console.error('获取看板数据异常', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const trendChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['订单量', '完成量']
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数'
      }
    ],
    series: [
      {
        name: '订单量',
        type: 'bar',
        data: trendData.map(item => item.orders),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '完成量',
        type: 'bar',
        data: trendData.map(item => item.completed),
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  const onTimeRateOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      name: '准时率(%)',
      min: 90,
      max: 100
    },
    series: [
      {
        name: '准时率',
        type: 'line',
        smooth: true,
        data: trendData.map(item => item.rate),
        itemStyle: { color: '#faad14' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250, 173, 20, 0.3)' },
              { offset: 1, color: 'rgba(250, 173, 20, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  const supplyDemandOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['运力', '订单量', '缺口']
    },
    xAxis: {
      type: 'category',
      data: supplyDemandData.map(item => item.area)
    },
    yAxis: [
      {
        type: 'value',
        name: '数量'
      }
    ],
    series: [
      {
        name: '运力',
        type: 'bar',
        data: supplyDemandData.map(item => item.supply),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '订单量',
        type: 'bar',
        data: supplyDemandData.map(item => item.demand),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '缺口',
        type: 'bar',
        data: supplyDemandData.map(item => Math.abs(item.gap)),
        itemStyle: { color: '#ff4d4f' }
      }
    ]
  }

  const driverColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => (
        <Tag color={rank <= 3 ? 'gold' : 'default'}>{rank}</Tag>
      )
    },
    {
      title: '司机姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '准时率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      render: (rate: number) => `${rate}%`
    },
    {
      title: '信用分',
      dataIndex: 'credit',
      key: 'credit'
    }
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日订单总量"
              value={metrics?.total_orders || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="完成订单"
              value={metrics?.completed_orders || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="准时率"
              value={metrics?.on_time_rate || 0}
              precision={2}
              valueStyle={{ color: '#faad14' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="异常事件"
              value={metrics?.exception_count || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="订单趋势" loading={loading}>
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="活跃司机" loading={loading}>
            <Statistic
              value={metrics?.active_drivers || 0}
              valueStyle={{ color: '#1890ff' }}
              suffix="人"
            />
            <div style={{ marginTop: 16, fontSize: 13, color: '#8c8c8c' }}>
              平均配送时长: {metrics?.avg_delivery_time || 0} 分钟
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="准时率趋势" loading={loading}>
            <ReactECharts option={onTimeRateOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="司机排行榜" loading={loading}>
            <Table
              columns={driverColumns}
              dataSource={topDrivers}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="区域供需分析" loading={loading}>
            <ReactECharts option={supplyDemandOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default Dashboard
