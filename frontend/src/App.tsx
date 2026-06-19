import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  DollarOutlined,
  FileTextOutlined,
  HeartOutlined,
  RiseOutlined,
  StarOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Riders from './pages/Riders';
import Income from './pages/Income';
import Complaints from './pages/Complaints';
import HealthMonitor from './pages/HealthMonitor';
import Prediction from './pages/Prediction';
import CreditScore from './pages/CreditScore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据大盘' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理' },
  { key: '/riders', icon: <TeamOutlined />, label: '骑士管理' },
  { key: '/income', icon: <DollarOutlined />, label: '收入明细' },
  { key: '/complaints', icon: <FileTextOutlined />, label: '申诉工单' },
  { key: '/health', icon: <HeartOutlined />, label: '运力健康度' },
  { key: '/prediction', icon: <RiseOutlined />, label: '单量预测' },
  { key: '/credit', icon: <StarOutlined />, label: '信用分管理' },
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div className="logo">
          <span style={{ fontSize: '20px' }}>🚚</span>
          <span>配送调度中台</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className="site-layout">
        <Header
          className="site-layout-background"
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {menuItems.find((item) => item.key === location.pathname)?.label || '管理后台'}
          </h2>
          <div style={{ color: '#666', fontSize: '14px' }}>
            管理员 | 同城配送调度中心
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 0,
            minHeight: 280,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/riders" element={<Riders />} />
            <Route path="/income" element={<Income />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/health" element={<HealthMonitor />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/credit" element={<CreditScore />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
