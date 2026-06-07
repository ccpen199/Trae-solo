import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  ToolOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchUserInfo()
    fetchWarnings()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const data = await api.get('/auth/profile')
      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }

  const fetchWarnings = async () => {
    try {
      const data = await api.get('/services/warnings?unread_only=true')
      setUnreadCount(data.length)
    } catch (error) {
      console.error('获取预警信息失败', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/accounts', icon: <CreditCardOutlined />, label: '户号管理' },
    { key: '/payment', icon: <UserOutlined />, label: '电费缴纳' },
    { key: '/payment-records', icon: <HistoryOutlined />, label: '交费记录' },
    { key: '/mall', icon: <ShoppingCartOutlined />, label: '积分商城' },
    { key: '/finance', icon: <RiseOutlined />, label: '金融理财' },
    { key: '/services', icon: <ToolOutlined />, label: '属地服务' },
    { key: '/profile', icon: <SettingOutlined />, label: '个人中心' },
  ]

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  return (
    <Layout className="layout">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 14 : 16, fontWeight: 'bold' }}>
          {collapsed ? '国网' : '国家电网'}
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
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0, color: '#1890ff' }}>综合能源服务门户</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={unreadCount}>
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#666' }} onClick={() => navigate('/services')} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>{user?.real_name || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="site-layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
