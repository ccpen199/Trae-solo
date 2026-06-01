import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  ExperimentOutlined,
  BugOutlined,
  UserOutlined,
  ToolOutlined,
  BarChartOutlined,
  CameraOutlined,
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import InspectionTasks from './pages/InspectionTasks'
import DefectRecords from './pages/DefectRecords'
import Rejudge from './pages/Rejudge'
import DeviceStatus from './pages/DeviceStatus'
import Reports from './pages/Reports'
import ModelVersions from './pages/ModelVersions'

const { Header, Sider, Content } = Layout

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">数据看板</Link> },
    { key: '/tasks', icon: <ExperimentOutlined />, label: <Link to="/tasks">检测任务</Link> },
    { key: '/models', icon: <CameraOutlined />, label: <Link to="/models">模型版本</Link> },
    { key: '/defects', icon: <BugOutlined />, label: <Link to="/defects">缺陷记录</Link> },
    { key: '/rejudge', icon: <UserOutlined />, label: <Link to="/rejudge">人工复判</Link> },
    { key: '/devices', icon: <ToolOutlined />, label: <Link to="/devices">设备状态</Link> },
    { key: '/reports', icon: <BarChartOutlined />, label: <Link to="/reports">质量报表</Link> },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          视觉检测系统
        </div>
        <Menu theme="dark" mode="inline" items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ paddingLeft: 24, fontSize: 18, fontWeight: 500 }}>
            工业视觉检测管理系统
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<InspectionTasks />} />
            <Route path="/models" element={<ModelVersions />} />
            <Route path="/defects" element={<DefectRecords />} />
            <Route path="/rejudge" element={<Rejudge />} />
            <Route path="/devices" element={<DeviceStatus />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
