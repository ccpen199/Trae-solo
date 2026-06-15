import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShopOutlined,
  BarChartOutlined,
  SafetyOutlined,
  MoneyCollectOutlined,
  CustomerServiceOutlined,
  FileTextOutlined
} from '@ant-design/icons'

import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import MerchantDashboard from './pages/MerchantDashboard'
import PriceCompare from './pages/PriceCompare'
import AfterSales from './pages/AfterSales'
import PlatformMonitor from './pages/PlatformMonitor'
import Compensation from './pages/Compensation'
import Settlement from './pages/Settlement'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '运营总览',
    group: '运营'
  },
  {
    key: '/orders',
    icon: <ShoppingOutlined />,
    label: '订单管理',
    group: '运营'
  },
  {
    key: '/merchant',
    icon: <ShopOutlined />,
    label: '商户配送看板',
    group: '商户端'
  },
  {
    key: '/price-compare',
    icon: <BarChartOutlined />,
    label: '运费比价引擎',
    group: '商户端'
  },
  {
    key: '/after-sales',
    icon: <CustomerServiceOutlined />,
    label: '售后协同中心',
    group: '商户端'
  },
  {
    key: '/platforms',
    icon: <SafetyOutlined />,
    label: '运力质量监控',
    group: '后台管理'
  },
  {
    key: '/compensation',
    icon: <FileTextOutlined />,
    label: 'SLA赔付管理',
    group: '后台管理'
  },
  {
    key: '/settlement',
    icon: <MoneyCollectOutlined />,
    label: '多平台结算中心',
    group: '后台管理'
  }
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    const group = item.group || '其他'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})

  const finalMenuItems = Object.entries(groupedItems).flatMap(([group, items]) => [
    {
      key: `group-${group}`,
      type: 'group',
      label: group,
      children: items
    }
  ])

  return (
    <Layout className="app-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo">
          <span>🚚</span>
          {!collapsed && <span>配送调度中台</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={finalMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              {menuItems.find(item => item.key === location.pathname)?.label || '配送调度中台'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#666' }}>管理员</span>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                A
              </div>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/price-compare" element={<PriceCompare />} />
            <Route path="/after-sales" element={<AfterSales />} />
            <Route path="/platforms" element={<PlatformMonitor />} />
            <Route path="/compensation" element={<Compensation />} />
            <Route path="/settlement" element={<Settlement />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
