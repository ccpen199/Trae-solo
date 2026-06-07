import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Button, Typography, Tag, Space, Divider, List } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  HomeOutlined,
  HeartOutlined,
  TeamOutlined,
  AuditOutlined,
  FlagOutlined,
  SoundOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import request from '../../utils/request'

const { Title, Text } = Typography

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0, totalJobs: 0, totalOrders: 0, totalRevenue: 0,
    workers: 0, employers: 0, openJobs: 0, activeOrders: 0,
    completedOrders: 0, disputedOrders: 0, pendingAudits: 0
  })
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await request.get('/admin/dashboard')
      const data = res.data || res
      setStats({
        totalUsers: data.totalUsers || 0,
        totalJobs: data.totalJobs || 0,
        totalOrders: data.totalOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        workers: data.workers || 0,
        employers: data.employers || 0,
        openJobs: data.openJobs || 0,
        activeOrders: data.activeOrders || 0,
        completedOrders: data.completedOrders || 0,
        disputedOrders: data.disputedOrders || 0,
        pendingAudits: data.pendingAudits || 0
      })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const quickLinks = [
    { title: '健康中心', icon: <HeartOutlined />, path: '/admin/health-center', color: '#52c41a', desc: '岗位存活率·履约时长·投诉聚类' },
    { title: '岗位审核', icon: <FlagOutlined />, path: '/admin/jobs/audit', color: '#722ed1', desc: '待审核岗位·审核记录' },
    { title: '学生运营', icon: <TeamOutlined />, path: '/admin/student-ops', color: '#1677ff', desc: '假期预测·校园大使·学分认证' },
    { title: '财务审计', icon: <AuditOutlined />, path: '/admin/financial-audit', color: '#faad14', desc: '资金池·提现·异常拦截' },
    { title: '仲裁管理', icon: <SoundOutlined />, path: '/admin/arbitrate', color: '#eb2f96', desc: '争议处理·先行赔付' }
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>控制面板</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="总用户数" value={stats.totalUsers} prefix={<UserOutlined />} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <Tag color="blue">兼职者 {stats.workers}</Tag>
              <Tag color="green">雇主 {stats.employers}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="总岗位数" value={stats.totalJobs} prefix={<HomeOutlined />} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <Tag color="green">在招 {stats.openJobs}</Tag>
              {stats.pendingAudits > 0 && <Tag color="orange">待审 {stats.pendingAudits}</Tag>}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="总订单数" value={stats.totalOrders} prefix={<ShoppingOutlined />} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <Tag color="cyan">进行中 {stats.activeOrders}</Tag>
              <Tag color="green">已完成 {stats.completedOrders}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="平台收入(服务费)" value={stats.totalRevenue} prefix={<DollarOutlined />} precision={2} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              {stats.disputedOrders > 0
                ? <Tag color="red"><WarningOutlined /> 争议 {stats.disputedOrders}</Tag>
                : <Tag color="green"><CheckCircleOutlined /> 无争议</Tag>
              }
            </div>
          </Card>
        </Col>
      </Row>

      <Title level={5} style={{ marginBottom: 16 }}>运营后台入口</Title>
      <Row gutter={[16, 16]}>
        {quickLinks.map((link) => (
          <Col xs={12} sm={8} md={4} key={link.path}>
            <Card hoverable onClick={() => navigate(link.path)} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: link.color, marginBottom: 8 }}>{link.icon}</div>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{link.title}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{link.desc}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
