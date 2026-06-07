import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Tag } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
  RocketOutlined,
  CoffeeOutlined,
  ScheduleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Cinemas from './pages/Cinemas';
import Movies from './pages/Movies';
import Showtimes from './pages/Showtimes';
import Orders from './pages/Orders';
import Audiences from './pages/Audiences';
import Wallet from './pages/Wallet';
import Crowdfunding from './pages/Crowdfunding';
import Concessions from './pages/Concessions';
import Scheduling from './pages/Scheduling';
import Analytics from './pages/Analytics';

const { Sider, Content, Header } = Layout;

const menuItems = [
  {
    type: 'group',
    label: '工作台',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    ],
  },
  {
    type: 'group',
    label: '票务协同',
    children: [
      { key: '/cinemas', icon: <BankOutlined />, label: '影院管理' },
      { key: '/movies', icon: <VideoCameraOutlined />, label: '影片管理' },
      { key: '/showtimes', icon: <ClockCircleOutlined />, label: '场次管理' },
      { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
      { key: '/audiences', icon: <TeamOutlined />, label: '观众管理' },
    ],
  },
  {
    type: 'group',
    label: '智能运营',
    children: [
      { key: '/scheduling', icon: <ScheduleOutlined />, label: '智能排片' },
      { key: '/wallet', icon: <WalletOutlined />, label: '卖座卡钱包' },
      { key: '/crowdfunding', icon: <RocketOutlined />, label: '众筹包场' },
      { key: '/concessions', icon: <CoffeeOutlined />, label: '小卖品管理' },
    ],
  },
  {
    type: 'group',
    label: '数据分析',
    children: [
      { key: '/analytics?tab=heatmap', icon: <BarChartOutlined />, label: '区域票房热力图' },
      { key: '/analytics?tab=lifecycle', icon: <BarChartOutlined />, label: '影片生命周期' },
      { key: '/analytics?tab=ltv', icon: <BarChartOutlined />, label: '观众LTV预测' },
      { key: '/analytics?tab=abtest', icon: <BarChartOutlined />, label: '营销A/B测试' },
    ],
  },
  {
    type: 'group',
    label: '系统管理',
    children: [
      { key: '/auth', icon: <UserOutlined />, label: '登录注册' },
      { key: '/movies?discover', icon: <VideoCameraOutlined />, label: '发现分类' },
      { key: '/audiences?register', icon: <TeamOutlined />, label: '观众注册' },
    ],
  },
];

function AuthCenter() {
  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>登录注册与账号管理</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>运营账号</h3>
          <p>演示账号：admin / admin123</p>
          <Tag color="blue">后台管理</Tag>
        </div>
        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>观众注册</h3>
          <p>支持观众资料建档、卖座卡绑定与订单核销。</p>
          <Tag color="green">注册链路</Tag>
        </div>
        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>权限说明</h3>
          <p>本地演示模式默认进入运营工作台，API 与 SQLite 数据已打通。</p>
          <Tag color="purple">登录注册</Tag>
        </div>
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark" style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0 }}>
        <div style={{ height: 48, margin: 16, color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', lineHeight: '48px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          影院聚合平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname + location.search]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>影院娱乐服务聚合平台</span>
          <Tag color="blue" style={{ marginLeft: 12 }}>后台管理</Tag>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<AuthCenter />} />
            <Route path="/cinemas" element={<Cinemas />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/showtimes" element={<Showtimes />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/audiences" element={<Audiences />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/crowdfunding" element={<Crowdfunding />} />
            <Route path="/concessions" element={<Concessions />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
