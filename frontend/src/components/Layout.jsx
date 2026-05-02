import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, Badge, Button, message } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  BellOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuthStore, useAppStore } from '../store'
import { commonApi, transactionApi } from '../services/api'
import { getRoleName } from '../utils/constants'

const { Header, Sider, Content } = Layout

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const collapsed = useAppStore((state) => state.collapsed)
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed)
  const setTodoCount = useAppStore((state) => state.setTodoCount)
  const unreadCount = useAppStore((state) => state.unreadCount)

  const selectedKey = location.pathname.split('/')[1] || 'dashboard'

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const statsRes = await transactionApi.getStats()
      if (statsRes.data.success) {
        setTodoCount(statsRes.data.data.todos || 0)
      }
    } catch (err) {
      console.error('Load stats error:', err)
    }
  }

  const handleLogout = () => {
    clearAuth()
    message.success('已退出登录')
    navigate('/login')
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: (
          <div>
            <div>{user?.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{getRoleName(user?.role_code)}</div>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  }

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'transactions',
      icon: <FileTextOutlined />,
      label: '交易管理',
      onClick: () => navigate('/transactions'),
    },
    {
      key: 'todos',
      icon: <UnorderedListOutlined />,
      label: (
        <Badge count={useAppStore.getState().todoCount} size="small" offset={[10, 0]}>
          待办任务
        </Badge>
      ),
      onClick: () => navigate('/todos'),
    },
    {
      key: 'messages',
      icon: <BellOutlined />,
      label: (
        <Badge count={unreadCount} size="small" offset={[10, 0]}>
          消息通知
        </Badge>
      ),
      onClick: () => navigate('/messages'),
    },
    {
      key: 'audit-logs',
      icon: <FileSearchOutlined />,
      label: '审计日志',
      onClick: () => navigate('/audit-logs'),
    },
  ]

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#002140'
        }}>
          <GlobalOutlined style={{ fontSize: 24, color: '#fff' }} />
          {!collapsed && (
            <span style={{ color: '#fff', marginLeft: 12, fontSize: 16, fontWeight: 600 }}>
              跨境支付
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header>
          <div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: 16, width: 64, height: 64, color: '#fff' }}
            />
          </div>
          <div className="header-right">
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>
          <div className="page-container">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
