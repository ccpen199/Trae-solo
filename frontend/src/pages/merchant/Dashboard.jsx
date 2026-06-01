import React, { useState, useEffect } from 'react'
import {
  Row, Col, Card, Button, List, message, Modal, Form, Input,
  Table, Tag, Space, Statistic, Progress, Timeline, Empty, Badge
} from 'antd'
import {
  ShopOutlined, DollarOutlined, ShoppingOutlined, UserOutlined,
  SettingOutlined, PlusOutlined, EyeOutlined, CheckOutlined,
  CloseOutlined, ClockCircleOutlined, FileTextOutlined, BarChartOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const MerchantDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [merchant, setMerchant] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderDetailVisible, setOrderDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) {
      navigate('/login')
      return
    }
    const userData = JSON.parse(savedUser)
    if (userData.role !== 'merchant' && userData.role !== 'admin') {
      message.error('无权限访问商户工作台')
      navigate('/')
      return
    }
    setUser(userData)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const merchantRes = await api.get(`/merchants/${user?.merchant_id || 1}`)
      setMerchant(merchantRes.data)
      setProducts(merchantRes.data.products || [])

      const ordersRes = await api.get('/orders/merchant', {
        params: { pageSize: 10 }
      }).catch(() => ({ data: { list: [] } }))
      setOrders(ordersRes.data?.list || [])
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderAction = async (orderId, action) => {
    try {
      await api.post(`/orders/${orderId}/status`, { status: action })
      message.success('操作成功')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待支付' },
      paid: { color: 'blue', text: '已支付' },
      confirmed: { color: 'cyan', text: '已确认' },
      delivering: { color: 'purple', text: '配送中' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' }
    }
    const s = statusMap[status] || { color: 'default', text: status }
    return <Tag color={s.color}>{s.text}</Tag>
  }

  const stats = [
    { title: '今日订单', value: orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length, icon: <ShoppingOutlined />, color: '#1890ff' },
    { title: '今日营收', value: `¥${orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((s, o) => s + o.total_amount, 0).toFixed(2)}`, icon: <DollarOutlined />, color: '#52c41a' },
    { title: '在售商品', value: products.filter(p => p.status === 'active').length, icon: <ShopOutlined />, color: '#fa8c16' },
    { title: '累计订单', value: orders.length, icon: <FileTextOutlined />, color: '#722ed1' }
  ]

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '用户',
      dataIndex: ['user', 'nickname'],
      key: 'user',
      render: (text) => text || '匿名用户'
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>¥{val?.toFixed(2)}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setOrderDetailVisible(true) }}>
            详情
          </Button>
          {record.status === 'paid' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleOrderAction(record.id, 'confirmed')}>
              确认接单
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button size="small" type="primary" icon={<ClockCircleOutlined />} onClick={() => handleOrderAction(record.id, 'delivering')}>
              开始配送
            </Button>
          )}
          {record.status === 'delivering' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleOrderAction(record.id, 'completed')}>
              完成订单
            </Button>
          )}
        </Space>
      )
    }
  ]

  if (loading) return <Card loading />

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <div style={{ width: 80, height: 80, background: '#1890ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px' }}>
                {merchant?.business_domain === 'takeout' ? '🍔' :
                 merchant?.business_domain === 'instore' ? '🏬' :
                 merchant?.business_domain === 'travel' ? '🚗' : '🏨'}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{merchant?.name}</h2>
                <p style={{ margin: '4px 0', color: '#999' }}>{merchant?.address}</p>
                <Space>
                  <Tag color="blue">
                    {merchant?.business_domain === 'takeout' ? '🍔 外卖' :
                     merchant?.business_domain === 'instore' ? '🏬 到店' :
                     merchant?.business_domain === 'travel' ? '🚗 出行' : '🏨 旅游'}
                  </Tag>
                  <Tag color="green">营业中</Tag>
                </Space>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<SettingOutlined />}>店铺设置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/merchants/${merchant?.id}`)}>
                管理商品
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        {stats.map((stat, idx) => (
          <Col span={6} key={idx}>
            <Card>
              <Row align="middle">
                <Col span={6}>
                  <div style={{ width: 48, height: 48, borderRadius: '8px', background: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                    {stat.icon}
                  </div>
                </Col>
                <Col span={18}>
                  <Statistic title={stat.title} value={stat.value} />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="订单管理" extra={<Button size="small">查看全部</Button>}>
            {orders.length > 0 ? (
              <Table
                dataSource={orders}
                columns={orderColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            ) : (
              <Empty description="暂无订单" />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="今日经营数据" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>营业时长</span>
                  <span style={{ color: '#52c41a' }}>12小时</span>
                </div>
                <Progress percent={75} status="active" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>订单完成率</span>
                  <span style={{ color: '#1890ff' }}>92%</span>
                </div>
                <Progress percent={92} strokeColor="#52c41a" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>好评率</span>
                  <span style={{ color: '#fa8c16' }}>4.8分</span>
                </div>
                <Progress percent={96} strokeColor="#faad14" />
              </div>
            </Space>
          </Card>

          <Card title="最近动态">
            <Timeline mode="left">
              <Timeline.Item color="green">
                新订单 #ORD{String(Date.now()).slice(-6)} 支付成功
              </Timeline.Item>
              <Timeline.Item color="blue">
                商品「招牌菜」库存不足 20 份
              </Timeline.Item>
              <Timeline.Item color="orange">
                收到 1 条新评价（5星好评）
              </Timeline.Item>
              <Timeline.Item color="purple">
                优惠券「新人专享」已被领取 100 次
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>

      <Modal
        title="订单详情"
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Card type="inner" title="订单信息" size="small" style={{ marginBottom: '12px' }}>
              <p><strong>订单号:</strong> {selectedOrder.order_no}</p>
              <p><strong>状态:</strong> {getStatusTag(selectedOrder.status)}</p>
              <p><strong>下单时间:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              <p><strong>配送地址:</strong> {selectedOrder.address}</p>
              <p><strong>联系电话:</strong> {selectedOrder.phone}</p>
            </Card>
            <Card type="inner" title="商品清单" size="small" style={{ marginBottom: '12px' }}>
              <List
                dataSource={selectedOrder.items || []}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.product?.name || '商品'}
                      description={`¥${item.price} × ${item.quantity}`}
                    />
                    <div>¥{(item.price * item.quantity).toFixed(2)}</div>
                  </List.Item>
                )}
              />
            </Card>
            <Card type="inner" size="small">
              <Row justify="space-between">
                <Col><span>商品金额:</span></Col>
                <Col>¥{selectedOrder.total_amount?.toFixed(2)}</Col>
              </Row>
              {selectedOrder.discount_amount > 0 && (
                <Row justify="space-between">
                  <Col><span style={{ color: '#52c41a' }}>优惠券抵扣:</span></Col>
                  <Col style={{ color: '#52c41a' }}>-¥{selectedOrder.discount_amount?.toFixed(2)}</Col>
                </Row>
              )}
              <Row justify="space-between" style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                <Col><span style={{ color: '#ff4d4f' }}>实付:</span></Col>
                <Col style={{ color: '#ff4d4f' }}>¥{selectedOrder.final_amount?.toFixed(2)}</Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MerchantDashboard
