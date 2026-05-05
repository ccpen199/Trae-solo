import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, message, Button } from 'antd'
import {
  HomeOutlined,
  SearchOutlined,
  FileTextOutlined,
  UndoOutlined,
  ShopOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import Home from './pages/Home'
import TrainSearch from './pages/TrainSearch'
import Booking from './pages/Booking'
import TicketSell from './pages/TicketSell'
import Refund from './pages/Refund'
import OrderQuery from './pages/OrderQuery'
import InventoryView from './pages/InventoryView'
import { healthCheck } from './services/api'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/search', icon: <SearchOutlined />, label: '车次查询' },
  { key: '/booking', icon: <FileTextOutlined />, label: '在线订票' },
  { key: '/sell', icon: <ShopOutlined />, label: '窗口售票' },
  { key: '/refund', icon: <UndoOutlined />, label: '退票处理' },
  { key: '/orders', icon: <FileTextOutlined />, label: '订单查询' },
  { key: '/inventory', icon: <BarChartOutlined />, label: '库存监控' },
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [backendStatus, setBackendStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkBackend()
  }, [])

  const checkBackend = async () => {
    setLoading(true)
    try {
      const result = await healthCheck()
      setBackendStatus(result)
    } catch (error) {
      console.error('Backend check failed:', error)
      setBackendStatus({ status: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleMenuClick = (e) => {
    navigate(e.key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 12 : 18,
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #1890ff, #096dd9)',
        }}>
          {collapsed ? '🚂' : '🚂 火车购票系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
            火车购票管理系统
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button 
              type="link" 
              loading={loading}
              onClick={checkBackend}
            >
              刷新状态
            </Button>
            {backendStatus && (
              <div style={{ 
                color: backendStatus.status === 'ok' ? '#52c41a' : '#ff4d4f',
                fontSize: 14,
              }}>
                后端: {backendStatus.status === 'ok' ? '✅ 正常' : '❌ 异常'}
                {backendStatus.redis && (' | Redis: ' + (backendStatus.redis === 'available' ? '✅ 正常' : '⚠️ 降级'))}
              </div>
            )}
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<TrainSearch />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/sell" element={<TicketSell />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/orders" element={<OrderQuery />} />
            <Route path="/inventory" element={<InventoryView />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
