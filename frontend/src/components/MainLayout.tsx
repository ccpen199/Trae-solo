import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown, Avatar, Badge, theme } from 'antd'
import {
  DashboardOutlined,
  QrcodeOutlined,
  UnorderedListOutlined,
  WarningOutlined,
  TruckOutlined,
  CarOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useAuthStore, roleNames } from '../stores/authStore'
import { messageApi } from '../services/api'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await messageApi.getUnreadCount()
        if (res.data.success) {
          setUnreadCount(res.data.data.count)
        }
      } catch (e) {}
    }
    fetchUnread()
  }, [])

  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表盘'
      }
    ]

    if (user?.role === 'rider') {
      return [
        ...baseItems,
        {
          key: '/scan',
          icon: <QrcodeOutlined />,
          label: '扫码开锁'
        },
        {
          key: '/orders',
          icon: <UnorderedListOutlined />,
          label: '我的订单'
        }
      ]
    }

    if (user?.role === 'service') {
      return [
        ...baseItems,
        {
          key: '/orders',
          icon: <UnorderedListOutlined />,
          label: '订单管理'
        },
        {
          key: '/exceptions',
          icon: <WarningOutlined />,
          label: '异常处理'
        }
      ]
    }

    if (user?.role === 'dispatcher') {
      return [
        ...baseItems,
        {
          key: '/orders',
          icon: <UnorderedListOutlined />,
          label: '订单管理'
        },
        {
          key: '/dispatches',
          icon: <TruckOutlined />,
          label: '调度管理'
        },
        {
          key: '/vehicles',
          icon: <CarOutlined />,
          label: '车辆管理'
        }
      ]
    }

    if (user?.role === 'maintainer') {
      return [
        ...baseItems,
        {
          key: '/dispatches',
          icon: <TruckOutlined />,
          label: '我的任务'
        },
        {
          key: '/vehicles',
          icon: <CarOutlined />,
          label: '车辆管理'
        }
      ]
    }

    return [
      ...baseItems,
      {
        key: '/orders',
        icon: <UnorderedListOutlined />,
        label: '订单管理'
      },
      {
        key: '/exceptions',
        icon: <WarningOutlined />,
        label: '异常处理'
      },
      {
        key: '/dispatches',
        icon: <TruckOutlined />,
        label: '调度管理'
      },
      {
        key: '/vehicles',
        icon: <CarOutlined />,
        label: '车辆管理'
      }
    ]
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.name} (${roleNames[user?.role || '']})`
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 12 : 18,
          fontWeight: 'bold'
        }}>
          {collapsed ? '单车' : '共享单车运营系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          background: colorBgContainer,
          minHeight: 280,
          borderRadius: 8
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
