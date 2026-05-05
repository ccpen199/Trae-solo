import React, { useState } from 'react'
import { Layout as AntLayout, Menu, theme, Avatar, Dropdown, Button, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  InboxOutlined,
  SendOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import useAuthStore from '../store/authStore'

const { Header, Sider, Content } = AntLayout

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const baseMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
    },
  ]

  const userManageMenu = {
    key: '/users',
    icon: <TeamOutlined />,
    label: '用户管理',
    children: user?.role === 'admin' 
      ? [
          { key: '/users', label: '用户列表' },
          { key: '/users/profile', label: '个人资料' },
        ]
      : [
          { key: '/users/profile', label: '个人资料' },
        ],
  }

  const businessMenuItems = [
    {
      key: '/suppliers',
      icon: <ShopOutlined />,
      label: '供应商管理',
    },
    {
      key: '/products',
      icon: <InboxOutlined />,
      label: '商品管理',
    },
    {
      key: '/stock',
      icon: <SendOutlined />,
      label: '出入库管理',
      children: [
        { key: '/stock-in', label: '入库管理' },
        { key: '/stock-out', label: '出库管理' },
      ],
    },
    {
      key: '/inventory-group',
      icon: <BarChartOutlined />,
      label: '库存管理',
      children: [
        { key: '/inventory', label: '库存查询' },
        { key: '/inventory/statistics', label: '库存统计' },
      ],
    },
  ]

  const menuItems = [
    ...baseMenuItems,
    userManageMenu,
    ...businessMenuItems,
  ]

  if (user?.role === 'admin') {
    menuItems.push({
      key: '/logs',
      icon: <FileTextOutlined />,
      label: '日志管理',
    })
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/users/profile'),
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/users/profile')) {
      return ['/users/profile']
    }
    if (path.startsWith('/stock-in')) {
      return ['/stock-in']
    }
    if (path.startsWith('/stock-out')) {
      return ['/stock-out']
    }
    if (path.startsWith('/inventory/statistics')) {
      return ['/inventory/statistics']
    }
    return [path]
  }

  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/users')) {
      return ['/users']
    }
    if (path.startsWith('/stock')) {
      return ['/stock']
    }
    if (path.startsWith('/inventory')) {
      return ['/inventory-group']
    }
    return []
  }

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}>
          {collapsed ? (
            <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>库</span>
          ) : (
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>库存管理系统</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Space>
            <Dropdown menu={{ items: userMenuItems }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                  {user?.real_name?.charAt(0)}
                </Avatar>
                <span>{user?.real_name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout