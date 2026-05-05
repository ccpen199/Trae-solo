import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, theme, message, Spin } from 'antd'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  TruckOutlined,
  SendOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { MenuItem } from '../../api/auth'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  TruckOutlined: <TruckOutlined />,
  SendOutlined: <SendOutlined />,
  InboxOutlined: <InboxOutlined />,
  SettingOutlined: <SettingOutlined />,
}

function getIcon(icon?: string): React.ReactNode {
  if (!icon) return <DatabaseOutlined />
  return iconMap[icon] || <DatabaseOutlined />
}

function buildMenuItems(menus: MenuItem[]): React.ReactNode[] {
  const dashboardItem = {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  }

  const menuItems = menus
    .filter((m) => m.type === 1)
    .map((menu) => {
      if (menu.children && menu.children.length > 0) {
        const children = menu.children
          .filter((m) => m.type === 2)
          .map((child) => ({
            key: child.path || child.id,
            icon: getIcon(child.icon),
            label: child.name,
          }))
        if (children.length === 0) {
          return {
            key: menu.path || menu.id,
            icon: getIcon(menu.icon),
            label: menu.name,
          }
        }
        return {
          key: menu.path || menu.id,
          icon: getIcon(menu.icon),
          label: menu.name,
          children,
        }
      }
      return {
        key: menu.path || menu.id,
        icon: getIcon(menu.icon),
        label: menu.name,
      }
    })

  return [dashboardItem, ...menuItems]
}

function getAllMenuKeys(menus: unknown[]): string[] {
  const keys: string[] = []
  const traverse = (items: unknown[]) => {
    items.forEach((item: any) => {
      if (item.key) {
        keys.push(item.key)
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(menus)
  return keys
}

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const menus = useAuthStore((state) => state.menus)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        navigate('/login')
        return
      }

      if (!isInitialized) {
        try {
          await fetchCurrentUser()
        } catch (error) {
          console.error('Failed to fetch user:', error)
          logout()
          navigate('/login')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [isInitialized, fetchCurrentUser, logout, navigate])

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => message.info('功能开发中'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key && key !== '/') {
      navigate(key)
    }
  }

  const menuItems = buildMenuItems(menus)
  const allKeys = getAllMenuKeys(menuItems)

  const getSelectedKeys = (): string[] => {
    const currentPath = location.pathname
    if (allKeys.includes(currentPath)) {
      return [currentPath]
    }
    if (currentPath === '/' || currentPath === '/dashboard') {
      return ['/dashboard']
    }
    return [currentPath]
  }

  const getOpenKeys = (): string[] => {
    const currentPath = location.pathname
    const traverse = (items: any[]): string[] => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          for (const child of item.children) {
            if (child.key === currentPath) {
              return [item.key]
            }
          }
          const result = traverse(item.children)
          if (result.length > 0) {
            return [item.key, ...result]
          }
        }
      }
      return []
    }
    return traverse(menuItems)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} className="main-sider">
        <div className="logo">
          {collapsed ? (
            <span className="logo-mini">TMS</span>
          ) : (
            <span className="logo-full">仓储运输管理系统</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout className="main-content-layout">
        <Header className="main-header" style={{ background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-btn"
          />
          <div className="header-right">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="user-name">{user?.realName || user?.username || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
