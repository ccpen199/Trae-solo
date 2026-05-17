import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Input, Button, Avatar, Dropdown, Menu, Badge } from 'antd'
import { FaHome, FaHeadphones, FaBroadcastTower, FaUser, FaSearch, FaBell } from 'react-icons/fa'
import { useUserStore } from '@/store'

const { Header } = Layout

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, logout } = useUserStore()
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
    }
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate('/profile')}>
        <FaUser style={{ marginRight: 8 }} />
        个人中心
      </Menu.Item>
      <Menu.Item key="my" onClick={() => navigate('/my')}>
        <FaHeadphones style={{ marginRight: 8 }} />
        我的收听
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={logout}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  const navItems = [
    { path: '/', label: '首页', icon: <FaHome /> },
    { path: '/live', label: '直播', icon: <FaBroadcastTower /> },
    { path: '/my', label: '我听', icon: <FaHeadphones />, requireAuth: true },
  ]

  return (
    <Header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      boxShadow: '0 2px 8px rgba(255, 107, 157, 0.3)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <div style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          marginRight: 32
        }}>
          🎧 猫耳FM
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: 8, marginRight: 32 }}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 20,
              color: 'white',
              textDecoration: 'none',
              opacity: location.pathname === item.path ? 1 : 0.8,
              background: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
              transition: 'all 0.3s'
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ flex: 1, maxWidth: 400, marginRight: 24 }}>
        <form onSubmit={handleSearch}>
          <Input
            placeholder="搜索有声剧、主播..."
            prefix={<FaSearch style={{ color: '#999' }} />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ borderRadius: 20 }}
          />
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Badge count={3} size="small">
          <Button
            type="text"
            icon={<FaBell style={{ fontSize: 18, color: 'white' }} />}
            style={{ color: 'white' }}
          />
        </Badge>

        {isLoggedIn ? (
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar src={user?.avatar} size={32}>
                {user?.nickname?.charAt(0)}
              </Avatar>
              <span style={{ color: 'white', fontSize: 14 }}>{user?.nickname || user?.username}</span>
            </div>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            ghost
            onClick={() => navigate('/login')}
            style={{ borderRadius: 20, borderColor: 'white', color: 'white' }}
          >
            登录
          </Button>
        )}
      </div>
    </Header>
  )
}

export default Navbar
