import React, { useState, useEffect } from 'react'
import {
  Row, Col, Card, Button, List, message, Modal, Form, Input,
  Table, Tag, Space, Statistic, Progress, Timeline, Empty, Badge, Steps
} from 'antd'
import {
  CarOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  EnvironmentOutlined, PhoneOutlined, UserOutlined, SettingOutlined,
  EyeOutlined, CheckOutlined, CloseOutlined, BarChartOutlined,
  MapOutlined, DashboardOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const { Step } = Steps

const RiderDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderDetailVisible, setOrderDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [syncLocationVisible, setSyncLocationVisible] = useState(false)
  const [currentLocation, setCurrentLocation] = useState('商家门口')

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) {
      navigate('/login')
      return
    }
    const userData = JSON.parse(savedUser)
    if (userData.role !== 'rider' && userData.role !== 'admin') {
      message.error('无权限访问骑手工作台')
      navigate('/')
      return
    }
    setUser(userData)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const pendingRes = await api.get('/orders', {
        params: { status: 'delivering', pageSize: 10 }
      }).catch(() => ({ data: { list: [] } }))
      setOrders(pendingRes.data?.list || [])

      const myRes = await api.get('/orders/rider', {
        params: { pageSize: 10 }
      }).catch(() => ({ data: { list: [] } }))
      setMyOrders(myRes.data?.list || [])
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/rider/accept`)
      message.success('接单成功')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.error || '接单失败')
    }
  }

  const handleSyncLocation = async () => {
    if (!selectedOrder) return
    try {
      await api.post(`/orders/${selectedOrder.id}/track`, {
        location: currentLocation,
        latitude: 39.9042 + Math.random() * 0.01,
        longitude: 116.4074 + Math.random() * 0.01
      })
      message.success('位置已同步')
      setSyncLocationVisible(false)
    } catch (error) {
      message.error('同步失败')
    }
  }

  const handleCompleteDelivery = async (orderId) => {
    Modal.confirm({
      title: '确认送达',
      content: '确认已将商品送达用户手中？',
      onOk: async () => {
        try {
          await api.post(`/orders/${orderId}/status`, { status: 'completed' })
          message.success('订单已完成')
          loadData()
        } catch (error) {
          message.error('操作失败')
        }
      }
    })
  }

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待支付' },
      paid: { color: 'blue', text: '已支付' },
      confirmed: { color: 'cyan', text: '商家确认中' },
      delivering: { color: 'purple', text: '待接单' },
      picked_up: { color: 'gold', text: '已取货' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' }
    }
    const s = statusMap[status] || { color: 'default', text: status }
    return <Tag color={s.color}>{s.text}</Tag>
  }

  const todayEarnings = myOrders
    .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString() && o.status === 'completed')
    .reduce((s, o) => s + 5, 0)

  const stats = [
    { title: '今日接单', value: myOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length, icon: <CarOutlined />, color: '#1890ff' },
    { title: '今日收入', value: `¥${todayEarnings.toFixed(2)}`, icon: <DollarOutlined />, color: '#52c41a' },
    { title: '待取货', value: orders.filter(o => o.status === 'delivering').length, icon: <ClockCircleOutlined />, color: '#fa8c16' },
    { title: '累计完成', value: myOrders.filter(o => o.status === 'completed').length, icon: <CheckCircleOutlined />, color: '#722ed1' }
  ]

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '配送地址',
      dataIndex: 'address',
      key: 'address',
      render: (text) => (
        <div>
          <div><EnvironmentOutlined /> {text}</div>
        </div>
      )
    },
    {
      title: '用户电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => <span><PhoneOutlined /> {text}</span>
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => <span style={{ fontWeight: 'bold' }}>¥{val?.toFixed(2)}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setOrderDetailVisible(true) }}>
            详情
          </Button>
          {record.status === 'delivering' && (
            <Button size="small" type="primary" onClick={() => handleAcceptOrder(record.id)}>
              接单
            </Button>
          )}
          {record.status === 'picked_up' && (
            <>
              <Button size="small" icon={<MapOutlined />} onClick={() => { setSelectedOrder(record); setSyncLocationVisible(true) }}>
                同步位置
              </Button>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleCompleteDelivery(record.id)}>
                确认送达
              </Button>
            </>
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
              <div style={{ width: 80, height: 80, background: '#1890ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px' }}>
                🏃
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{user?.nickname || '骑手'}</h2>
                <p style={{ margin: '4px 0', color: '#999' }}>骑手ID: {user?.id || 'R001'}</p>
                <Space>
                  <Tag color="cyan">在线</Tag>
                  <Tag color="blue">配送员</Tag>
                  <Badge status="processing" text="可接单" />
                </Space>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<SettingOutlined />}>设置</Button>
              <Button type="primary" icon={<DashboardOutlined />} onClick={() => navigate('/profile')}>
                个人中心
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

      <Card title="待取货订单" style={{ marginBottom: '16px' }}>
        {orders.length > 0 ? (
          <Table
            dataSource={orders}
            columns={orderColumns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        ) : (
          <Empty description="暂无待接订单" />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="我的配送">
            {myOrders.length > 0 ? (
              <Table
                dataSource={myOrders}
                columns={orderColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            ) : (
              <Empty description="暂无配送记录" />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="配送统计" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>在线时长</span>
                  <span style={{ color: '#52c41a' }}>8小时</span>
                </div>
                <Progress percent={67} status="active" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>准时送达率</span>
                  <span style={{ color: '#1890ff' }}>98%</span>
                </div>
                <Progress percent={98} strokeColor="#52c41a" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>用户好评</span>
                  <span style={{ color: '#fa8c16' }}>4.9分</span>
                </div>
                <Progress percent={98} strokeColor="#faad14" />
              </div>
            </Space>
          </Card>

          <Card title="今日配送轨迹">
            <Steps size="small" direction="vertical" current={2}>
              <Step title="09:30" description="开始接单" icon={<CarOutlined />} />
              <Step title="10:15" description="订单 #ORD2024001 已送达" icon={<CheckOutlined />} />
              <Step title="11:20" description="订单 #ORD2024002 配送中" icon={<CarOutlined />} status="process" />
              <Step title="待配送" description="2个订单待取货" icon={<ClockCircleOutlined />} />
            </Steps>
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
              <p><strong><EnvironmentOutlined /> 配送地址:</strong> {selectedOrder.address}</p>
              <p><strong><PhoneOutlined /> 联系电话:</strong> {selectedOrder.phone}</p>
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
              <p><strong>配送费:</strong> ¥5.00</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                订单金额: ¥{selectedOrder.total_amount?.toFixed(2)}
              </p>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="同步配送位置"
        open={syncLocationVisible}
        onCancel={() => setSyncLocationVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSyncLocationVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSyncLocation}>同步位置</Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
          <p style={{ marginBottom: '16px' }}>
            当前位置: <strong>{currentLocation}</strong>
          </p>
          <Space wrap>
            <Button onClick={() => setCurrentLocation('商家门口')}>商家门口</Button>
            <Button onClick={() => setCurrentLocation('途中')}>途中</Button>
            <Button onClick={() => setCurrentLocation('用户楼下')}>用户楼下</Button>
            <Button onClick={() => setCurrentLocation('已送达')}>已送达</Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}

export default RiderDashboard
