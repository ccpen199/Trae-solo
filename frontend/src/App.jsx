import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  ApartmentOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import Members from './pages/Members'
import Contracts from './pages/Contracts'
import Bookings from './pages/Bookings'
import Bills from './pages/Bills'

const { Header, Content, Sider } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">运营看板</Link> },
  { key: '/resources', icon: <ApartmentOutlined />, label: <Link to="/resources">空间资源</Link> },
  { key: '/members', icon: <TeamOutlined />, label: <Link to="/members">会员企业</Link> },
  { key: '/contracts', icon: <FileTextOutlined />, label: <Link to="/contracts">合同管理</Link> },
  { key: '/bookings', icon: <CalendarOutlined />, label: <Link to="/bookings">预约管理</Link> },
  { key: '/bills', icon: <DollarOutlined />, label: <Link to="/bills">账单管理</Link> }
]

function AppLayout() {
  const location = useLocation()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          共享办公管理系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/members" element={<Members />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bills" element={<Bills />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
