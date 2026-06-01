import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  FormOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import SubmitPage from './pages/SubmitPage'
import ListPage from './pages/ListPage'
import DetailPage from './pages/DetailPage'
import DashboardPage from './pages/DashboardPage'

const { Header, Content, Sider } = Layout

const App = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const location = useLocation()

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/detail')) return '2'
    if (location.pathname === '/list') return '2'
    if (location.pathname === '/dashboard') return '3'
    return '1'
  }

  const menuItems = [
    {
      key: '1',
      icon: <FormOutlined />,
      label: <Link to="/">提交反馈</Link>,
    },
    {
      key: '2',
      icon: <UnorderedListOutlined />,
      label: <Link to="/list">反馈列表</Link>,
    },
    {
      key: '3',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">统计看板</Link>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginRight: '40px' }}>
          用户反馈系统
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Routes>
              <Route path="/" element={<SubmitPage />} />
              <Route path="/list" element={<ListPage />} />
              <Route path="/detail/:id" element={<DetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App
