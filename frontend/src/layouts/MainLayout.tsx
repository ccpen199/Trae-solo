import React, { useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Space, Tag } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  AppstoreOutlined,
  SafetyOutlined,
  NotificationOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { developer, logout, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '控制台'
    },
    {
      key: '/applications',
      icon: <AppstoreOutlined />,
      label: '应用管理'
    },
    {
      key: '/permissions',
      icon: <SafetyOutlined />,
      label: '权限管理'
    },
    {
      key: '/notifications',
      icon: <NotificationOutlined />,
      label: '消息通知'
    }
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置'
    },
    {
      key: 'divider1',
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const levelColorMap: Record<string, string> = {
    REGULAR: 'default',
    ADVANCED: 'blue',
    PLATINUM: 'purple',
    CERTIFIED: 'gold'
  }

  const levelNameMap: Record<string, string> = {
    REGULAR: '普通开发者',
    ADVANCED: '高级开发者',
    PLATINUM: '白金开发者',
    CERTIFIED: '认证开发者'
  }

  return (
    <Layout className="main-layout">
      <Header>
        <div className="header-logo">
          <AppstoreOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <h2>TIP 开放平台</h2>
        </div>
        <div className="header-user">
          <Space>
            <Tag color={levelColorMap[developer?.level || 'REGULAR']}>
              {levelNameMap[developer?.level || 'REGULAR']}
            </Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text">
                <Space>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span>{developer?.name || '用户'}</span>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>
      <Layout>
        <Sider width={220} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="sider-menu"
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Layout style={{ background: '#f5f5f5' }}>
          <Content className="content-layout" style={{ padding: 24 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default MainLayout
