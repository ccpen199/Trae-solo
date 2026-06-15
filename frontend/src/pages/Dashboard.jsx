import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Progress, List, Avatar, Button, Drawer, Descriptions, Timeline, Space, Badge, Modal, message } from 'antd'
import {
  ShoppingCartOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  TruckOutlined,
  ShopOutlined,
  EyeOutlined,
  RightOutlined,
  SafetyOutlined,
  MoneyCollectOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, orderApi, platformApi } from '../api'

function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [platformStats, setPlatformStats] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [routeInfo, setRouteInfo] = useState(null)

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

  const handleViewOrder = async (order) => {
    try {
      const res = await orderApi.detail(order.id)
      if (res.success) {
        setOrderDetail(res.data)
        const quoteRes = await orderApi.quote({
          distance: order.distance || 5,
          weight: res.data.goods_weight || 0,
          urgency: res.data.urgency || 'normal'
        })
        if (quoteRes.success) {
          setRouteInfo(quoteRes.data)
        }
        setDetailDrawer(true)
      }
    } catch (e) {
      message.error('加载订单详情失败')
    }
  }

  const urgencyMap = {
    urgent: { color: 'red', text: '加急', icon: '⚡' },
    normal: { color: 'blue', text: '普通', icon: '🚚' },
    economy: { color: 'green', text: '经济', icon: '🐢' }
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
          <Card 
            title={
              <Space>
                <TruckOutlined />
                运力平台状态
              </Space>
            } 
            extra={
              <Button type="link" size="small" onClick={() => navigate('/platforms')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <List
              dataSource={platformStats}
              renderItem={item => {
                const hasWarning = item.capacity_saturation > 0.8 || item.complaint_rate > 0.02 || item.on_time_rate < 0.9
                return (
                  <List.Item 
                    style={{ 
                      background: hasWarning ? '#fffbe6' : 'transparent',
                      borderRadius: 8,
                      padding: '8px 12px',
                      marginBottom: 8
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ position: 'relative' }}>
                          <div style={{ fontSize: 28 }}>{item.logo}</div>
                          {hasWarning && (
                            <Badge status="warning" style={{ position: 'absolute', top: -4, right: -4 }} />
                          )}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                            {hasWarning && (
                              <Tag color="warning" size="small">
                                <WarningOutlined /> 异常预警
                              </Tag>
                            )}
                          </Space>
                          <Tag color={item.capacity_saturation < 0.7 ? 'green' : item.capacity_saturation < 0.85 ? 'orange' : 'red'}>
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
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
                            <span>
                              准时率 <span style={{ color: item.on_time_rate >= 0.95 ? '#52c41a' : item.on_time_rate >= 0.9 ? '#faad14' : '#ff4d4f', fontWeight: 500 }}>
                                {(item.on_time_rate * 100).toFixed(1)}%
                              </span>
                            </span>
                            <span>
                              丢件率 <span style={{ color: item.loss_rate <= 0.01 ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
                                {(item.loss_rate * 100).toFixed(2)}%
                              </span>
                            </span>
                            <span>
                              投诉率 <span style={{ color: item.complaint_rate <= 0.015 ? '#52c41a' : item.complaint_rate <= 0.025 ? '#faad14' : '#ff4d4f', fontWeight: 500 }}>
                                {(item.complaint_rate * 100).toFixed(2)}%
                              </span>
                            </span>
                            <span style={{ color: '#999' }}>今日 {item.today_orders || 0} 单</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <Space>
                <ExclamationCircleOutlined />
                待处理事项
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="sla-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/after-sales')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CustomerServiceOutlined style={{ fontSize: 24, color: '#faad14' }} />
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>
                          {summary?.pending_after_sales || 0}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>待处理售后</div>
                      </div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                  </div>
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/after-sales')}>
                    前往处理
                  </Button>
                </div>
              </Col>
              <Col span={12}>
                <div className="compensation-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/compensation')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <GiftOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}>
                          {summary?.pending_compensations || 0}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>待赔付申请</div>
                      </div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                  </div>
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/compensation')}>
                    前往处理
                  </Button>
                </div>
              </Col>
              <Col span={12}>
                <div className="settlement-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/settlement')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <MoneyCollectOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#13c2c2' }}>
                          {summary?.active_platforms || 0}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>待月结平台</div>
                      </div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                  </div>
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/settlement')}>
                    生成结算单
                  </Button>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'linear-gradient(135deg, #e6f4ff 0%, #fff 100%)', border: '1px solid #91caff', borderRadius: 8, padding: 16, cursor: 'pointer' }} onClick={() => navigate('/merchant')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ShopOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                          {summary?.active_merchants || 0}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>商户看板</div>
                      </div>
                    </div>
                    <RightOutlined style={{ color: '#ccc' }} />
                  </div>
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/merchant')}>
                    查看配送看板
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Space>
            <ShoppingCartOutlined />
            最近订单
          </Space>
        }
        extra={
          <Button type="link" size="small" onClick={() => navigate('/orders')}>
            全部订单 <RightOutlined />
          </Button>
        }
      >
        <Table
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 1400 }}
          columns={[
            {
              title: '订单号',
              dataIndex: 'order_no',
              width: 150,
              fixed: 'left',
              render: (text) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>
            },
            { title: '商户', dataIndex: 'merchant_name', width: 100 },
            {
              title: '平台',
              dataIndex: 'platform_name',
              width: 110,
              render: (text, record) => (
                <span>
                  {record.platform_logo} {text}
                </span>
              )
            },
            { title: '收件人', dataIndex: 'receiver_name', width: 80 },
            { title: '配送地址', dataIndex: 'receiver_address', ellipsis: true, width: 180 },
            {
              title: '距离',
              dataIndex: 'distance',
              width: 70,
              render: (val) => val ? `${val}km` : '-'
            },
            {
              title: '重量',
              dataIndex: 'goods_weight',
              width: 80,
              render: (val) => val ? `${val}kg` : '-'
            },
            {
              title: '时效要求',
              dataIndex: 'urgency',
              width: 90,
              render: (val) => {
                const info = urgencyMap[val] || urgencyMap.normal
                return (
                  <Tag color={info.color}>
                    {info.icon} {info.text}
                  </Tag>
                )
              }
            },
            {
              title: '费用',
              dataIndex: 'total_fee',
              width: 90,
              render: (val) => <span style={{ color: '#1677ff', fontWeight: 500 }}>¥{val?.toFixed(2)}</span>
            },
            {
              title: '状态',
              dataIndex: 'delivery_status',
              width: 90,
              render: (status) => (
                <Tag color={statusColorMap[status]}>{statusTextMap[status] || status}</Tag>
              )
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              width: 140,
              render: (val) => dayjs(val).format('MM-DD HH:mm:ss')
            },
            {
              title: '操作',
              width: 80,
              fixed: 'right',
              render: (_, record) => (
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewOrder(record)}>
                  详情
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Drawer
        title="订单详情"
        placement="right"
        width={560}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {orderDetail && (
          <div>
            <Descriptions title="基本信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">
                <span style={{ fontFamily: 'monospace' }}>{orderDetail.order_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="商户">{orderDetail.merchant_name}</Descriptions.Item>
              <Descriptions.Item label="承运平台">
                {orderDetail.platform_logo} {orderDetail.platform_name}
              </Descriptions.Item>
              <Descriptions.Item label="物品">{orderDetail.goods_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="重量">{orderDetail.goods_weight}kg</Descriptions.Item>
              <Descriptions.Item label="距离">{orderDetail.distance}km</Descriptions.Item>
              <Descriptions.Item label="时效要求">
                {urgencyMap[orderDetail.urgency]?.icon} {urgencyMap[orderDetail.urgency]?.text}
              </Descriptions.Item>
              <Descriptions.Item label="订单费用">
                <span style={{ color: '#1677ff', fontSize: 16, fontWeight: 600 }}>¥{orderDetail.total_fee?.toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>

            {routeInfo && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <SafetyOutlined />
                    智能路由分析
                  </Space>
                } 
                style={{ marginBottom: 16 }}
              >
                <div style={{ marginBottom: 12, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    ✅ 最优承运方：{routeInfo.recommendation?.platform?.logo} {routeInfo.recommendation?.platform?.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    选择理由：{routeInfo.recommendation?.reason}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <span style={{ marginRight: 16 }}>费用：¥{routeInfo.recommendation?.fee?.toFixed(2)}</span>
                    <span>预计送达：{routeInfo.recommendation?.delivery_time}分钟</span>
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#666' }}>
                  候选承运方（按综合评分排序）：
                </div>
                {routeInfo.optimal?.slice(0, 5).map((item, idx) => (
                  <div 
                    key={item.platform.id}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: idx === 0 ? '#e6f4ff' : '#fafafa',
                      borderRadius: 6,
                      marginBottom: 6,
                      border: idx === 0 ? '1px solid #91caff' : '1px solid #f0f0f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ 
                        width: 22, height: 22, borderRadius: '50%', 
                        background: idx === 0 ? '#1677ff' : '#d9d9d9',
                        color: '#fff', fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: 18 }}>{item.platform.logo}</span>
                      <div>
                        <div style={{ fontWeight: idx === 0 ? 600 : 400 }}>{item.platform.name}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          评分 {(item.score * 100).toFixed(0)}分
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#f5222d', fontWeight: 600 }}>¥{item.fee.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{item.delivery_time}分钟</div>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            <Descriptions title="配送信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="收件人">{orderDetail.receiver_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{orderDetail.receiver_phone}</Descriptions.Item>
              <Descriptions.Item label="收件地址">{orderDetail.receiver_address}</Descriptions.Item>
              {orderDetail.rider_name && (
                <Descriptions.Item label="骑手">
                  {orderDetail.rider_name} ({orderDetail.rider_phone || '暂无'})
                </Descriptions.Item>
              )}
            </Descriptions>

            <div>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>配送轨迹</div>
              <Timeline
                items={orderDetail.tracks?.map(track => ({
                  color: track.status === 'delivered' ? 'green' : track.status === 'exception' ? 'red' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                        {dayjs(track.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                      <div style={{ fontSize: 14 }}>{track.description}</div>
                      {track.location && (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>📍 {track.location}</div>
                      )}
                    </div>
                  )
                }))}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Dashboard
