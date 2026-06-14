import { Layout as AntLayout, Menu, theme } from 'antd'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingOutlined,
  SwapOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
  BarChartOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  UserOutlined
} from '@ant-design/icons'

const { Header, Content, Sider } = AntLayout

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">管理后台</Link> },
  { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">数据看板</Link> },
  { key: '/profile', icon: <UserOutlined />, label: <Link to="/profile">个人中心</Link> },
  { key: '/workers', icon: <TeamOutlined />, label: <Link to="/workers">工人管理</Link> },
  { key: '/jobs', icon: <ShoppingOutlined />, label: <Link to="/jobs">招工需求</Link> },
  { key: '/jobs/new', icon: <ShoppingOutlined />, label: <Link to="/jobs/new">提交需求</Link> },
  { key: '/matches', icon: <SwapOutlined />, label: <Link to="/matches">智能匹配</Link> },
  { key: '/contracts', icon: <FileTextOutlined />, label: <Link to="/contracts">合同管理</Link> },
  { key: '/wage-payments', icon: <MoneyCollectOutlined />, label: <Link to="/wage-payments">工资支付</Link> },
  { key: '/analytics', icon: <BarChartOutlined />, label: <Link to="/analytics">分析统计</Link> },
  { key: '/employers', icon: <ApartmentOutlined />, label: <Link to="/employers">雇主管理</Link> },
  { key: '/trades', icon: <AppstoreOutlined />, label: <Link to="/trades">工种管理</Link> },
]

export default function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <AntLayout className="layout-container" style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '0 24px'
      }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ApartmentOutlined style={{ fontSize: '26px' }} />
          建筑业劳务供需智能撮合平台
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
          住建部门劳务监管管理端 | 今日: {new Date().toLocaleDateString('zh-CN')}
        </div>
      </Header>
      <AntLayout>
        <Sider width={220} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0, paddingTop: '12px' }}
            items={menuItems}
          />
        </Sider>
        <AntLayout style={{ padding: '24px', background: '#f0f2f5' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children ?? <Outlet />}
          </Content>
        </AntLayout>
      </AntLayout>
    </AntLayout>
  )
}
