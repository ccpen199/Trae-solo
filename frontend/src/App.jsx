import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FilterOutlined,
  ShoppingOutlined,
  PhoneOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Segments from './pages/Segments';
import Products from './pages/Products';
import Touch from './pages/Touch';
import Applications from './pages/Applications';
import Reports from './pages/Reports';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
  { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
  { key: '/segments', icon: <FilterOutlined />, label: '客群筛选' },
  { key: '/products', icon: <ShoppingOutlined />, label: '分期产品' },
  { key: '/touch', icon: <PhoneOutlined />, label: '触达记录' },
  { key: '/applications', icon: <FileTextOutlined />, label: '申请审批' },
  { key: '/reports', icon: <BarChartOutlined />, label: '营销报表' },
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          分期营销系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '16px', overflow: 'initial' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/segments" element={<Segments />} />
              <Route path="/products" element={<Products />} />
              <Route path="/touch" element={<Touch />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
