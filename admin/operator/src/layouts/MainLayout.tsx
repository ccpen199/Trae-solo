import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Button,
  theme,
  Popover,
  List,
  Typography,
  Space,
  Tag
} from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  ControlOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  WifiOutlined
} from '@ant-design/icons'
import { useAppStore } from '@/store'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '运维仪表盘' },
  { key: '/devices', icon: <AppstoreOutlined />, label: '设备管理' },
  { key: '/device-control', icon: <ControlOutlined />, label: '远程控制' },
  { key: '/firmware', icon: <CloudUploadOutlined />, label: '固件管理' },
  { key: '/work-orders', icon: <FileTextOutlined />, label: '工单管理' }
]

const mockAlarms = [
  { id: '1', deviceName: 'RO-A001', level: 'error', message: '设备离线超过30分钟', time: '5分钟前' },
  { id: '2', deviceName: 'RO-A005', level: 'warning', message: '水温异常偏高', time: '12分钟前' },
  { id: '3', deviceName: 'RO-B012', level: 'warning', message: 'UV灯运行超时', time: '28分钟前' },
  { id: '4', deviceName: 'RO-C003', level: 'info', message: '固件升级完成', time: '1小时前' }
]

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()
  const { user, logout } = useAppStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
  ]

  const alarmContent = (
    <div style={{ width: 320 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
        <Text strong>最近告警 ({mockAlarms.length})</Text>
      </div>
      <List
        size="small"
        dataSource={mockAlarms}
        renderItem={(item) => (
          <List.Item style={{ padding: '8px 12px', cursor: 'pointer' }}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Space>
                <Badge
                  status={
                    item.level === 'error' ? 'error' :
                    item.level === 'warning' ? 'warning' :
                    item.level === 'critical' ? 'error' : 'default'
                  }
                />
                <Tag color={
                  item.level === 'error' ? 'red' :
                  item.level === 'warning' ? 'orange' :
                  item.level === 'critical' ? 'red' : 'blue'
                }>
                  {item.deviceName}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
              </Space>
              <Text style={{ fontSize: 13 }}>{item.message}</Text>
            </Space>
          </List.Item>
        )}
      />
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          background: '#001529',
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            color: '#fff',
            fontSize: collapsed ? 18 : 18,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <WifiOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          {!collapsed && (
            <span style={{ marginLeft: 10 }}>运维管理后台</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 64
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <Menu mode="inline" /> : <></>}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            >
              {collapsed ? '»' : '«'}
            </Button>
            <Space direction="vertical" size={0} style={{ lineHeight: 1 }}>
              <Text strong style={{ fontSize: 16 }}>
                {menuItems.find(m => m.key === location.pathname)?.label || '首页'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentTime.toLocaleDateString('zh-CN')} {currentTime.toLocaleTimeString('zh-CN')}
              </Text>
            </Space>
          </Space>
          <Space size={16}>
            <Popover content={alarmContent} trigger="click" placement="bottomRight">
              <Badge count={mockAlarms.filter(a => a.level === 'error' || a.level === 'warning').length}>
                <Button type="text" style={{ padding: '0 12px' }}>
                  <BellOutlined style={{ fontSize: 18 }} />
                </Button>
              </Badge>
            </Popover>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ background: '#52c41a' }} />
                <Space direction="vertical" size={0} style={{ lineHeight: 1 }}>
                  <Text style={{ fontSize: 14 }}>{user?.name || '运维管理员'}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>超级管理员</Text>
                </Space>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
