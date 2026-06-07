import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, Tag, message } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  PayCircleOutlined,
  ApartmentOutlined,
  CustomerServiceOutlined,
  MonitorOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '后台管理工作台' },
  { key: '/services', icon: <AppstoreOutlined />, label: '事项管理' },
  { key: '/auth-center', icon: <SafetyCertificateOutlined />, label: '认证中心' },
  { key: '/login', icon: <UserOutlined />, label: '登录注册' },
  { key: '/payment', icon: <PayCircleOutlined />, label: '支付网关' },
  { key: '/collaboration', icon: <ApartmentOutlined />, label: '业务协同' },
  { key: '/interactive', icon: <CustomerServiceOutlined />, label: '互动服务' },
  { key: '/monitoring', icon: <MonitorOutlined />, label: '监测分析' },
]

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [userInfo, setUserInfo] = useState({ real_name: '管理员', role: 'admin', auth_source: 'local' })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user && user.id) {
        setUserInfo({
          real_name: user.real_name || user.username || '管理员',
          role: user.role || 'citizen',
          auth_source: user.auth_source || 'local',
        })
      }
    } catch {}
  }, [])

  const selectedKey = menuItems.find((item) => {
    if (item.key === '/') return location.pathname === '/'
    return location.pathname.startsWith(item.key)
  })?.key || '/'

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    message.success('已退出登录')
    try {
      navigate('/login', { replace: true })
    } catch (e) {}
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }, 200)
  }

  const getAuthSourceLabel = (source) => {
    const map = { local: '账号', ca: '省CA', alipay: '支付宝', minzhengtong: '闽政通' }
    return map[source] || source
  }

  const getAuthSourceColor = (source) => {
    const map = { local: 'blue', ca: 'purple', alipay: 'cyan', minzhengtong: 'green' }
    return map[source] || 'default'
  }

  const dropdownItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#1a3a5c',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: collapsed ? 14 : 16,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              letterSpacing: 1,
            }}
          >
            {collapsed ? '政务' : '福建政务服务中台'}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, background: 'transparent' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#0d2b45',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#fff', fontSize: 16, marginRight: 16 }}
            />
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, letterSpacing: 2 }}>
              福建省政务服务统一中台系统
            </span>
          </div>
          <Dropdown menu={{ items: dropdownItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
              <span style={{ color: '#fff' }}>{userInfo.real_name}</span>
              <Tag color={getAuthSourceColor(userInfo.auth_source)} style={{ margin: 0 }}>
                {getAuthSourceLabel(userInfo.auth_source)}
              </Tag>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 20,
            background: '#f0f2f5',
            borderRadius: 8,
            minHeight: 'calc(100vh - 64px - 32px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
