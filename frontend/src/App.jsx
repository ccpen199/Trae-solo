import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import PathwayList from './pages/PathwayList'
import PathwayDetail from './pages/PathwayDetail'
import PatientList from './pages/PatientList'
import PatientPathwayDetail from './pages/PatientPathwayDetail'
import OrderReview from './pages/OrderReview'
import AdverseEvents from './pages/AdverseEvents'
import QualityControl from './pages/QualityControl'

const { Header, Content, Sider } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">首页概览</Link>,
    },
    {
      key: '/pathways',
      icon: <MedicineBoxOutlined />,
      label: <Link to="/pathways">路径库管理</Link>,
    },
    {
      key: '/patients',
      icon: <UserOutlined />,
      label: <Link to="/patients">患者路径</Link>,
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: <Link to="/orders">医嘱审核</Link>,
    },
    {
      key: '/adverse-events',
      icon: <WarningOutlined />,
      label: <Link to="/adverse-events">不良反应</Link>,
    },
    {
      key: '/quality-control',
      icon: <BarChartOutlined />,
      label: <Link to="/quality-control">质控分析</Link>,
    },
  ]

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
            {collapsed ? 'CP' : '临床用药路径'}
          </div>
          <Menu theme="dark" defaultSelectedKeys={['/']} mode="inline" items={menuItems} />
        </Sider>
        <Layout>
          <Header style={{ padding: 0, background: colorBgContainer, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ paddingLeft: 24, fontSize: 20, fontWeight: 500 }}>临床用药路径管理系统</div>
          </Header>
          <Content style={{ margin: '24px', background: colorBgContainer, minHeight: 280 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pathways" element={<PathwayList />} />
              <Route path="/pathways/:id" element={<PathwayDetail />} />
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patient-pathways/:id" element={<PatientPathwayDetail />} />
              <Route path="/orders" element={<OrderReview />} />
              <Route path="/adverse-events" element={<AdverseEvents />} />
              <Route path="/quality-control" element={<QualityControl />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App
