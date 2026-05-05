import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  HomeOutlined,
  ApartmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import RoomTypes from './pages/RoomTypes'
import Rooms from './pages/Rooms'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: <Link to="/">首页</Link>,
  },
  {
    key: '/room-types',
    icon: <ApartmentOutlined />,
    label: <Link to="/room-types">客房类型管理</Link>,
  },
  {
    key: '/rooms',
    icon: <ApartmentOutlined />,
    label: <Link to="/rooms">客房信息管理</Link>,
  },
]

function HomePage() {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '24px' }}>欢迎使用酒店管理系统</h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
        本系统用于管理酒店的客房类型和客房信息，是后续预订、入住、退房和房态管理的基础。
      </p>
      <div style={{ marginTop: '40px' }}>
        <h3>主要功能模块：</h3>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '200px' }}>
            <ApartmentOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <h4 style={{ marginTop: '16px' }}>客房类型管理</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>管理酒店的各种房型，支持新增、编辑、删除</p>
          </div>
          <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '200px' }}>
            <ApartmentOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <h4 style={{ marginTop: '16px' }}>客房信息管理</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>管理具体的客房，绑定房型，支持分页查询</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppLayout({ children }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginRight: '24px' }}>
          🏨 酒店管理系统
        </div>
      </Header>
      <Layout>
        <Sider
          width={200}
          theme="dark"
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              marginTop: '16px',
              borderRadius: '8px',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room-types" element={<RoomTypes />} />
          <Route path="/rooms" element={<Rooms />} />
        </Routes>
      </AppLayout>
    </Router>
  )
}

export default App
