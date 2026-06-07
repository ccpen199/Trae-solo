import React, { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, Tag } from 'antd'
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  BarChartOutlined,
  BulbOutlined,
  MessageOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard.jsx'
import LawyerList from './pages/LawyerList.jsx'
import ConsultationList from './pages/ConsultationList.jsx'
import ConsultationNew from './pages/ConsultationNew.jsx'
import ContractList from './pages/ContractList.jsx'
import DocumentLibrary from './pages/DocumentLibrary.jsx'
import ChatRoom from './pages/ChatRoom.jsx'
import QualityAssessment from './pages/QualityAssessment.jsx'
import AuditLogs from './pages/AuditLogs.jsx'
import KnowledgeGraph from './pages/KnowledgeGraph.jsx'

const { Header, Sider, Content } = Layout

const App = () => {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">工作台</Link> },
    { key: '/lawyers', icon: <TeamOutlined />, label: <Link to="/lawyers">律师库</Link> },
    { key: '/consultations', icon: <FileSearchOutlined />, label: <Link to="/consultations">法律咨询</Link> },
    { key: '/consultations/new', icon: <FileTextOutlined />, label: <Link to="/consultations/new">发起咨询</Link> },
    { key: '/contracts', icon: <SafetyCertificateOutlined />, label: <Link to="/contracts">服务合约</Link> },
    { key: '/documents', icon: <FileTextOutlined />, label: <Link to="/documents">文书库</Link> },
    { key: '/quality', icon: <BarChartOutlined />, label: <Link to="/quality">质量评估</Link> },
    { key: '/knowledge', icon: <BulbOutlined />, label: <Link to="/knowledge">知识图谱</Link> },
    { key: '/audit', icon: <AuditOutlined />, label: <Link to="/audit">审计日志</Link> }
  ]

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-logo">
          <span style={{ fontSize: 24 }}>⚖️</span>
          <span>专业法律服务撮合与知识管理平台</span>
          <Tag color="blue">v1.0</Tag>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
          <span style={{ marginRight: 16 }}>前端: 127.0.0.1:50996</span>
          <span>后端: 127.0.0.1:60996</span>
        </div>
      </Header>
      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" width={200}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lawyers" element={<LawyerList />} />
            <Route path="/consultations" element={<ConsultationList />} />
            <Route path="/consultations/new" element={<ConsultationNew />} />
            <Route path="/chat/:id" element={<ChatRoom />} />
            <Route path="/contracts" element={<ContractList />} />
            <Route path="/documents" element={<DocumentLibrary />} />
            <Route path="/quality" element={<QualityAssessment />} />
            <Route path="/knowledge" element={<KnowledgeGraph />} />
            <Route path="/audit" element={<AuditLogs />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
