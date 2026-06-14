import { Layout, Menu, Avatar, Dropdown, Space, Button } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  MonitorOutlined,
  BulbOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/admin/dashboard',
    icon: <DashboardOutlined />,
    label: '数据概览'
  },
  {
    key: '/admin/services',
    icon: <AppstoreOutlined />,
    label: '服务管理'
  },
  {
    key: '/admin/monitor',
    icon: <MonitorOutlined />,
    label: '可用性监控'
  },
  {
    key: '/admin/scenes',
    icon: <BulbOutlined />,
    label: '场景编排'
  },
  {
    key: '/admin/feedback',
    icon: <MessageOutlined />,
    label: '反馈处理'
  },
  {
    key: '/admin/analytics',
    icon: <BarChartOutlined />,
    label: '数据分析',
    children: [
      {
        key: '/admin/analytics/heatmap',
        icon: <EnvironmentOutlined />,
        label: '热力图分析'
      },
      {
        key: '/admin/analytics/fusion',
        icon: <BarChartOutlined />,
        label: '融合分析'
      }
    ]
  },
  {
    key: '/admin/users',
    icon: <TeamOutlined />,
    label: '用户管理'
  },
  {
    key: '/admin/certificates',
    icon: <FileTextOutlined />,
    label: '证照管理'
  }
]

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout } = useUserStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回门户',
      onClick: () => navigate('/')
    },
    {
      key: 'divider',
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/admin/analytics')) {
      return ['/admin/analytics', path]
    }
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <DashboardOutlined style={{ marginRight: 8 }} />
          管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={['/admin/analytics']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新数据
          </Button>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size={32} icon={<UserOutlined />} src={userInfo?.avatar}>
                {userInfo?.name?.charAt(0)}
              </Avatar>
              <span style={{ color: '#262626' }}>{userInfo?.name}</span>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
