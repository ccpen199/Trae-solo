import { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Spin, 
  Result, 
  Button,
  Typography
} from 'antd'
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  RiseOutlined, 
  HomeOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import request from '../../utils/request'

const { Title } = Typography

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    total_rentals: 0,
    active_rentals: 0,
    total_revenue: 0,
    total_appliances: 0,
    available_appliances: 0
  })

  const loadStats = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/admin/stats')
      setStats(res.data || {})
    } catch (err) {
      console.error('Load stats error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="统计数据加载失败，请重试"
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadStats}>
            重新加载
          </Button>
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>数据概览</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title="总用户数"
              value={stats.total_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fff' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              活跃用户: {stats.active_users || 0}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title="总订单数"
              value={stats.total_rentals || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#fff' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              进行中: {stats.active_rentals || 0}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title="累计营收"
              value={stats.total_revenue || 0}
              precision={2}
              prefix="¥"
              suffix={<RiseOutlined />}
              valueStyle={{ color: '#fff' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              平台收入
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Statistic
              title="家电数量"
              value={stats.total_appliances || 0}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#fff' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              可租: {stats.available_appliances || 0}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="平台说明">
            <ul style={{ color: '#666', lineHeight: 2 }}>
              <li>平台默认使用 SQLite 数据库存储所有数据</li>
              <li>后端服务运行在端口 12570</li>
              <li>前端服务运行在端口 12571</li>
              <li>所有核心业务数据均已落库，可审计复查</li>
            </ul>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="快速操作">
            <div style={{ lineHeight: 2, color: '#666' }}>
              <p>📊 查看左侧菜单进行详细管理</p>
              <p>👤 用户管理：查看和管理平台用户</p>
              <p>📦 家电管理：添加和编辑家电商品</p>
              <p>📋 订单管理：处理租借订单</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
