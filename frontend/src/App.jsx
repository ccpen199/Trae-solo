import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  SearchOutlined,
  FileTextOutlined,
  HistoryOutlined,
  AuditOutlined,
  DatabaseOutlined
} from '@ant-design/icons'
import QueryPage from './pages/QueryPage'
import ReportListPage from './pages/ReportListPage'
import ReportDetailPage from './pages/ReportDetailPage'
import QueryHistoryPage from './pages/QueryHistoryPage'
import AuditLogPage from './pages/AuditLogPage'
import DataSourcePage from './pages/DataSourcePage'

const { Header, Content, Sider } = Layout

function App() {
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <SearchOutlined />,
      label: <Link to="/">企业查询</Link>
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: <Link to="/reports">报告列表</Link>
    },
    {
      key: '/queries',
      icon: <HistoryOutlined />,
      label: <Link to="/queries">查询历史</Link>
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: <Link to="/audit">审计日志</Link>
    },
    {
      key: '/datasources',
      icon: <DatabaseOutlined />,
      label: <Link to="/datasources">数据源监控</Link>
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" style={{ position: 'fixed', left: 0, top: 0, bottom: 0 }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          企业征信系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header style={{ background: '#fff', padding: 0, paddingLeft: 24, borderBottom: '1px solid #e8e8e8' }}>
          <h2 style={{ margin: 0 }}>企业征信报告系统</h2>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Routes>
            <Route path="/" element={<QueryPage />} />
            <Route path="/reports" element={<ReportListPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/queries" element={<QueryHistoryPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/datasources" element={<DataSourcePage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
