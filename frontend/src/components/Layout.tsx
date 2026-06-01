import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button, Space, Typography, Tag } from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserSwitchOutlined,
  DollarOutlined,
  ToolOutlined,
  BellOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const roleMenus: Record<string, any[]> = {
  admin: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/patients', icon: <TeamOutlined />, label: '患者管理' },
    { key: '/appointments', icon: <CalendarOutlined />, label: '预约管理' },
    { key: '/treatment-plans', icon: <FileTextOutlined />, label: '治疗计划' },
    { key: '/invoices', icon: <DollarOutlined />, label: '收费管理' },
    { key: '/supplies', icon: <ToolOutlined />, label: '耗材库存' },
    { key: '/reminders', icon: <BellOutlined />, label: '复诊提醒' },
  ],
  doctor: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/patients', icon: <TeamOutlined />, label: '患者档案' },
    { key: '/appointments', icon: <CalendarOutlined />, label: '我的排班' },
    { key: '/treatment-plans', icon: <FileTextOutlined />, label: '治疗计划' },
  ],
  reception: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/patients', icon: <TeamOutlined />, label: '患者管理' },
    { key: '/appointments', icon: <CalendarOutlined />, label: '预约管理' },
  ],
  nurse: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/patients', icon: <TeamOutlined />, label: '患者信息' },
    { key: '/appointments', icon: <CalendarOutlined />, label: '预约排班' },
    { key: '/supplies', icon: <ToolOutlined />, label: '耗材管理' },
    { key: '/reminders', icon: <BellOutlined />, label: '复诊提醒' },
  ],
  finance: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/invoices', icon: <DollarOutlined />, label: '收费管理' },
    { key: '/supplies', icon: <ToolOutlined />, label: '耗材库存' },
  ],
}

const roleNames: Record<string, string> = {
  admin: '系统管理员',
  doctor: '医生',
  reception: '前台',
  nurse: '护士',
  finance: '财务',
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedKey, setSelectedKey] = useState('/')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    setSelectedKey(location.pathname)
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menus = user ? roleMenus[user.role] || roleMenus.reception : []

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div>{user?.name}</div>
          <Tag color="blue" style={{ margin: 0 }}>{roleNames[user?.role] || user?.role}</Tag>
        </div>
      ),
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>🦷 牙科诊所管理系统</Title>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span>{user?.name}</span>
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          width={220}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            items={menus}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Content className="layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
