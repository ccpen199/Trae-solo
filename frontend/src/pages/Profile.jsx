import React, { useState, useEffect } from 'react'
import {
  Card, Row, Col, Statistic, List, Tag, Progress, Button, Tabs, Table,
  Timeline, Avatar, Space, Descriptions, Modal, Form, Input, Select, message
} from 'antd'
import {
  UserOutlined, SafetyOutlined, TagOutlined, ShoppingOutlined,
  GiftOutlined, EditOutlined, EnvironmentOutlined,
  PhoneOutlined, SettingOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [stats, setStats] = useState({
    orderCount: 0,
    couponCount: 0,
    totalSpent: 0
  })
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      loadUserStats()
    } else {
      navigate('/login')
    }
  }, [])

  const loadUserStats = async () => {
    try {
      const [ordersRes, couponsRes] = await Promise.all([
        api.get('/orders/my', { params: { pageSize: 5 } }),
        api.get('/coupons/my')
      ])

      const orders = ordersRes.data.list || []
      setRecentOrders(orders)
      
      const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.pay_amount), 0)
      setStats({
        orderCount: ordersRes.data.total || 0,
        couponCount: couponsRes.data?.length || 0,
        totalSpent
      })
    } catch (error) {
      console.error('加载用户数据失败', error)
    }
  }

  const getCreditLevel = (score) => {
    if (score >= 750) return { level: '极好', color: '#52c41a' }
    if (score >= 700) return { level: '优秀', color: '#1890ff' }
    if (score >= 650) return { level: '良好', color: '#faad14' }
    if (score >= 600) return { level: '中等', color: '#fa8c16' }
    return { level: '较低', color: '#ff4d4f' }
  }

  const handleEditProfile = async (values) => {
    try {
      const updatedUser = { ...user, ...values }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setEditModalVisible(false)
      message.success('个人信息更新成功')
    } catch (error) {
      message.error('更新失败')
    }
  }

  const getRoleName = (role) => {
    const roles = {
      admin: '系统管理员',
      merchant: '商户',
      rider: '骑手',
      user: '普通用户'
    }
    return roles[role] || '普通用户'
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      merchant: 'blue',
      rider: 'cyan',
      user: 'default'
    }
    return colors[role] || 'default'
  }

  const getDashboardLink = (role) => {
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'merchant') return '/merchant/dashboard'
    if (role === 'rider') return '/rider/dashboard'
    return '/orders'
  }

  if (!user) return <Card loading />

  const creditLevel = getCreditLevel(user.credit_score)
  const userTags = JSON.parse(user.tags || '[]')

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: '16px' }} />
              <h2 style={{ marginBottom: '8px' }}>{user.nickname}</h2>
              <Tag color={getRoleColor(user.role)}>
                {getRoleName(user.role)}
              </Tag>
              <Space style={{ marginTop: '8px', display: 'block' }}>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => navigate(getDashboardLink(user.role))}
                >
                  {user.role === 'admin' ? '管理后台' :
                   user.role === 'merchant' ? '商户工作台' :
                   user.role === 'rider' ? '骑手工作台' : '我的订单'}
                </Button>
                <Button icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
                  编辑资料
                </Button>
              </Space>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="手机号">{user.phone}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{user.created_at?.split(' ')[0] || '2026-01-01'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={16}>
          <Card title="信用中心" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="dashboard"
                    percent={Math.min(100, user.credit_score / 8.5)}
                    format={() => user.credit_score}
                    strokeColor={creditLevel.color}
                  />
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: creditLevel.color }}>
                    {creditLevel.level}
                  </div>
                  <div style={{ color: '#999', fontSize: '12px' }}>信用评分</div>
                </div>
              </Col>
              <Col span={8}>
                <Statistic
                  title="累计消费"
                  prefix="¥"
                  value={stats.totalSpent.toFixed(2)}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div style={{ marginTop: '16px' }}>
                  <Statistic
                    title="订单总数"
                    value={stats.orderCount}
                    prefix={<ShoppingOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </div>
              </Col>
              <Col span={8}>
                <Statistic
                  title="可用优惠券"
                  value={stats.couponCount}
                  prefix={<GiftOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <div style={{ marginTop: '16px' }}>
                  <Button type="link" onClick={() => navigate('/coupons')}>
                    查看全部优惠券 →
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="行为标签" style={{ marginBottom: '16px' }}>
            <Space wrap>
              {userTags.length > 0 ? userTags.map((tag, index) => (
                <Tag key={index} color="blue" icon={<TagOutlined />}>
                  {tag}
                </Tag>
              )) : (
                <span style={{ color: '#999' }}>暂无标签，系统会根据您的行为自动打标</span>
              )}
            </Space>
          </Card>

          <Card title="最近订单">
            {recentOrders.length > 0 ? (
              <List
                dataSource={recentOrders}
                renderItem={order => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => navigate(`/orders/${order.id}`)}>
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>订单号: {order.order_no}</span>
                          <Tag color={
                            order.status === 'completed' ? 'green' :
                            order.status === 'delivering' ? 'blue' :
                            order.status === 'cancelled' ? 'red' : 'orange'
                          }>
                            {order.status === 'pending' ? '待支付' :
                             order.status === 'paid' ? '已支付' :
                             order.status === 'delivering' ? '配送中' :
                             order.status === 'completed' ? '已完成' : '已取消'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          {order.items?.map((item, i) => (
                            <span key={i} style={{ marginRight: '16px' }}>
                              {item.product_name} × {item.quantity}
                            </span>
                          ))}
                          <div style={{ marginTop: '4px' }}>
                            <span>实付: ¥{order.pay_amount}</span>
                            <span style={{ marginLeft: '16px', color: '#999' }}>{order.created_at}</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无订单
                <div>
                  <Button type="primary" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>
                    去逛逛
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="权益中心">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
              <div style={{ fontWeight: 'bold' }}>新人专享礼包</div>
              <div style={{ color: '#999', fontSize: '12px' }}>新用户专享福利</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
              <div style={{ fontWeight: 'bold' }}>会员等级</div>
              <div style={{ color: '#999', fontSize: '12px' }}>查看我的等级权益</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
              <div style={{ fontWeight: 'bold' }}>积分中心</div>
              <div style={{ color: '#999', fontSize: '12px' }}>消费积分兑换好礼</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
              <div style={{ fontWeight: 'bold' }}>安全中心</div>
              <div style={{ color: '#999', fontSize: '12px' }}>账户安全与风控记录</div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="编辑个人信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleEditProfile} layout="vertical">
          <Form.Item name="nickname" label="昵称" initialValue={user.nickname}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="phone" label="手机号" initialValue={user.phone}>
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Profile
