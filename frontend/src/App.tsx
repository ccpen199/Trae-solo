import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import { 
  DashboardOutlined, 
  UserOutlined, 
  CreditCardOutlined, 
  ShoppingOutlined, 
  PayCircleOutlined, 
  WarningOutlined, 
  FileSearchOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Farmers from './pages/Farmers'
import Credits from './pages/Credits'
import Orders from './pages/Orders'
import Repayments from './pages/Repayments'
import RiskControl from './pages/RiskControl'
import AuditLogs from './pages/AuditLogs'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '风控看板' },
  { key: '/farmers', icon: <UserOutlined />, label: '农户档案' },
  { key: '/credits', icon: <CreditCardOutlined />, label: '授信审批' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '赊销订单' },
  { key: '/repayments', icon: <PayCircleOutlined />, label: '还款管理' },
  { key: '/risk', icon: <WarningOutlined />, label: '风控管理' },
  { key: '/audit', icon: <FileSearchOutlined />, label: '审计日志' },
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer } } = theme.useToken()

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          农资赊销系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>农资赊销授信管理平台</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>管理员</span>
          </div>
        </Header>
        <Content style={{ margin: '16px', padding: 24, background: colorBgContainer, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farmers" element={<Farmers />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/repayments" element={<Repayments />} />
            <Route path="/risk" element={<RiskControl />} />
            <Route path="/audit" element={<AuditLogs />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
