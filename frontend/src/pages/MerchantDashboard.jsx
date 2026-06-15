import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Select, Button, Progress, List, Badge, message, Empty } from 'antd'
import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  RocketOutlined,
  AlertOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi, merchantApi } from '../api'

const { Option } = Select

function MerchantDashboard() {
  const [merchantId, setMerchantId] = useState(1)
  const [merchants, setMerchants] = useState([])
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [countdowns, setCountdowns] = useState({})

  useEffect(() => {
    loadMerchants()
  }, [])

  useEffect(() => {
    if (merchantId) {
      loadData()
      const timer = setInterval(loadData, 15000)
      return () => clearInterval(timer)
    }
  }, [merchantId])

  useEffect(() => {
    const timer = setInterval(updateCountdowns, 1000)
    return () => clearInterval(timer)
  }, [orders])

  const loadMerchants = async () => {
    try {
      const res = await merchantApi.list()
      if (res.success) {
        setMerchants(res.data)
        if (res.data.length > 0 && !merchantId) {
          setMerchantId(res.data[0].id)
        }
      }
    } catch (e) { console.error(e) }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes] = await Promise.all([
        orderApi.stats({ merchant_id: merchantId }),
        orderApi.list({ merchant_id: merchantId, pageSize: 50 })
      ])
      if (statsRes.success) setStats(statsRes.data)
      if (ordersRes.success) setOrders(ordersRes.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const updateCountdowns = () => {
    const newCountdowns = {}
    orders.forEach(order => {
      if (order.estimated_arrival_time && order.delivery_status !== 'delivered' && order.delivery_status !== 'cancelled') {
        const eta = dayjs(order.estimated_arrival_time)
        const now = dayjs()
        const diff = eta.diff(now, 'second')
        newCountdowns[order.id] = diff
      }
    })
    setCountdowns(newCountdowns)
  }

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return { text: '已超时', className: 'countdown-danger' }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const className = seconds < 600 ? 'countdown-danger' : seconds < 1800 ? 'countdown-warning' : ''
    return { text: `${mins}:${secs.toString().padStart(2, '0')}`, className }
  }

  const getUrgencyTag = (urgency) => {
    const map = {
      urgent: { color: 'red', text: '加急' },
      normal: { color: 'blue', text: '普通' },
      economy: { color: 'green', text: '经济' }
    }
    return map[urgency] || { color: 'default', text: urgency }
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.delivery_status))
  const warningOrders = orders.filter(o => {
    const cd = countdowns[o.id]
    return cd !== undefined && cd < 1800 && cd > 0 && o.delivery_status !== 'delivered'
  })
  const exceptionOrders = orders.filter(o => 
    (countdowns[o.id] !== undefined && countdowns[o.id] <= 0) || o.status === 'exception'
  )

  const statusColorMap = {
    pending: 'warning',
    assigned: 'processing',
    picked: 'processing',
    delivering: 'processing',
    delivered: 'success',
    cancelled: 'default',
    exception: 'error'
  }

  const statusTextMap = {
    pending: '待分配',
    assigned: '已分配',
    picked: '已取货',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '已取消',
    exception: '异常'
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      width: 140,
      render: (text) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>
    },
    {
      title: '平台',
      dataIndex: 'platform_name',
      width: 110,
      render: (text, record) => text ? (
        <span>{record.platform_logo} {text}</span>
      ) : <Tag color="default">待分配</Tag>
    },
    { title: '收件人', dataIndex: 'receiver_name', width: 90 },
    {
      title: '物品',
      dataIndex: 'goods_name',
      ellipsis: true,
      render: t => t || '-'
    },
    {
      title: '距离',
      dataIndex: 'distance',
      width: 80,
      render: v => v ? `${v}km` : '-'
    },
    {
      title: '时效要求',
      dataIndex: 'urgency',
      width: 80,
      render: u => {
        const tag = getUrgencyTag(u)
        return <Tag color={tag.color}>{tag.text}</Tag>
      }
    },
    {
      title: '预计送达',
      dataIndex: 'estimated_arrival_time',
      width: 150,
      render: (val, record) => {
        if (!val || record.delivery_status === 'delivered' || record.delivery_status === 'cancelled') {
          return '-'
        }
        const cd = countdowns[record.id]
        if (cd === undefined) return dayjs(val).format('HH:mm')
        const { text, className } = formatCountdown(cd)
        return (
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>{dayjs(val).format('HH:mm')}</div>
            <div className={className} style={{ fontSize: 14, fontWeight: 600 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {text}
            </div>
          </div>
        )
      }
    },
    {
      title: '配送状态',
      dataIndex: 'delivery_status',
      width: 90,
      render: (status) => (
        <Tag color={statusColorMap[status]}>{statusTextMap[status] || status}</Tag>
      )
    },
    {
      title: '费用',
      dataIndex: 'total_fee',
      width: 90,
      render: (val) => <span style={{ color: '#1677ff', fontWeight: 500 }}>¥{val?.toFixed(2)}</span>
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 className="page-title">商户配送看板</h2>
          <Select
            style={{ width: 200 }}
            value={merchantId}
            onChange={setMerchantId}
          >
            {merchants.map(m => (
              <Option key={m.id} value={m.id}>{m.name}</Option>
            ))}
          </Select>
        </div>
        <Button icon={<SyncOutlined spin={loading} />} onClick={loadData}>刷新</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="今日订单"
              value={stats?.total_orders || 0}
              prefix={<RocketOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="配送中"
              value={stats?.delivering_count || 0}
              prefix={<SyncOutlined spin style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="已送达"
              value={stats?.delivered_count || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="异常预警"
              value={exceptionOrders.length + (stats?.exception_count || 0)}
              prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#faad14' }} />
                即将超时预警
                <Badge count={warningOrders.length} style={{ backgroundColor: '#faad14' }} />
              </div>
            }
            size="small"
          >
            {warningOrders.length === 0 ? (
              <Empty description="暂无即将超时订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={warningOrders}
                renderItem={order => {
                  const cd = countdowns[order.id] || 0
                  const { text, className } = formatCountdown(cd)
                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.order_no}</span>
                            <span className={className} style={{ fontWeight: 600 }}>{text}</span>
                          </div>
                        }
                        description={
                          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                            <span>{order.platform_logo} {order.platform_name || '待分配'}</span>
                            <span>→ {order.receiver_name}</span>
                          </div>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertOutlined style={{ color: '#ff4d4f' }} />
                超时异常订单
                <Badge count={exceptionOrders.length} style={{ backgroundColor: '#ff4d4f' }} />
              </div>
            }
            size="small"
          >
            {exceptionOrders.length === 0 ? (
              <Empty description="暂无异常订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={exceptionOrders}
                renderItem={order => (
                  <List.Item style={{ background: '#fff1f0', borderRadius: 6, marginBottom: 6 }}>
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#ff4d4f', fontWeight: 500 }}>
                            {order.order_no}
                          </span>
                          <Tag color="red">已超时</Tag>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                          <span>{order.platform_logo} {order.platform_name}</span>
                          <span>{order.receiver_name}</span>
                          <span style={{ color: '#999' }}>
                            预计 {dayjs(order.estimated_arrival_time).format('HH:mm')}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="全部订单">
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
          size="middle"
        />
      </Card>
    </div>
  )
}

export default MerchantDashboard
