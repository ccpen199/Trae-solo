import { useState } from 'react'
import { Layout, Menu, theme, Avatar, Dropdown, Space } from 'antd'
import {
  DashboardOutlined,
  CarOutlined,
  ThunderboltOutlined,
  OrderedListOutlined,
  AccountBookOutlined,
  BarChartOutlined,
  TeamOutlined,
  CommentOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

const { Header, Sider, Content } = Layout

const menuItems: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/station', icon: <CarOutlined />, label: '充电站管理' },
  { key: '/pile', icon: <ThunderboltOutlined />, label: '充电桩管理' },
  { key: '/order', icon: <OrderedListOutlined />, label: '订单管理' },
  { key: '/settlement', icon: <AccountBookOutlined />, label: '分账结算' },
  { key: '/revenue', icon: <BarChartOutlined />, label: '收益分析' },
  { key: '/user', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/community', icon: <CommentOutlined />, label: '社区管理' },
  { key: '/operator', icon: <SettingOutlined />, label: '运营商管理' }
]

function BasicLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout } = useAuthStore()

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold'
          }}
        >
          {collapsed ? 'EV' : '充电运营平台'}
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
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {collapsed ? (
            <MenuUnfoldOutlined
              style={{ fontSize: 18, cursor: 'pointer' }}
              onClick={() => setCollapsed(false)}
            />
          ) : (
            <MenuFoldOutlined
              style={{ fontSize: 18, cursor: 'pointer' }}
              onClick={() => setCollapsed(true)}
            />
          )}
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} src={userInfo?.avatar} />
              <span>{userInfo?.username || '管理员'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default BasicLayout
