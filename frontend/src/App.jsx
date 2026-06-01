import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, message } from 'antd'
import {
  HomeOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import CinemaList from './pages/CinemaList'
import CinemaDetail from './pages/CinemaDetail'
import SeatSelect from './pages/SeatSelect'
import OrderDetail from './pages/OrderDetail'
import OrderList from './pages/OrderList'
import Login from './pages/Login'

const { Header, Content, Footer } = Layout

function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const userInfo = localStorage.getItem('user')
    if (userInfo) {
      setUser(JSON.parse(userInfo))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    message.success('已退出登录')
    navigate('/')
  }

  const userMenuItems = [
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: '我的订单',
      onClick: () => navigate('/orders'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/movies',
      icon: <VideoCameraOutlined />,
      label: '电影',
      onClick: () => navigate('/movies'),
    },
    {
      key: '/cinemas',
      icon: <ShopOutlined />,
      label: '影院',
      onClick: () => navigate('/cinemas'),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="logo" style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c', marginRight: '40px' }}>
          淘票票
        </div>
        <Menu
          mode="horizontal"
          items={menuItems}
          style={{ flex: 1, borderRight: 0 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }}>
              <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
            </Dropdown>
          ) : (
            <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </div>
      </Header>
      <Content style={{ padding: '0 0 24px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/cinemas" element={<CinemaList />} />
          <Route path="/cinema/:id" element={<CinemaDetail />} />
          <Route path="/schedule/:id" element={<SeatSelect />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        淘票票 ©2024 Created by Movie Ticket System
      </Footer>
    </Layout>
  )
}

export default App
