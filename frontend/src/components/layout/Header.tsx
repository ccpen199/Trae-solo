import type { MenuProps } from 'antd'
import { Avatar, Dropdown, Layout, Button } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, ShoppingOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { APP_TITLE } from '@/utils/constants'

const { Header: AntHeader } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const Header = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuItem[] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'orders',
      icon: <ShoppingOutlined />,
      label: '我的订单',
      onClick: () => navigate('/orders'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntHeader className="flex items-center justify-between bg-white px-6 shadow-sm h-16">
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <SafetyOutlined className="text-2xl text-[#1677ff] mr-2" />
          <h1 className="text-xl font-bold text-[#1677ff] m-0">{APP_TITLE}</h1>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center cursor-pointer hover:opacity-80">
              <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
              <span className="ml-2 text-gray-700">{user?.name || user?.phone}</span>
            </div>
          </Dropdown>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="text" onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button type="primary" onClick={() => navigate('/register')}>
              注册
            </Button>
          </div>
        )}
      </div>
    </AntHeader>
  )
}

export default Header
