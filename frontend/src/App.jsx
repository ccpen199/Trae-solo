import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown, Avatar, message } from 'antd'
import {
  HomeOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  LogoutOutlined,
  GiftOutlined,
  CarOutlined
} from '@ant-design/icons'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MerchantList from './pages/MerchantList'
import MerchantDetail from './pages/MerchantDetail'
import OrderList from './pages/OrderList'
import OrderDetail from './pages/OrderDetail'
import CouponList from './pages/CouponList'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminMerchants from './pages/admin/Merchants'
import AdminUsers from './pages/admin/Users'
import AdminRiskRules from './pages/admin/RiskRules'
import MerchantDashboard from './pages/merchant/Dashboard'
import RiderDashboard from './pages/rider/Dashboard'

const { Header, Content, Sider } = Layout

const App = () => {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    message.success('已退出登录')
    navigate('/')
  }

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') navigate('/profile')
    if (key === 'coupons') navigate('/coupons')
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'coupons', icon: <GiftOutlined />, label: '我的优惠券' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
  ]

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/merchants', icon: <ShopOutlined />, label: <Link to="/merchants">商户</Link> },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: <Link to="/orders">订单</Link> },
    { key: '/coupons', icon: <GiftOutlined />, label: <Link to="/coupons">优惠券</Link> }
  ]

  if (user?.role === 'admin') {
    menuItems.push({
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '管理后台',
      children: [
        { key: '/admin/dashboard', label: <Link to="/admin/dashboard">数据看板</Link> },
        { key: '/admin/merchants', label: <Link to="/admin/merchants">商户审核</Link> },
        { key: '/admin/users', label: <Link to="/admin/users">用户管理</Link> },
        { key: '/admin/risk-rules', label: <Link to="/admin/risk-rules">风控规则</Link> }
      ]
    })
  }
  if (user?.role === 'merchant') {
    menuItems.push({
      key: '/merchant/dashboard',
      icon: <ShopOutlined />,
      label: <Link to="/merchant/dashboard">商户工作台</Link>
    })
  }
  if (user?.role === 'rider') {
    menuItems.push({
      key: '/rider/dashboard',
      icon: <CarOutlined />,
      label: <Link to="/rider/dashboard">骑手工作台</Link>
    })
  }

  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff', marginRight: '48px' }}>
          🏪 本地生活服务平台
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, border: 'none' }}
        />
        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                <span>{user.nickname}</span>
                {user.role === 'admin' && (
                  <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
                    管理员
                  </span>
                )}
              </div>
            </Dropdown>
          ) : (
            <>
              <Button type="link" onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
            </>
          )}
        </div>
      </Header>
      
      <Layout>
        {isAdminPage && (
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              style={{ height: '100%', borderRight: 0 }}
              items={[
                { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">数据看板</Link> },
                { key: '/admin/merchants', icon: <ShopOutlined />, label: <Link to="/admin/merchants">商户审核</Link> },
                { key: '/admin/users', icon: <UserOutlined />, label: <Link to="/admin/users">用户管理</Link> },
                { key: '/admin/risk-rules', icon: <SettingOutlined />, label: <Link to="/admin/risk-rules">风控规则</Link> }
              ]}
            />
          </Sider>
        )}
        
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
            <Route path="/register" element={<Register onLogin={(u) => setUser(u)} />} />
            <Route path="/merchants" element={<MerchantList />} />
            <Route path="/merchants/:id" element={<MerchantDetail />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/coupons" element={<CouponList />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
            <Route path="/rider/dashboard" element={<RiderDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/merchants" element={<AdminMerchants />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/risk-rules" element={<AdminRiskRules />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
