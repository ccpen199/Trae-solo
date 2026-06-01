import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider, Layout, Menu, theme } from 'antd'
import {
  FileSearchOutlined,
  DollarOutlined,
  InboxOutlined,
  FileTextOutlined,
  FileInvoiceOutlined,
  BarChartOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import Inquiries from './pages/Inquiries'
import Quotations from './pages/Quotations'
import Space from './pages/Space'
import Bookings from './pages/Bookings'
import BL from './pages/BL'
import Settlements from './pages/Settlements'
import Dashboard from './pages/Dashboard'

const { Header, Sider, Content } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/inquiries', icon: <FileSearchOutlined />, label: '询价管理' },
    { key: '/quotations', icon: <DollarOutlined />, label: '报价管理' },
    { key: '/space', icon: <InboxOutlined />, label: '舱位确认' },
    { key: '/bookings', icon: <FileTextOutlined />, label: '订舱委托' },
    { key: '/bl', icon: <FileInvoiceOutlined />, label: '提单资料' },
    { key: '/settlements', icon: <BarChartOutlined />, label: '费用结算' },
  ]

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 16 : 20, fontWeight: 'bold' }}>
              {collapsed ? '航运' : '航运订舱系统'}
            </div>
            <Menu theme="dark" selectedKeys={[window.location.pathname]} mode="inline" items={menuItems} />
          </Sider>
          <Layout>
            <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', paddingLeft: 24, fontSize: 18, fontWeight: 500 }}>
              航运订舱管理系统
            </Header>
            <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inquiries" element={<Inquiries />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/space" element={<Space />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/bl" element={<BL />} />
                <Route path="/settlements" element={<Settlements />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
