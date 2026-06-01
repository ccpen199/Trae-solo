import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu, ConfigProvider, theme } from 'antd'
import { UserOutlined, ProjectOutlined, FileTextOutlined, PayCircleOutlined, FileDoneOutlined, SettingOutlined, DashboardOutlined } from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Settlements from './pages/Settlements'
import Payments from './pages/Payments'
import Vouchers from './pages/Vouchers'
import Rules from './pages/Rules'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">仪表盘</Link> },
  { key: '/users', icon: <UserOutlined />, label: <Link to="/users">人员管理</Link> },
  { key: '/projects', icon: <ProjectOutlined />, label: <Link to="/projects">项目管理</Link> },
  { key: '/tasks', icon: <FileTextOutlined />, label: <Link to="/tasks">任务管理</Link> },
  { key: '/settlements', icon: <FileDoneOutlined />, label: <Link to="/settlements">结算管理</Link> },
  { key: '/payments', icon: <PayCircleOutlined />, label: <Link to="/payments">打款管理</Link> },
  { key: '/vouchers', icon: <FileDoneOutlined />, label: <Link to="/vouchers">凭证管理</Link> },
  { key: '/rules', icon: <SettingOutlined />, label: <Link to="/rules">规则配置</Link> },
]

function App() {
  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider theme="dark" width={200}>
            <div style={{ height: 64, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold' }}>
              灵活用工结算系统
            </div>
            <Menu mode="inline" defaultSelectedKeys={['/']} items={menuItems} theme="dark" />
          </Sider>
          <Layout>
            <Content style={{ padding: 24, background: '#f0f2f5' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/settlements" element={<Settlements />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/vouchers" element={<Vouchers />} />
                <Route path="/rules" element={<Rules />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
