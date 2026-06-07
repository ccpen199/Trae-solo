import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, theme } from 'antd'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  CarOutlined,
  EnvironmentOutlined,
  HeatMapOutlined,
  CreditCardOutlined,
  WarningOutlined,
  MoneyCollectOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store'

const { Header, Sider, Content } = AntLayout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/waybills', icon: <ShoppingOutlined />, label: '运单管理' },
  { key: '/knights', icon: <UserOutlined />, label: '骑手管理' },
  { key: '/dispatch', icon: <CarOutlined />, label: '调度中心' },
  { key: '/tracking', icon: <EnvironmentOutlined />, label: '实时追踪' },
  { key: '/heatmap', icon: <HeatMapOutlined />, label: '热力地图' },
  { key: '/credit', icon: <CreditCardOutlined />, label: '信用体系' },
  { key: '/exceptions', icon: <WarningOutlined />, label: '异常处理' },
  { key: '/settlements', icon: <MoneyCollectOutlined />, label: '结算管理' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            background: 'rgba(255,255,255,0.1)',
            margin: 16,
            borderRadius: 8,
          }}
        >
          {collapsed ? '配送' : '同城配送调度'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((item) => ({
            ...item,
            label: <Link to={item.key}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.username || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
