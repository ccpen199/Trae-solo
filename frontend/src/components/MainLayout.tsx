import React, { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  CarOutlined,
  UnorderedListOutlined,
  ThunderboltOutlined,
  HeatMapOutlined,
  WarningOutlined,
  StarOutlined,
  RiseOutlined
} from '@ant-design/icons'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '履约质量看板'
  },
  {
    key: '/drivers',
    icon: <CarOutlined />,
    label: '司机档案管理'
  },
  {
    key: '/orders',
    icon: <UnorderedListOutlined />,
    label: '订单池'
  },
  {
    key: '/dispatch',
    icon: <ThunderboltOutlined />,
    label: '智能派单'
  },
  {
    key: '/heatmap',
    icon: <HeatMapOutlined />,
    label: '城市运力热力图'
  },
  {
    key: '/exceptions',
    icon: <WarningOutlined />,
    label: '异常事件管理'
  },
  {
    key: '/credit',
    icon: <StarOutlined />,
    label: '司机信用分'
  },
  {
    key: '/supply-demand',
    icon: <RiseOutlined />,
    label: '供需缺口预警'
  }
]

const MainLayout: React.FC = () => {
  const [collapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
          {collapsed ? '调度' : '运力调度系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '管理后台'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>管理员</span>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 112px)'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
