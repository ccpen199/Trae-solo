import { Layout, Menu, Input, Badge, Dropdown, Avatar, Space } from 'antd'
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  AppstoreOutlined,
  CarOutlined,
  BulbOutlined,
  MessageOutlined,
  HomeOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'

const { Header, Content } = Layout

const navItems = [
  { key: '/', label: '首页', icon: <HomeOutlined /> },
  { key: '/services', label: '办事大厅', icon: <AppstoreOutlined /> },
  { key: '/scenes', label: '一件事专区', icon: <BulbOutlined /> },
  { key: '/bus', label: '公交查询', icon: <CarOutlined /> },
  { key: '/venues', label: '场馆预约', icon: <BulbOutlined /> },
  { key: '/community/repair', label: '社区报修', icon: <SettingOutlined /> },
  { key: '/community/help', label: '邻里互助', icon: <UserOutlined /> },
  { key: '/feedback', label: '市民反馈', icon: <MessageOutlined /> }
]

const PortalLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, isLoggedIn, logout } = useUserStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/user/profile')
    },
    {
      key: 'applications',
      icon: <AppstoreOutlined />,
      label: '我的办件',
      onClick: () => navigate('/user/applications')
    },
    {
      key: 'certificates',
      icon: <SettingOutlined />,
      label: '我的证照',
      onClick: () => navigate('/user/certificates')
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

  const selectedKey = navItems.find((item) => location.pathname.startsWith(item.key))?.key || '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link
            to="/"
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <AppstoreOutlined style={{ fontSize: 28 }} />
            常州市公共服务平台
          </Link>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={navItems}
            onClick={({ key }) => navigate(key)}
            style={{
              background: 'transparent',
              borderBottom: 'none',
              minWidth: 600
            }}
          />
        </div>

        <Space size={24} align="center">
          <Input.Search
            placeholder="搜索服务..."
            style={{ width: 280 }}
            onSearch={(value) => {
              if (value) {
                navigate(`/services?keyword=${encodeURIComponent(value)}`)
              }
            }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Badge count={3} size="small">
            <BellOutlined style={{ color: '#fff', fontSize: 20, cursor: 'pointer' }} />
          </Badge>
          {isLoggedIn && userInfo ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', color: '#fff' }}>
                <Avatar size={32} icon={<UserOutlined />} src={userInfo.avatar}>
                  {userInfo.name?.charAt(0)}
                </Avatar>
                <span>{userInfo.name}</span>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Link to="/login" style={{ color: '#fff' }}>
                登录
              </Link>
              <Link to="/register" style={{ color: '#fff' }}>
                注册
              </Link>
            </Space>
          )}
        </Space>
      </Header>

      <Content>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default PortalLayout
