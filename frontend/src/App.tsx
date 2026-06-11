import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Select } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  RocketOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  CarOutlined,
  SwapOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Voyages from './pages/Voyages';
import VoyageDetail from './pages/VoyageDetail';
import CargoBookings from './pages/CargoBookings';
import VesselTrading from './pages/VesselTrading';
import ContainerBooking from './pages/ContainerBooking';
import BidDetail from './pages/BidDetail';
import SpecialEquipment from './pages/SpecialEquipment';
import MatchingEngine from './pages/MatchingEngine';
import OrderCenter from './pages/OrderCenter';
import AdminDashboard from './pages/AdminDashboard';
import ProfileCenter from './pages/ProfileCenter';
import { useAppStore } from './store/appStore';
import { UserRole, ROLE_LABELS, ROLE_USERS } from './utils/permissions';

const { Header, Sider, Content, Footer } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAppStore();

  const handleRoleChange = (newRole: UserRole) => {
    const newUser = ROLE_USERS[newRole];
    setCurrentUser({
      id: newUser.id,
      name: newUser.name,
      company: newUser.company,
      role: newRole,
      email: newUser.email,
      phone: newUser.phone,
      qualifications: newUser.qualifications
    });
    navigate('/');
  };

  const roleLabels: Record<string, string> = {
    cargo_owner: '货主',
    ship_owner: '船东',
    forwarder: '货代',
    container_operator: '集装箱运营商',
    special_transport: '特种运输服务商'
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">工作台</Link> },
    { key: '/voyages', icon: <RocketOutlined />, label: <Link to="/voyages">航次动态</Link> },
    { key: '/cargo-bookings', icon: <ShoppingOutlined />, label: <Link to="/cargo-bookings">货盘管理</Link> },
    { key: '/matching', icon: <SwapOutlined />, label: <Link to="/matching">智能撮合</Link> },
    { key: '/vessel-trading', icon: <BarChartOutlined />, label: <Link to="/vessel-trading">船舶交易</Link> },
    { key: '/container-booking', icon: <AppstoreOutlined />, label: <Link to="/container-booking">集装箱订舱</Link> },
    { key: '/special-equipment', icon: <CarOutlined />, label: <Link to="/special-equipment">特种车船服务</Link> },
    { key: '/orders', icon: <FileTextOutlined />, label: <Link to="/orders">订单中心</Link> },
    { key: '/admin', icon: <BarChartOutlined />, label: <Link to="/admin">后台管理</Link> },
  ];

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'certification', label: '企业认证' },
    { key: 'logout', label: '退出登录' },
  ];

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="app-logo">
          <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <span>智慧货运协同平台</span>
        </div>
        <Space size="large">
          <div style={{ color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>切换身份：</span>
            <Select
              value={currentUser?.role as UserRole}
              onChange={handleRoleChange}
              style={{ width: 160 }}
              options={Object.entries(ROLE_LABELS).map(([key, label]) => ({
                value: key as UserRole,
                label
              }))}
            />
          </div>
          <span style={{ color: 'white', fontSize: '14px' }}>
            当前：{currentUser?.company} / {ROLE_LABELS[(currentUser?.role as UserRole) || 'cargo_owner']}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'profile' || key === 'certification') {
                    navigate(`/profile${key === 'certification' ? '?tab=certification' : ''}`);
                  }
                }
              }}
              placement="bottomRight"
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{currentUser?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Space>
      </Header>
      <Layout>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          style={{ background: '#fff' }}
        >
          <div style={{ height: '32px', margin: '16px' }} />
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ borderRight: 'none' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              padding: '12px',
              borderTop: '1px solid #f0f0f0',
              cursor: 'pointer',
              textAlign: 'center'
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </Sider>
        <Layout>
          <Content className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/voyages" element={<Voyages />} />
              <Route path="/voyages/:id" element={<VoyageDetail />} />
              <Route path="/cargo-bookings" element={<CargoBookings />} />
              <Route path="/matching" element={<MatchingEngine />} />
              <Route path="/vessel-trading" element={<VesselTrading />} />
              <Route path="/container-booking" element={<ContainerBooking />} />
              <Route path="/bids/:id" element={<BidDetail />} />
              <Route path="/special-equipment" element={<SpecialEquipment />} />
              <Route path="/orders" element={<OrderCenter />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/profile" element={<ProfileCenter />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
          <Footer className="app-footer">
            智慧货运协同平台 ©2024 - 面向全球航运物流生态的B2B智慧货运协同平台
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
