import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Progress, List, Avatar } from 'antd'
import {
  ShoppingCartOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  TruckOutlined,
  ShopOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { dashboardApi, orderApi } from '../api'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [platformStats, setPlatformStats] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 30000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    try {
      const res = await dashboardApi.summary()
      if (res.success) {
        setSummary(res.data)
        setPlatformStats(res.data.platform_stats || [])
        setRecentOrders(res.data.recent_orders || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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

  const getSaturationColor = (saturation) => {
    if (saturation < 0.5) return '#52c41a'
    if (saturation < 0.8) return '#faad14'
    return '#ff4d4f'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">运营总览</h2>
        <span style={{ color: '#999' }}>今日 {dayjs().format('YYYY年MM月DD日')}</span>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="今日订单"
              value={summary?.today_orders || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="配送中"
              value={summary?.delivering_count || 0}
              prefix={<RocketOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="已完成"
              value={summary?.total_delivered || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="累计营收"
              value={summary?.total_revenue || 0}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="运力平台状态" extra={<span>{platformStats.length} 家平台</span>}>
            <List
              dataSource={platformStats}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<div style={{ fontSize: 28 }}>{item.logo}</div>}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.name}</span>
                        <Tag color={item.capacity_saturation < 0.7 ? 'green' : 'orange'}>
                          饱和度 {(item.capacity_saturation * 100).toFixed(0)}%
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Progress 
                          percent={item.capacity_saturation * 100} 
                          showInfo={false}
                          strokeColor={getSaturationColor(item.capacity_saturation)}
                          size="small"
                          style={{ marginBottom: 8 }}
                        />
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#999' }}>
                          <span>准时率 {(item.on_time_rate * 100).toFixed(1)}%</span>
                          <span>丢件率 {(item.loss_rate * 100).toFixed(2)}%</span>
                          <span>今日 {item.today_orders || 0} 单</span>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="待处理事项">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="sla-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <WarningOutlined style={{ fontSize: 24, color: '#faad14' }} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>
                        {summary?.pending_after_sales || 0}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>待处理售后</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="compensation-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GiftOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}>
                        {summary?.pending_compensations || 0}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>待赔付申请</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="settlement-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <TruckOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#13c2c2' }}>
                        {summary?.active_platforms || 0}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>活跃运力平台</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'linear-gradient(135deg, #e6f4ff 0%, #fff 100%)', border: '1px solid #91caff', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShopOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                        {summary?.active_merchants || 0}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>活跃商户</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="最近订单">
        <Table
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          size="middle"
          columns={[
            {
              title: '订单号',
              dataIndex: 'order_no',
              width: 160,
              render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
            },
            { title: '商户', dataIndex: 'merchant_name', width: 120 },
            {
              title: '平台',
              dataIndex: 'platform_name',
              width: 120,
              render: (text, record) => (
                <span>
                  {record.platform_logo} {text}
                </span>
              )
            },
            { title: '收件人', dataIndex: 'receiver_name', width: 100 },
            { title: '配送地址', dataIndex: 'receiver_address', ellipsis: true },
            {
              title: '距离',
              dataIndex: 'distance',
              width: 80,
              render: (val) => val ? `${val}km` : '-'
            },
            {
              title: '费用',
              dataIndex: 'total_fee',
              width: 100,
              render: (val) => <span style={{ color: '#1677ff', fontWeight: 500 }}>¥{val?.toFixed(2)}</span>
            },
            {
              title: '状态',
              dataIndex: 'delivery_status',
              width: 100,
              render: (status) => (
                <Tag color={statusColorMap[status]}>{statusTextMap[status] || status}</Tag>
              )
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              width: 160,
              render: (val) => dayjs(val).format('MM-DD HH:mm:ss')
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default Dashboard
