import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Select, Button, Progress, List, Badge, message, Empty, Modal, Form, Input, Drawer, Descriptions, Timeline, Space, Dropdown } from 'antd'
import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  RocketOutlined,
  AlertOutlined,
  EditOutlined,
  CloseOutlined,
  EyeOutlined,
  CustomerServiceOutlined,
  PhoneOutlined,
  DownOutlined,
  MoreOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi, merchantApi, afterSalesApi } from '../api'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

function MerchantDashboard() {
  const navigate = useNavigate()
  const [merchantId, setMerchantId] = useState(1)
  const [merchants, setMerchants] = useState([])
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [countdowns, setCountdowns] = useState({})
  const [addressModal, setAddressModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [afterSalesModal, setAfterSalesModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [addressForm] = Form.useForm()
  const [cancelForm] = Form.useForm()
  const [afterSalesForm] = Form.useForm()

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

  const handleViewDetail = async (order) => {
    try {
      const res = await orderApi.detail(order.id)
      if (res.success) {
        setOrderDetail(res.data)
        setDetailDrawer(true)
      }
    } catch (e) {
      message.error('加载详情失败')
    }
  }

  const handleChangeAddress = (order) => {
    setCurrentOrder(order)
    addressForm.resetFields()
    setAddressModal(true)
  }

  const submitChangeAddress = async (values) => {
    try {
      const res = await afterSalesApi.create({
        order_id: currentOrder.id,
        type: 'address_change',
        reason: values.reason,
        new_address: values.new_address
      })
      if (res.success) {
        message.success('改址申请已提交，平台正在处理')
        setAddressModal(false)
        loadData()
      }
    } catch (e) {
      message.error('提交失败')
    }
  }

  const handleCancelOrder = (order) => {
    if (order.delivery_status === 'delivering' || order.delivery_status === 'delivered') {
      message.warning('配送中或已完成的订单无法取消')
      return
    }
    setCurrentOrder(order)
    cancelForm.resetFields()
    setCancelModal(true)
  }

  const submitCancelOrder = async (values) => {
    try {
      const res = await orderApi.cancel(currentOrder.id, values.reason)
      if (res.success) {
        message.success('订单取消申请已提交')
        setCancelModal(false)
        loadData()
      }
    } catch (e) {
      message.error(e.response?.data?.message || '取消失败')
    }
  }

  const handleAfterSales = (order) => {
    setCurrentOrder(order)
    afterSalesForm.resetFields()
    setAfterSalesModal(true)
  }

  const submitAfterSales = async (values) => {
    try {
      const res = await afterSalesApi.create({
        order_id: currentOrder.id,
        type: values.type,
        reason: values.reason
      })
      if (res.success) {
        message.success('售后申请已提交')
        setAfterSalesModal(false)
        loadData()
      }
    } catch (e) {
      message.error('提交失败')
    }
  }

  const handleContactRider = (order) => {
    if (order.rider_phone) {
      message.info(`正在拨打骑手电话: ${order.rider_phone}`)
    } else {
      message.warning('暂无骑手联系方式')
    }
  }

  const getActionMenu = (order) => ({
    items: [
      { key: 'detail', icon: <EyeOutlined />, label: '查看详情', onClick: () => handleViewDetail(order) },
      { key: 'address', icon: <EditOutlined />, label: '申请改址', disabled: order.delivery_status === 'delivered' || order.delivery_status === 'cancelled', onClick: () => handleChangeAddress(order) },
      { key: 'cancel', icon: <CloseOutlined />, label: '取消订单', disabled: ['delivering', 'delivered', 'cancelled'].includes(order.delivery_status), onClick: () => handleCancelOrder(order) },
      { key: 'complaint', icon: <CustomerServiceOutlined />, label: '投诉', onClick: () => handleAfterSales(order) },
      { type: 'divider' },
      { key: 'contact', icon: <PhoneOutlined />, label: '联系骑手', disabled: !order.rider_phone, onClick: () => handleContactRider(order) }
    ]
  })

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
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Dropdown menu={getActionMenu(record)} trigger={['click']} placement="bottomRight">
            <Button type="link" size="small">
              更多 <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      )
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
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate('/price-compare')}>
            新建配送订单
          </Button>
          <Button icon={<CustomerServiceOutlined />} onClick={() => navigate('/after-sales')}>
            售后协同
          </Button>
          <Button icon={<SyncOutlined spin={loading} />} onClick={loadData}>刷新</Button>
        </Space>
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
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
          size="middle"
        />
      </Card>

      <Modal
        title="申请改址"
        open={addressModal}
        onCancel={() => setAddressModal(false)}
        footer={null}
        width={480}
      >
        {currentOrder && (
          <div>
            <Alert
              message={`订单号: ${currentOrder.order_no}`}
              description={`当前地址: ${currentOrder.receiver_address}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={addressForm} layout="vertical" onFinish={submitChangeAddress}>
              <Form.Item name="new_address" label="新配送地址" rules={[{ required: true, message: '请输入新地址' }]}>
                <TextArea rows={3} placeholder="请输入详细的新配送地址" />
              </Form.Item>
              <Form.Item name="reason" label="改址原因" rules={[{ required: true, message: '请输入改址原因' }]}>
                <TextArea rows={2} placeholder="请说明改址原因" />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setAddressModal(false)} style={{ marginRight: 8 }}>取消</Button>
                <Button type="primary" htmlType="submit">提交申请</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="取消订单"
        open={cancelModal}
        onCancel={() => setCancelModal(false)}
        footer={null}
        width={480}
      >
        {currentOrder && (
          <div>
            <Alert
              message="确认取消订单"
              description="取消后将通知运力平台，已产生的费用可能无法退还"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={cancelForm} layout="vertical" onFinish={submitCancelOrder}>
              <Form.Item name="reason" label="取消原因" rules={[{ required: true, message: '请输入取消原因' }]}>
                <TextArea rows={3} placeholder="请说明取消原因" />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setCancelModal(false)} style={{ marginRight: 8 }}>暂不取消</Button>
                <Button type="primary" danger htmlType="submit">确认取消</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="售后申请"
        open={afterSalesModal}
        onCancel={() => setAfterSalesModal(false)}
        footer={null}
        width={480}
      >
        {currentOrder && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#666' }}>订单号</div>
              <div style={{ fontFamily: 'monospace' }}>{currentOrder.order_no}</div>
            </div>
            <Form form={afterSalesForm} layout="vertical" onFinish={submitAfterSales}>
              <Form.Item name="type" label="售后类型" rules={[{ required: true }]} initialValue="complaint">
                <Radio.Group>
                  <Radio value="complaint">服务投诉</Radio>
                  <Radio value="refund">退款申请</Radio>
                  <Radio value="other">其他问题</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="reason" label="问题描述" rules={[{ required: true, message: '请描述问题' }]}>
                <TextArea rows={4} placeholder="请详细描述遇到的问题，我们将尽快为您处理" />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setAfterSalesModal(false)} style={{ marginRight: 8 }}>取消</Button>
                <Button type="primary" htmlType="submit">提交申请</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Drawer
        title="订单详情"
        placement="right"
        width={500}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {orderDetail && (
          <div>
            <Descriptions title="订单信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">
                <span style={{ fontFamily: 'monospace' }}>{orderDetail.order_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="承运平台">
                {orderDetail.platform_logo} {orderDetail.platform_name}
              </Descriptions.Item>
              <Descriptions.Item label="物品">
                {orderDetail.goods_name || '-'} ({orderDetail.goods_weight}kg)
              </Descriptions.Item>
              <Descriptions.Item label="配送距离">{orderDetail.distance}km</Descriptions.Item>
              <Descriptions.Item label="费用">
                <span style={{ color: '#1677ff', fontSize: 16, fontWeight: 600 }}>¥{orderDetail.total_fee?.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="收件人">
                {orderDetail.receiver_name} ({orderDetail.receiver_phone})
              </Descriptions.Item>
              <Descriptions.Item label="收件地址">{orderDetail.receiver_address}</Descriptions.Item>
              {orderDetail.rider_name && (
                <Descriptions.Item label="骑手">
                  {orderDetail.rider_name} 
                  {orderDetail.rider_phone && (
                    <Button type="link" size="small" icon={<PhoneOutlined />} onClick={() => handleContactRider(orderDetail)}>
                      {orderDetail.rider_phone}
                    </Button>
                  )}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'center' }} wrap>
              <Button icon={<EditOutlined />} disabled={orderDetail.delivery_status === 'delivered'} onClick={() => { setDetailDrawer(false); handleChangeAddress(orderDetail); }}>
                申请改址
              </Button>
              <Button icon={<CloseOutlined />} danger disabled={['delivering', 'delivered', 'cancelled'].includes(orderDetail.delivery_status)} onClick={() => { setDetailDrawer(false); handleCancelOrder(orderDetail); }}>
                取消订单
              </Button>
              <Button icon={<CustomerServiceOutlined />} onClick={() => { setDetailDrawer(false); handleAfterSales(orderDetail); }}>
                投诉/售后
              </Button>
            </Space>

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

export default MerchantDashboard
