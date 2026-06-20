import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Table, Tag, Space, Progress, Statistic, message } from 'antd'
import { ThunderboltOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import { getPendingOrders, getAvailableDrivers, autoDispatchOrder, autoDispatch, type Order } from '@/api'
import { getTrendsData, type TrendDataItem } from '@/api'

interface PendingOrder extends Order {
  key: string
  priority: 'high' | 'medium' | 'low'
  estimatedDistance: number
}

interface AvailableDriver {
  key: string
  id: string
  name: string
  vehicle_plate: string
  distance: number
  score: number
  currentLoad: number
  credit_score: number | undefined
}

const Dispatch: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
  void selectedOrder
  const [trendData, setTrendData] = useState<TrendDataItem[]>([])
  const [todayStats, setTodayStats] = useState({ totalDispatch: 0, efficiency: 0 })

  const fetchPendingOrders = async () => {
    try {
      const response = await getPendingOrders()
      if (response.code === 0) {
        const orders = response.data.list.map((item, index) => ({
          ...item,
          key: item.id,
          priority: (index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          estimatedDistance: Math.round(Math.random() * 40 + 5)
        }))
        setPendingOrders(orders)
      }
    } catch (error) {
      message.error('获取待派单列表失败')
    }
  }

  const fetchAvailableDrivers = async () => {
    try {
      const response = await getAvailableDrivers()
      if (response.code === 0) {
        const drivers = response.data.map((item) => ({
          ...item,
          key: item.id,
          distance: Math.round(Math.random() * 6 + 0.5),
          score: Math.round(Math.random() * 15 + 85),
          currentLoad: Math.floor(Math.random() * 3),
          credit_score: item.credit_score
        }))
        setAvailableDrivers(drivers)
      }
    } catch (error) {
      console.error('获取可用司机列表失败')
    }
  }

  const fetchTrendData = async () => {
    try {
      const response = await getTrendsData()
      if (response.code === 0) {
        setTrendData(response.data)
        const totalDispatch = response.data.reduce((sum, item) => sum + item.completed, 0)
        setTodayStats({ totalDispatch, efficiency: 68.5 })
      }
    } catch (error) {
      console.error('获取趋势数据失败')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([
      fetchPendingOrders(),
      fetchAvailableDrivers(),
      fetchTrendData()
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAutoDispatch = async (order: PendingOrder) => {
    setLoading(true)
    try {
      const response = await autoDispatchOrder(order.id)
      if (response.code === 0) {
        setPendingOrders(pendingOrders.filter(o => o.id !== order.id))
        message.success(`订单 ${order.order_no} 智能派单成功`)
      } else {
        message.error(response.message || '智能派单失败')
      }
    } catch (error) {
      message.error('智能派单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchDispatch = async () => {
    if (pendingOrders.length === 0) {
      message.warning('没有待派单的订单')
      return
    }
    setLoading(true)
    try {
      const response = await autoDispatch()
      if (response.code === 0) {
        setPendingOrders([])
        message.success(`批量智能派单成功，共处理 ${response.data.success} 个订单`)
      } else {
        message.error(response.message || '批量派单失败')
      }
    } catch (error) {
      message.error('批量派单失败')
    } finally {
      setLoading(false)
    }
  }

  const priorityColorMap: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  }

  const priorityTextMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }

  const orderColumns: ColumnsType<PendingOrder> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 150
    },
    {
      title: '取货地址',
      dataIndex: 'pickup_address',
      key: 'pickup_address',
      ellipsis: true
    },
    {
      title: '送货地址',
      dataIndex: 'delivery_address',
      key: 'delivery_address',
      ellipsis: true
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={priorityColorMap[priority]}>
          {priorityTextMap[priority]}
        </Tag>
      )
    },
    {
      title: '重量',
      dataIndex: 'cargo_weight',
      key: 'cargo_weight',
      width: 80,
      render: (w: number) => `${w}kg`
    },
    {
      title: '预估距离',
      dataIndex: 'estimatedDistance',
      key: 'estimatedDistance',
      width: 90,
      render: (d: number) => `${d}km`
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setSelectedOrder(record)}>
            匹配司机
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => handleAutoDispatch(record)}
          >
            智能派单
          </Button>
        </Space>
      )
    }
  ]

  const driverColumns: ColumnsType<AvailableDriver> = [
    {
      title: '司机姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '车牌号',
      dataIndex: 'vehicle_plate',
      key: 'vehicle_plate',
      width: 110
    },
    {
      title: '距离',
      dataIndex: 'distance',
      key: 'distance',
      width: 80,
      render: (d: number) => `${d}km`
    },
    {
      title: '当前负载',
      dataIndex: 'currentLoad',
      key: 'currentLoad',
      width: 100,
      render: (load: number) => (
        <Progress percent={load * 33} size="small" />
      )
    },
    {
      title: '综合评分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <span style={{ color: score >= 90 ? '#52c41a' : score >= 80 ? '#faad14' : '#ff4d4f' }}>
          {score}分
        </span>
      )
    }
  ]

  const dispatchEfficiencyOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: trendData.length > 0 ? trendData.map(item => item.date) : ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
    },
    yAxis: {
      type: 'value',
      name: '订单数'
    },
    legend: {
      data: ['手动派单', '智能派单']
    },
    series: [
      {
        name: '手动派单',
        type: 'bar',
        data: trendData.length > 0 ? trendData.map(item => Math.round(item.orders * 0.25)) : [45, 78, 92, 85, 102, 88, 65],
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '智能派单',
        type: 'bar',
        data: trendData.length > 0 ? trendData.map(item => Math.round(item.orders * 0.75)) : [120, 185, 210, 195, 230, 205, 150],
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待派单数量"
              value={pendingOrders.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="可用司机数"
              value={availableDrivers.length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日智能派单"
              value={todayStats.totalDispatch}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="派单效率提升"
              value={todayStats.efficiency}
              precision={1}
              valueStyle={{ color: '#722ed1' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="待派单列表"
        extra={
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleBatchDispatch}>
            批量智能派单
          </Button>
        }
      >
        <Table
          columns={orderColumns}
          dataSource={pendingOrders}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="可用司机列表" loading={loading}>
            <Table
              columns={driverColumns}
              dataSource={availableDrivers}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="派单效率对比" loading={loading}>
            <ReactECharts option={dispatchEfficiencyOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default Dispatch
