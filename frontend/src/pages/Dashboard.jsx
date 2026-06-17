import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Progress, List, Avatar, Button, Drawer, Descriptions, Timeline, Space, Badge, Modal, message, Alert, Empty, Tooltip, Divider } from 'antd'
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
  CustomerServiceOutlined,
  RobotOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  EditOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SwapOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, orderApi, platformApi } from '../api'

function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [platformStats, setPlatformStats] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [orderRoutes, setOrderRoutes] = useState({})
  const [afterSalesList, setAfterSalesList] = useState([])
  const [compensationList, setCompensationList] = useState([])
  const [settlementList, setSettlementList] = useState([])
  const [alertPlatforms, setAlertPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeDrawer, setRouteDrawer] = useState(false)
  const [routeDetail, setRouteDetail] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [platformAlertDrawer, setPlatformAlertDrawer] = useState(false)
  const [currentAlertPlatform, setCurrentAlertPlatform] = useState(null)
  const [platformAlertOrders, setPlatformAlertOrders] = useState([])

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
        setAfterSalesList(res.data.after_sales_list || [])
        setCompensationList(res.data.compensation_list || [])
        setSettlementList(res.data.settlement_list || [])
        setAlertPlatforms(res.data.alert_platforms || [])
        
        const orders = res.data.recent_orders || []
        const routes = {}
        for (const order of orders.slice(0, 5)) {
          try {
            const routeRes = await orderApi.quote({
              distance: order.distance || 5,
              weight: order.goods_weight || 0,
              urgency: order.urgency || 'normal'
            })
            if (routeRes.success) {
              routes[order.id] = routeRes.data
            }
          } catch (e) {
            console.error('加载路由失败', order.id, e)
          }
        }
        setOrderRoutes(routes)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleViewRoute = async (order) => {
    setRouteLoading(true)
    try {
      const res = await orderApi.quote({
        distance: order.distance || 5,
        weight: order.goods_weight || 0,
        urgency: order.urgency || 'normal'
      })
      if (res.success) {
        setRouteDetail({
          order,
          allPlatforms: res.data.optimal || [],
          route: res.data.optimal?.find(r => r.platform.id === order.platform_id) || res.data.optimal?.[0],
          recommendation: res.data.reason || ''
        })
        setRouteDrawer(true)
      }
    } catch (e) {
      message.error('加载路由依据失败')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleViewPlatformAlert = async (platform) => {
    try {
      const ordersRes = await orderApi.list({ platform_id: platform.id, pageSize: 10 })
      setPlatformAlertOrders(ordersRes.success ? (ordersRes.data || []) : [])
    } catch (e) {
      setPlatformAlertOrders([])
    }
    setCurrentAlertPlatform(platform)
    setPlatformAlertDrawer(true)
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

  const toNumber = (value, fallback = 0) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
  }

  const deliveryFee5km = (platform) => (
    toNumber(platform?.base_price) + toNumber(platform?.per_km_price) * 5
  )

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
                {alertPlatforms.length > 0 && (
                  <Badge count={alertPlatforms.length} color="#ff4d4f" />
                )}
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/platforms')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {alertPlatforms.length > 0 && (
              <Alert
                message={`检测到 ${alertPlatforms.length} 个平台存在异常`}
                description={
                  <Space wrap>
                    {alertPlatforms.map(p => (
                      <Tag key={p.id} color="error" style={{ cursor: 'pointer' }} onClick={() => handleViewPlatformAlert(p)}>
                        <WarningOutlined /> {p.logo} {p.name}: {p.alert_message}
                      </Tag>
                    ))}
                  </Space>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                action={
                  <Button size="small" type="primary" ghost onClick={() => navigate('/platforms')}>
                    批量处理
                  </Button>
                }
              />
            )}
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
                    actions={hasWarning ? [
                      <Button key="orders" type="link" size="small" onClick={() => handleViewPlatformAlert(item)}>
                        异常订单
                      </Button>,
                      <Button key="aftersales" type="link" size="small" onClick={() => navigate('/after-sales')}>
                        投诉处理
                      </Button>,
                      <Button key="compensation" type="link" size="small" onClick={() => navigate('/compensation')}>
                        赔付触发
                      </Button>,
                      <Button key="reassign" type="link" size="small" onClick={() => navigate('/orders')}>
                        订单改派
                      </Button>
                    ] : []}
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
                            {item.exception_orders > 0 && (
                              <Tag color="error" size="small">
                                异常订单 {item.exception_orders}
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
                            {item.pending_aftersales_count > 0 && (
                              <Tag color="orange" style={{ margin: 0 }}>
                                售后待处理 {item.pending_aftersales_count}
                              </Tag>
                            )}
                            {item.pending_compensation_count > 0 && (
                              <Tag color="purple" style={{ margin: 0 }}>
                                待赔付 {item.pending_compensation_count}
                              </Tag>
                            )}
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
            extra={
              <Space>
                <Button type="link" size="small" icon={<ShoppingCartOutlined />} onClick={() => navigate('/price-compare')}>
                  新建订单
                </Button>
                <Button type="link" size="small" icon={<ShopOutlined />} onClick={() => navigate('/merchant')}>
                  商户看板
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card
                  size="small"
                  className="sla-card"
                  style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => navigate('/after-sales')}
                  title={
                    <Space>
                      <CustomerServiceOutlined style={{ color: '#faad14' }} />
                      <span>售后协同</span>
                      <Badge count={summary?.pending_after_sales || 0} color="#faad14" />
                    </Space>
                  }
                  extra={
                    <Button type="link" size="small">
                      全部 <RightOutlined />
                    </Button>
                  }
                >
                  {afterSalesList.length === 0 ? (
                    <Empty description="暂无待处理售后" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      size="small"
                      dataSource={afterSalesList}
                      renderItem={item => (
                        <List.Item size="small" style={{ padding: '4px 0' }}>
                          <List.Item.Meta
                            avatar={<CustomerServiceOutlined style={{ color: '#faad14' }} />}
                            title={
                              <Space size={4}>
                                <span style={{ fontSize: 12 }}>{item.order_no}</span>
                                <Tag color="orange" style={{ fontSize: 10, padding: '0 4px' }}>
                                  {item.type === 'address_change' ? '改址' : item.type === 'cancel' ? '取消' : item.type === 'complaint' ? '投诉' : '退款'}
                                </Tag>
                                {item.platform_synced ? (
                                  <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
                                    <CheckCircleOutlined /> 承运方已回执
                                  </Tag>
                                ) : (
                                  <Tag color="default" style={{ fontSize: 10, padding: '0 4px' }}>
                                    <SyncOutlined spin /> 同步中
                                  </Tag>
                                )}
                              </Space>
                            }
                            description={
                              <div style={{ fontSize: 11, color: '#666' }}>
                                <div>
                                  {item.platform_logo} {item.platform_name} · 
                                  商户同步: <span style={{ color: item.platform_synced ? '#52c41a' : '#faad14', fontWeight: 500 }}>{item.platform_synced ? '已同步' : '同步中'}</span>
                                  {item.result && (
                                    <span> · 结果: <span style={{ color: '#1677ff' }}>{item.result}</span></span>
                                  )}
                                </div>
                                <div style={{ marginTop: 2 }}>
                                  <Space size={8}>
                                    {item.type === 'address_change' && item.change_fee !== undefined && (
                                      <span>
                                        改址费: <span style={{ color: '#fa8c16', fontWeight: 500 }}>¥{item.change_fee?.toFixed(2)}</span>
                                        {item.fee_confirmed ? (
                                          <Tag color="green" style={{ marginLeft: 4, padding: '0 4px' }}>✓已确认</Tag>
                                        ) : (
                                          <Tag color="orange" style={{ marginLeft: 4, padding: '0 4px' }}>待确认</Tag>
                                        )}
                                      </span>
                                    )}
                                    {item.disposal_result && (
                                      <span style={{ color: '#722ed1' }}>
                                        承运方处置: {item.disposal_result}
                                      </span>
                                    )}
                                  </Space>
                                </div>
                                <div>提交: {dayjs(item.created_at).format('MM-DD HH:mm')}</div>
                                {item.disposed_at && (
                                  <div style={{ color: '#52c41a' }}>
                                    处置回传: {dayjs(item.disposed_at).format('MM-DD HH:mm')}
                                  </div>
                                )}
                                {item.reason && (
                                  <div style={{ color: '#999', marginTop: 2 }}>
                                    原因: {item.reason.length > 25 ? item.reason.substring(0, 25) + '...' : item.reason}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  className="compensation-card"
                  style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => navigate('/compensation')}
                  title={
                    <Space>
                      <GiftOutlined style={{ color: '#722ed1' }} />
                      <span>SLA赔付</span>
                      <Badge count={summary?.pending_compensations || 0} color="#722ed1" />
                    </Space>
                  }
                  extra={
                    <Button type="link" size="small">
                      全部 <RightOutlined />
                    </Button>
                  }
                >
                  {compensationList.length === 0 ? (
                    <Empty description="暂无待赔付" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      size="small"
                      dataSource={compensationList}
                      renderItem={item => (
                        <List.Item size="small" style={{ padding: '4px 0' }}>
                          <List.Item.Meta
                            avatar={<GiftOutlined style={{ color: '#722ed1' }} />}
                            title={
                              <Space size={4}>
                                <span style={{ fontSize: 12 }}>{item.order_no}</span>
                                <Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>
                                  {item.type === 'timeout' ? '超时' : item.type === 'loss' ? '丢件' : '投诉'}
                                </Tag>
                                <span style={{ color: '#f5222d', fontWeight: 600, fontSize: 12 }}>¥{item.amount?.toFixed(2)}</span>
                                {item.coupon_code && (
                                  <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
                                    <CheckCircleOutlined /> 已发券
                                  </Tag>
                                )}
                              </Space>
                            }
                            description={
                              <div style={{ fontSize: 11, color: '#666' }}>
                                <div>
                                  {item.platform_logo} {item.platform_name} · 
                                  券码: <span style={{ fontFamily: 'monospace', color: item.coupon_code ? '#52c41a' : '#faad14' }}>{item.coupon_code || '待生成'}</span>
                                  {item.status === 'review_pending' && (
                                    <span> · <Tag color="orange" style={{ margin: 0, padding: '0 4px' }}>待复查</Tag></span>
                                  )}
                                  {item.status === 'reviewed' && (
                                    <span> · <Tag color="green" style={{ margin: 0, padding: '0 4px' }}>已复查</Tag></span>
                                  )}
                                </div>
                                <div style={{ marginTop: 2 }}>
                                  <Space size={8}>
                                    <span>
                                      发放: <span style={{ color: item.coupon_code ? '#52c41a' : '#faad14', fontWeight: 500 }}>{item.coupon_code ? '已发放' : '待发放'}</span>
                                    </span>
                                    {item.coupon_code && (
                                      <span>
                                        核验: {item.coupon_verified ? (
                                          <Tag color="green" style={{ margin: 0, padding: '0 4px' }}>✓已核验</Tag>
                                        ) : (
                                          <Tag color="orange" style={{ margin: 0, padding: '0 4px' }}>待核验</Tag>
                                        )}
                                      </span>
                                    )}
                                    {item.coupon_sent_at && (
                                      <span style={{ color: '#52c41a' }}>
                                        发券: {dayjs(item.coupon_sent_at).format('MM-DD HH:mm')}
                                      </span>
                                    )}
                                  </Space>
                                </div>
                                <div>
                                  触发: {dayjs(item.triggered_at).format('MM-DD HH:mm')}
                                  {item.reviewed_at && (
                                    <span style={{ color: '#722ed1', marginLeft: 8 }}>
                                      复查: {dayjs(item.reviewed_at).format('MM-DD HH:mm')}
                                    </span>
                                  )}
                                </div>
                                {item.review_result && (
                                  <div style={{ color: '#722ed1', marginTop: 2 }}>
                                    <InfoCircleOutlined /> 复查记录: {item.review_result.length > 20 ? item.review_result.substring(0, 20) + '...' : item.review_result}
                                  </div>
                                )}
                                {item.reason && !item.review_result && (
                                  <div style={{ color: '#999', marginTop: 2 }}>
                                    原因: {item.reason.length > 25 ? item.reason.substring(0, 25) + '...' : item.reason}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  className="settlement-card"
                  style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => navigate('/settlement')}
                  title={
                    <Space>
                      <MoneyCollectOutlined style={{ color: '#13c2c2' }} />
                      <span>多平台结算</span>
                      {settlementList.filter(s => s.status === 'pending').length > 0 && (
                        <Badge count={settlementList.filter(s => s.status === 'pending').length} color="#faad14" />
                      )}
                    </Space>
                  }
                  extra={
                    <Space size={8}>
                      <Button type="link" size="small" onClick={e => { e.stopPropagation(); navigate('/settlement?tab=commission') }}>
                        按单抽佣
                      </Button>
                      <Button type="link" size="small" onClick={e => { e.stopPropagation(); navigate('/settlement?tab=reconciliation') }}>
                        月结对账
                      </Button>
                    </Space>
                  }
                >
                  {settlementList.length === 0 ? (
                    <Empty description="暂无待结算" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      size="small"
                      dataSource={settlementList}
                      renderItem={item => (
                        <List.Item 
                          size="small" 
                          style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
                          actions={[
                            <Button key="detail" type="link" size="small" onClick={e => { e.stopPropagation(); navigate('/settlement') }}>
                              查看明细
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<FileTextOutlined style={{ color: '#13c2c2' }} />}
                            title={
                              <Space size={4} wrap>
                                <span style={{ fontSize: 12 }}>{item.period}</span>
                                <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px' }}>
                                  {item.platform_logo} {item.platform_name}
                                </Tag>
                                {item.status === 'pending' && (
                                  <Tag color="orange" style={{ fontSize: 10, padding: '0 4px' }}>
                                    待对账
                                  </Tag>
                                )}
                                {item.status === 'reconciled' && (
                                  <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
                                    已对账
                                  </Tag>
                                )}
                                {item.status === 'paid' && (
                                  <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>
                                    已付款
                                  </Tag>
                                )}
                                {item.has_exception && (
                                  <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>
                                    <WarningOutlined /> 异常差异
                                  </Tag>
                                )}
                              </Space>
                            }
                            description={
                              <div style={{ fontSize: 11, color: '#666' }}>
                                <div style={{ marginBottom: 4 }}>
                                  {item.order_count || 0}单 · 总额 <span style={{ color: '#1677ff' }}>¥{Number(item.total_amount || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>
                                    抽佣: <span style={{ color: '#722ed1' }}>¥{Number(item.commission_amount || 0).toFixed(2)}</span>
                                    <span style={{ color: '#999', marginLeft: 4 }}>
                                      ({item.order_count ? ((item.commission_amount / item.total_amount) * 100).toFixed(1) : 0}%)
                                    </span>
                                  </span>
                                  <span style={{ color: '#fa8c16' }}>
                                    应付: ¥{Number(item.settlement_amount || 0).toFixed(2)}
                                  </span>
                                </div>
                                {item.exception_count > 0 && (
                                  <div style={{ color: '#ff4d4f', marginTop: 4, fontSize: 11 }}>
                                    <WarningOutlined /> 异常差异 {item.exception_count} 笔，差异金额 ¥{Number(item.exception_amount || 0).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  style={{ background: 'linear-gradient(135deg, #e6f4ff 0%, #fff 100%)', border: '1px solid #91caff', height: '100%', cursor: 'pointer' }}
                  onClick={() => navigate('/price-compare')}
                  title={
                    <Space>
                      <RobotOutlined style={{ color: '#1677ff' }} />
                      <span>智能比价下单</span>
                    </Space>
                  }
                  extra={
                    <Space>
                      <Button type="link" size="small" onClick={e => { e.stopPropagation(); navigate('/price-compare') }}>
                        比价引擎
                      </Button>
                      <Button type="primary" size="small" icon={<EditOutlined />} onClick={e => { e.stopPropagation(); navigate('/price-compare') }}>
                        新建
                      </Button>
                    </Space>
                  }
                >
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>当前接入运力平台</span>
                      <span style={{ fontWeight: 600, color: '#1677ff' }}>{platformStats.length} 家</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>平均准时率</span>
                      <span style={{ fontWeight: 600, color: '#52c41a' }}>
                        {platformStats.length ? (platformStats.reduce((s, p) => s + toNumber(p.on_time_rate), 0) / platformStats.length * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>平均运费(5km)</span>
                      <span style={{ fontWeight: 600, color: '#f5222d' }}>¥{platformStats.length ? (platformStats.reduce((s, p) => s + deliveryFee5km(p), 0) / platformStats.length).toFixed(2) : '0.00'}</span>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#1677ff' }}>
                      <DollarOutlined /> 今日最低成本方案
                    </div>
                    {platformStats.length > 0 && (() => {
                      const sorted = [...platformStats].sort((a, b) => deliveryFee5km(a) - deliveryFee5km(b))
                      const cheapest = sorted[0]
                      const cheapestFee = deliveryFee5km(cheapest)
                      const avgPrice = platformStats.reduce((s, p) => s + deliveryFee5km(p), 0) / platformStats.length
                      const save = Math.max(0, avgPrice - cheapestFee).toFixed(2)
                      return (
                        <div style={{ background: '#f0f5ff', padding: '8px 12px', borderRadius: 8, marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 20 }}>{cheapest.logo}</span>
                            <span style={{ fontWeight: 600 }}>{cheapest.name}</span>
                            <Tag color="green">最低成本</Tag>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#666' }}>5km标准配送</span>
                            <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{cheapestFee.toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            比平均价节省 <span style={{ color: '#52c41a' }}>¥{save}</span>
                          </div>
                        </div>
                      )
                    })()}

                    <Space style={{ marginTop: 8 }} wrap>
                      {platformStats.slice(0, 6).map(p => (
                        <Tooltip key={p.id} title={`${p.name} 饱和度${(toNumber(p.capacity_saturation) * 100).toFixed(0)}%`}>
                          <Tag color={toNumber(p.capacity_saturation) < 0.7 ? 'green' : toNumber(p.capacity_saturation) < 0.85 ? 'orange' : 'red'} style={{ margin: 0 }}>
                            {p.logo}
                          </Tag>
                        </Tooltip>
                      ))}
                    </Space>
                    <div style={{ marginTop: 12 }}>
                      <Button type="primary" block size="small" icon={<SwapOutlined />} onClick={(e) => { e.stopPropagation(); navigate('/price-compare') }}>
                        一键比价下单 →
                      </Button>
                    </div>
                  </div>
                </Card>
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
              width: 130,
              render: (text, record) => (
                <div>
                  <Space size={4}>
                    <span>{record.platform_logo}</span>
                    <span>{text}</span>
                  </Space>
                  {record.platform_capacity !== undefined && (
                    <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                      运力 {record.platform_capacity !== undefined ? (record.platform_capacity * 100).toFixed(0) : '-'}%
                      <span style={{ margin: '0 4px' }}>|</span>
                      履约 {record.platform_ontime_rate !== undefined ? (record.platform_ontime_rate * 100).toFixed(1) : '-'}%
                    </div>
                  )}
                </div>
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
              title: '候选承运方',
              width: 260,
              render: (_, record) => {
                const route = orderRoutes[record.id]
                if (!route || !route.optimal) return <span style={{ color: '#999' }}>计算中...</span>
                return (
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {route.optimal.slice(0, 3).map((r, idx) => (
                      <div key={r.platform.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        padding: '2px 6px',
                        background: r.platform.id === record.platform_id ? '#f6ffed' : idx === 0 ? '#f0f5ff' : 'transparent',
                        borderRadius: 4,
                        border: r.platform.id === record.platform_id ? '1px solid #b7eb8f' : 'none'
                      }}>
                        <Tag color={idx === 0 ? 'green' : idx === 1 ? 'blue' : 'default'} style={{ margin: 0, padding: '0 6px', minWidth: 28, textAlign: 'center' }}>
                          #{idx + 1}
                        </Tag>
                        <span style={{ fontSize: 16 }}>{r.platform.logo}</span>
                        <span style={{ fontSize: 12, fontWeight: r.platform.id === record.platform_id ? 600 : 400 }}>{r.platform.name}</span>
                        <span style={{ color: '#52c41a', fontSize: 12, marginLeft: 'auto' }}>¥{r.fee?.toFixed(0)}</span>
                        <span style={{ color: '#1677ff', fontSize: 11 }}>{r.delivery_time}分</span>
                        {r.platform.id === record.platform_id && (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                        )}
                      </div>
                    ))}
                    {route.optimal.length > 3 && (
                      <div style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>
                        还有 {route.optimal.length - 3} 家候选
                      </div>
                    )}
                  </Space>
                )
              }
            },
            {
              title: '最优选择理由',
              width: 200,
              ellipsis: true,
              render: (_, record) => {
                const route = orderRoutes[record.id]
                if (!route || !route.optimal) return <span style={{ color: '#999' }}>-</span>
                const selected = route.optimal.find(r => r.platform.id === record.platform_id) || route.optimal[0]
                const details = []
                if (selected?.score_detail) {
                  details.push(`价格${(selected.score_detail.price_score * 100).toFixed(0)}分`)
                  details.push(`时效${(selected.score_detail.time_score * 100).toFixed(0)}分`)
                  details.push(`质量${(selected.score_detail.quality_score * 100).toFixed(0)}分`)
                  details.push(`运力${(selected.score_detail.saturation_score * 100).toFixed(0)}分`)
                }
                return (
                  <Tooltip
                    title={
                      <div style={{ maxWidth: 280 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>五维评分详情</div>
                        {details.length > 0 ? (
                          <div>
                            <div>• 价格评分: {(selected.score_detail.price_score * 100).toFixed(1)}分</div>
                            <div>• 时效评分: {(selected.score_detail.time_score * 100).toFixed(1)}分</div>
                            <div>• 服务质量评分: {(selected.score_detail.quality_score * 100).toFixed(1)}分</div>
                            <div>• 运力饱和度评分: {(selected.score_detail.saturation_score * 100).toFixed(1)}分</div>
                            <div style={{ marginTop: 8, color: '#999', fontSize: 11 }}>
                              综合评分: {(selected.score * 100).toFixed(1)}分
                            </div>
                          </div>
                        ) : (
                          <span>综合评分最高</span>
                        )}
                        <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
                          {selected?.reason || route.reason || '综合最优'}
                        </div>
                      </div>
                    }
                  >
                    <div style={{ fontSize: 12, color: '#666' }}>
                      <RobotOutlined style={{ marginRight: 4, color: '#722ed1' }} />
                      综合{(selected?.score * 100).toFixed(0)}分
                      {details.length > 0 && ` · ${details.slice(0, 2).join('/')}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                      {selected?.reason?.substring(0, 18) || '综合最优'}...
                    </div>
                  </Tooltip>
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
              width: 160,
              fixed: 'right',
              render: (_, record) => (
                <Space size="small" wrap>
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewOrder(record)}>
                    详情
                  </Button>
                  <Button type="link" size="small" icon={<RobotOutlined />} onClick={() => handleViewRoute(record)}>
                    路由依据
                  </Button>
                </Space>
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

      <Drawer
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            <span>智能路由依据分析</span>
          </Space>
        }
        placement="right"
        width={650}
        open={routeDrawer}
        onClose={() => setRouteDrawer(false)}
        destroyOnHidden
        loading={routeLoading}
      >
        {routeDetail && (
          <div>
            <Alert
              message="智能路由推荐说明"
              description={routeDetail.recommendation || '基于多维度加权评分模型，综合考虑价格、时效、服务质量和运力饱和度，为您选择最优承运方'}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card title="订单参数" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>配送距离</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BarChartOutlined style={{ color: '#1677ff' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{routeDetail.order.distance}km</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>物品重量</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <SafetyOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{routeDetail.order.goods_weight || 0}kg</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>时效要求</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ClockCircleOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      {routeDetail.order.urgency === 'urgent' ? '加急' : routeDetail.order.urgency === 'normal' ? '普通' : '经济'}
                    </span>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="当前承运方评分详情" size="small" style={{ marginBottom: 16 }}>
              {routeDetail.route ? (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{routeDetail.route.platform.logo}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{routeDetail.route.platform.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>综合评分: {routeDetail.route.score ? (routeDetail.route.score * 100).toFixed(1) : '-'}分</div>
                    </div>
                  </Space>
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="运费成本">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>¥{routeDetail.route.fee?.toFixed(2)}</span>
                        <Progress
                          percent={Math.round((routeDetail.route.score_detail?.price_score || 0) * 100)}
                          size="small"
                          style={{ width: 100 }}
                          strokeColor="#52c41a"
                        />
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="预计时效">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{routeDetail.route.delivery_time}分钟</span>
                        <Progress
                          percent={Math.round((routeDetail.route.score_detail?.time_score || 0) * 100)}
                          size="small"
                          style={{ width: 100 }}
                          strokeColor="#1677ff"
                        />
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="运力饱和度">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{((routeDetail.route.platform?.capacity_saturation || 0) * 100).toFixed(0)}%</span>
                        <Progress
                          percent={Math.round((routeDetail.route.score_detail?.saturation_score || 0) * 100)}
                          size="small"
                          style={{ width: 100 }}
                          strokeColor="#722ed1"
                        />
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="历史履约率">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{((routeDetail.route.platform?.on_time_rate || 0) * 100).toFixed(1)}%</span>
                        <Progress
                          percent={Math.round((routeDetail.route.score_detail?.quality_score || 0) * 100)}
                          size="small"
                          style={{ width: 100 }}
                          strokeColor="#fa8c16"
                        />
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                  <Alert
                    message="选择理由"
                    description={routeDetail.route.reason || '综合评分最高，为最优选择'}
                    type="success"
                    showIcon
                    style={{ marginTop: 12 }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  暂无当前承运方的评分数据
                </div>
              )}
            </Card>

            <Card title="候选承运方（全平台综合对比）" size="small">
              <Table
                dataSource={routeDetail.allPlatforms}
                rowKey="platform.id"
                size="small"
                pagination={false}
                scroll={{ x: 600 }}
                rowClassName={(record) =>
                  record.platform.id === routeDetail.order.platform_id
                    ? 'table-row-selected'
                    : ''
                }
              >
                <Table.Column
                  title="平台"
                  dataIndex="platform.name"
                  key="platform"
                  render={(text, record) => (
                    <Space>
                      <span style={{ fontSize: 18 }}>{record.platform.logo}</span>
                      {text}
                      {record.platform.id === routeDetail.order.platform_id && (
                        <Tag color="green">已选择</Tag>
                      )}
                    </Space>
                  )}
                />
                <Table.Column
                  title="运费"
                  dataIndex="fee"
                  key="fee"
                  render={(val) => <span style={{ color: '#52c41a' }}>¥{val?.toFixed(2)}</span>}
                  sorter={(a, b) => a.fee - b.fee}
                />
                <Table.Column
                  title="时效(分)"
                  dataIndex="delivery_time"
                  key="time"
                  sorter={(a, b) => a.delivery_time - b.delivery_time}
                />
                <Table.Column
                  title="综合评分"
                  dataIndex="score"
                  key="score"
                  render={(val) => (
                    <span style={{ fontWeight: 600, color: val >= 0.8 ? '#52c41a' : val >= 0.6 ? '#faad14' : '#ff4d4f' }}>
                      {(val * 100).toFixed(1)}
                    </span>
                  )}
                  sorter={(a, b) => b.score - a.score}
                />
              </Table>
            </Card>

            <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
              <div><strong>评分权重说明：</strong></div>
              <div>• 加急单：时效权重40%，价格权重20%，质量权重25%，运力权重15%</div>
              <div>• 普通单：时效权重25%，价格权重35%，质量权重25%，运力权重15%</div>
              <div>• 经济单：时效权重15%，价格权重50%，质量权重25%，运力权重15%</div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span>异常平台处理 - {currentAlertPlatform?.logo} {currentAlertPlatform?.name}</span>
          </Space>
        }
        placement="right"
        width={600}
        open={platformAlertDrawer}
        onClose={() => setPlatformAlertDrawer(false)}
        destroyOnHidden
      >
        {currentAlertPlatform && (
          <div>
            <Alert
              message="平台异常预警"
              description={currentAlertPlatform.alert_message || '该平台存在异常指标，请及时处理'}
              type={currentAlertPlatform.alert_type === 'capacity' ? 'warning' : currentAlertPlatform.alert_type === 'complaint' ? 'error' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card title="异常指标详情" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="运力饱和度">
                  <Progress
                    percent={(currentAlertPlatform.capacity_saturation * 100).toFixed(0)}
                    showInfo
                    strokeColor={currentAlertPlatform.capacity_saturation > 0.85 ? '#ff4d4f' : '#faad14'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="准时率">
                  <span style={{ color: currentAlertPlatform.on_time_rate < 0.9 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
                    {(currentAlertPlatform.on_time_rate * 100).toFixed(1)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="丢件率">
                  <span style={{ color: currentAlertPlatform.loss_rate > 0.01 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
                    {(currentAlertPlatform.loss_rate * 100).toFixed(2)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="投诉率">
                  <span style={{ color: currentAlertPlatform.complaint_rate > 0.02 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
                    {(currentAlertPlatform.complaint_rate * 100).toFixed(2)}%
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="关联订单列表" size="small" style={{ marginBottom: 16 }}>
              {platformAlertOrders.length === 0 ? (
                <Empty description="暂无该平台的订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table
                  dataSource={platformAlertOrders}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: '订单号',
                      dataIndex: 'order_no',
                      width: 130,
                      render: (t) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{t}</span>
                    },
                    { title: '收件人', dataIndex: 'receiver_name', width: 70 },
                    {
                      title: '状态',
                      dataIndex: 'delivery_status',
                      width: 80,
                      render: (s) => <Tag color={statusColorMap[s]}>{statusTextMap[s] || s}</Tag>
                    },
                    {
                      title: '距离/重量',
                      width: 100,
                      render: (_, r) => (
                        <div style={{ fontSize: 11 }}>
                          <div>{r.distance}km</div>
                          <div style={{ color: '#999' }}>{r.goods_weight}kg</div>
                        </div>
                      )
                    },
                    {
                      title: '操作',
                      width: 150,
                      render: (_, r) => (
                        <Space size={4} wrap>
                          <Button size="small" type="link" onClick={() => navigate('/orders')}>
                            改派
                          </Button>
                          <Button size="small" type="link" onClick={() => navigate('/after-sales')}>
                            投诉
                          </Button>
                          <Button size="small" type="link" onClick={() => navigate('/compensation')}>
                            赔付
                          </Button>
                        </Space>
                      )
                    }
                  ]}
                />
              )}
            </Card>

            <Card title="快捷操作" size="small">
              <Space wrap>
                <Button type="primary" icon={<ReloadOutlined />} onClick={() => navigate('/platforms')}>
                  调整运力饱和度
                </Button>
                <Button icon={<SwapOutlined />} onClick={() => navigate('/orders')}>
                  批量改派订单
                </Button>
                <Button icon={<CustomerServiceOutlined />} onClick={() => navigate('/after-sales')}>
                  投诉处理中心
                </Button>
                <Button icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>
                  触发批量赔付
                </Button>
                <Button icon={<MoneyCollectOutlined />} onClick={() => navigate('/settlement')}>
                  查看月结影响
                </Button>
              </Space>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Dashboard
