import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'
import {
  DashboardOutlined,
  InboxOutlined,
  ShopOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  BookOutlined,
  HeartOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined
} from '@ant-design/icons'
import { alertApi } from '../api'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/packages', icon: <InboxOutlined />, label: '包裹管理' },
  { key: '/cabinets', icon: <ShopOutlined />, label: '智能柜列表' },
  { key: '/reservation', icon: <CalendarOutlined />, label: '空箱预约' },
  { key: '/rental', icon: <CreditCardOutlined />, label: '租用订单' },
  { key: '/empower', icon: <BookOutlined />, label: '赋能中心' },
  { key: '/cabinet-health', icon: <HeartOutlined />, label: '柜机健康度' },
  { key: '/revenue', icon: <BarChartOutlined />, label: '收益分析' },
]

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const response = await alertApi.getList({ isRead: false })
      setAlertCount(response.data.length)
    } catch (error) {
      console.error('加载告警失败', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: '1',
      label: (
        <span onClick={handleLogout}>
          <LogoutOutlined /> 退出登录
        </span>
      ),
    },
  ]

  return (
    <Layout className="layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{ background: '#001529' }}
      >
        <div className="logo">
          <h2>{collapsed ? '丰巢' : '丰巢快递员SaaS'}</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 500 }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '工作台'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Badge count={alertCount} size="small">
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span style={{ color: '#52c41a', fontSize: 12 }}>已登录</span>
                <span>{user.name || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px' }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
            <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
              业务中心：包裹入库、空箱预约、租用订单、柜机健康和收益分析统一处理。
            </div>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
