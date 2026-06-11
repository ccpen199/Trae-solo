import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  WarningOutlined,
  DollarOutlined,
  ShopOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/workers',
    icon: <TeamOutlined />,
    label: '劳动者管理',
  },
  {
    key: '/employers',
    icon: <UserOutlined />,
    label: '雇主管理',
  },
  {
    key: '/orders',
    icon: <FileTextOutlined />,
    label: '服务工单',
  },
  {
    key: 'supervision',
    icon: <EyeOutlined />,
    label: '服务监管',
    children: [
      { key: '/supervision', label: 'GPS轨迹追踪' },
      { key: '/supervision/evaluations', label: '三方评价管理' },
    ],
  },
  {
    key: '/disputes',
    icon: <WarningOutlined />,
    label: '纠纷中心',
  },
  {
    key: '/compensation',
    icon: <DollarOutlined />,
    label: '赔付管理',
  },
  {
    key: 'provider',
    icon: <ShopOutlined />,
    label: '服务商后台',
    children: [
      { key: '/provider/packages', label: '服务包配置' },
      { key: '/provider/training', label: '培训课程管理' },
      { key: '/provider/recertification', label: '再认证管理' },
    ],
  },
]

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKeys = [location.pathname]

  const openKeys = (() => {
    if (location.pathname.startsWith('/supervision')) return ['supervision']
    if (location.pathname.startsWith('/provider')) return ['provider']
    return []
  })()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        trigger={null}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '家服通' : '家服通平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer' },
              onClick: () => setCollapsed(!collapsed),
            })}
            <span style={{ fontSize: 16, fontWeight: 500 }}>
              家服通 - B2C2B家庭服务协同平台
            </span>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
