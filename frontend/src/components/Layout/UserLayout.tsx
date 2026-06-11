import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  LogoutOutlined,
  HomeOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/user/profile',
    icon: <UserOutlined />,
    label: '个人信息'
  },
  {
    key: '/user/certificates',
    icon: <FileTextOutlined />,
    label: '我的证照'
  },
  {
    key: '/user/applications',
    icon: <AppstoreOutlined />,
    label: '我的办件'
  },
  {
    key: '/user/bookings',
    icon: <CalendarOutlined />,
    label: '我的预约'
  }
]

const UserLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout } = useUserStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回首页',
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
        <Link
          to="/"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <HomeOutlined />
          个人中心
        </Link>

        <Space size={24} align="center">
          <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#595959' }} />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size={32} icon={<UserOutlined />} src={userInfo?.avatar}>
                {userInfo?.name?.charAt(0)}
              </Avatar>
              <span style={{ color: '#262626' }}>{userInfo?.name}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider
          width={220}
          theme="light"
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
          />
        </Sider>

        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default UserLayout
