import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Avatar } from 'antd'
import { 
  HomeOutlined, 
  SearchOutlined, 
  BookOutlined, 
  UserOutlined 
} from '@ant-design/icons'

const { Header, Content, Footer } = AntLayout

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeKey, setActiveKey] = useState('home')

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/home')) setActiveKey('home')
    else if (path.startsWith('/search')) setActiveKey('search')
    else if (path.startsWith('/reader')) setActiveKey('reader')
    else if (path.startsWith('/profile') || path.startsWith('/wishlist') || 
             path.startsWith('/cloud-library') || path.startsWith('/notes') ||
             path.startsWith('/messages')) {
      setActiveKey('profile')
    }
  }, [location.pathname])

  const navItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      path: '/home'
    },
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: '找书',
      path: '/search'
    },
    {
      key: 'reader',
      icon: <BookOutlined />,
      label: '书架',
      path: '/cloud-library'
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '我的',
      path: '/profile'
    },
  ]

  const showLayout = !location.pathname.startsWith('/reader/')

  if (!showLayout) {
    return <Outlet />
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
          📚 藏书馆
        </div>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Outlet />
      </Content>
      <Footer style={{ 
        textAlign: 'center', 
        padding: '8px 0',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {navItems.map(item => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px 16px',
                color: activeKey === item.key ? '#1890ff' : '#666',
                transition: 'color 0.3s'
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 2 }}>
                {item.icon}
              </div>
              <div style={{ fontSize: 12 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </Footer>
    </AntLayout>
  )
}

export default Layout
