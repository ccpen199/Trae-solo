import { useState } from 'react'
import { Layout, Menu, Input, Avatar, Dropdown, Button, Badge } from 'antd'
import { HomeOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, SettingOutlined, HeartOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useUserStore from '../store/user'

const { Header, Content, Footer } = Layout
const { Search } = Input

const MainLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, logout } = useUserStore()
  const [searchValue, setSearchValue] = useState('')

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: '/category',
      icon: <AppstoreOutlined />,
      label: '分类',
      onClick: () => navigate('/category')
    },
    {
      key: '/rentals',
      icon: <ShoppingOutlined />,
      label: '我的租借',
      onClick: () => navigate('/rentals'),
      disabled: !token
    },
    {
      key: '/favorites',
      icon: <HeartOutlined />,
      label: '我的收藏',
      onClick: () => navigate('/favorites'),
      disabled: !token
    }
  ]

  const getSelectedKey = () => {
    const path = location.pathname
    if (path.startsWith('/category')) return '/category'
    if (path.startsWith('/rentals')) return '/rentals'
    if (path.startsWith('/favorites')) return '/favorites'
    return '/'
  }

  const handleSearch = (value) => {
    if (value?.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(value.trim())}`)
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/settings/profile')
    },
    {
      key: 'verify',
      icon: <SettingOutlined />,
      label: user?.is_verified === 1 ? '已实名认证' : '去实名认证',
      onClick: () => navigate('/settings/verify')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings')
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/')
      }
    }
  ]

  const guestMenuItems = [
    {
      key: 'login',
      label: '登录',
      onClick: () => navigate('/login')
    },
    {
      key: 'register',
      label: '注册',
      onClick: () => navigate('/register')
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div 
          style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            marginRight: '32px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          🛠️ 家电租借
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ 
            flex: 1, 
            minWidth: 0,
            borderBottom: 'none' 
          }}
        />

        <Search
          placeholder="搜索家电..."
          allowClear
          style={{ width: 250, marginRight: 16 }}
          onSearch={handleSearch}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />

        {token && user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '20px'
            }}>
              <Badge dot={user.is_verified !== 1} offset={[-2, 2]}>
                <Avatar src={user.avatar} icon={<UserOutlined />} />
              </Badge>
              <span style={{ marginLeft: 8, color: '#666' }}>
                {user.nickname || user.phone}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Dropdown menu={{ items: guestMenuItems }} placement="bottomRight">
            <Button type="primary">
              <UserOutlined /> 登录
            </Button>
          </Dropdown>
        )}
      </Header>

      <Content className="main-layout">
        {children}
      </Content>

      <Footer style={{ 
        textAlign: 'center', 
        background: '#fff',
        borderTop: '1px solid #f0f0f0'
      }}>
        家电租借平台 ©{new Date().getFullYear()} - 专业家电短期租赁服务
      </Footer>
    </Layout>
  )
}

export default MainLayout
