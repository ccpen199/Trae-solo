import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Button, Tag, message, Spin, Empty } from 'antd'
import {
  TeamOutlined,
  BookOutlined,
  DollarOutlined,
  BarChartOutlined,
  TrophyOutlined,
  UserOutlined,
  SettingOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const dashboardRes = await api.get('/stats/dashboard')
      setStats(dashboardRes.data.overview)

      const ordersRes = await api.get('/orders', { params: { limit: 5 } })
      setRecentOrders(ordersRes.data.orders || [])
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>数据概览</h1>
        <p style={{ color: '#666', margin: 0 }}>平台运营数据总览</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card blue">
            <Statistic
              title="总用户数"
              value={stats?.totalStudents || 0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card green">
            <Statistic
              title="课程总数"
              value={stats?.totalCourses || 0}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orange">
            <Statistic
              title="总收入"
              value={stats?.totalRevenue || 0}
              prefix="¥"
              suffix="元"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="颁发证书"
              value={stats?.totalCertificates || 0}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="最近订单"
            extra={
              <Button type="link" onClick={() => navigate('/orders')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {recentOrders.length > 0 ? (
              <List
                dataSource={recentOrders}
                renderItem={(order) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{order.courseTitle || order.course?.title}</span>
                          <Tag color={
                            order.paymentStatus === 'paid' ? 'success' :
                            order.paymentStatus === 'pending' ? 'warning' : 'error'
                          }>
                            {order.paymentStatus === 'paid' ? '已支付' :
                             order.paymentStatus === 'pending' ? '待支付' :
                             order.paymentStatus === 'failed' ? '支付失败' : '已退款'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          <span style={{ color: '#999' }}>订单号：{order.orderNo}</span>
                          <span style={{ marginLeft: 16, color: '#ff4d4f', fontWeight: 'bold' }}>
                            ¥{order.totalAmount || order.amount || 0}
                          </span>
                        </div>
                      }
                    />
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无订单" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="快捷操作">
            <List
              dataSource={[
                { icon: <TeamOutlined style={{ color: '#1890ff' }} />, title: '用户管理', path: '/users' },
                { icon: <BookOutlined style={{ color: '#52c41a' }} />, title: '课程管理', path: '/courses' },
                { icon: <DollarOutlined style={{ color: '#fa8c16' }} />, title: '收入报表', path: '/revenue' },
                { icon: <BarChartOutlined style={{ color: '#722ed1' }} />, title: '学习分析', path: '/analytics' },
                { icon: <TrophyOutlined style={{ color: '#13c2c2' }} />, title: '证书管理', path: '/certificates' },
                { icon: <SettingOutlined style={{ color: '#f5222d' }} />, title: '系统设置', path: '/settings' }
              ]}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(item.path)}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={<span style={{ fontWeight: 500 }}>{item.title}</span>}
                  />
                  <RightOutlined style={{ color: '#999' }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
