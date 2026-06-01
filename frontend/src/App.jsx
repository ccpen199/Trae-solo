import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  AppstoreOutlined,
  ControlOutlined,
  PlayCircleOutlined,
  DashboardOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import VersionsPage from './pages/VersionsPage.jsx'
import StrategiesPage from './pages/StrategiesPage.jsx'
import ReleasesPage from './pages/ReleasesPage.jsx'
import MonitorPage from './pages/MonitorPage.jsx'
import RollbackPage from './pages/RollbackPage.jsx'

const { Header, Sider, Content } = Layout

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { key: '/versions', icon: <AppstoreOutlined />, label: '应用版本' },
    { key: '/strategies', icon: <ControlOutlined />, label: '灰度策略' },
    { key: '/releases', icon: <PlayCircleOutlined />, label: '发布执行' },
    { key: '/monitor', icon: <DashboardOutlined />, label: '监控中心' },
    { key: '/rollback', icon: <RollbackOutlined />, label: '回滚中心' },
  ]

  return (
    <Layout className="app-container">
      <Sider className="sider" collapsed={collapsed} collapsible onCollapse={setCollapsed} theme="dark">
        <div className="logo">灰度发布</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className="main-content">
        <Header className="header">
          <span className="page-title">灰度发布管理平台</span>
        </Header>
        <Content className="content">
          <Routes>
            <Route path="/versions" element={<VersionsPage />} />
            <Route path="/strategies" element={<StrategiesPage />} />
            <Route path="/releases" element={<ReleasesPage />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/rollback" element={<RollbackPage />} />
            <Route path="/" element={<Navigate to="/versions" replace />} />
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