import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Login from './pages/Login';
import Home from './pages/Home';
import EnterpriseList from './pages/enterprise/List';
import EnterpriseDetail from './pages/enterprise/Detail';
import PolicyList from './pages/policy/List';
import PolicyDetail from './pages/policy/Detail';
import PolicyApplication from './pages/policy/Application';
import MyApplications from './pages/policy/MyApplications';
import ServiceList from './pages/service/List';
import ServiceDetail from './pages/service/Detail';
import Reservation from './pages/reservation/Index';
import MyReservations from './pages/reservation/MyReservations';
import DeclarationList from './pages/declaration/List';
import Chat from './pages/citizen/Chat';
import CityServices from './pages/citizen/CityServices';
import AdminDashboard from './pages/admin/Dashboard';
import AdminApplications from './pages/admin/Applications';
import ServiceManage from './pages/admin/ServiceManage';
import Monitor from './pages/admin/Monitor';
import Effectiveness from './pages/admin/Effectiveness';
import PublishManage from './pages/admin/PublishManage';
import Profile from './pages/Profile';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/home', label: '首页' },
  { key: '/enterprise', label: '企业服务' },
  { key: '/policy', label: '惠企政策' },
  { key: '/declarations', label: '我的申报' },
  { key: '/services', label: '服务事项' },
  { key: '/reservation', label: '预约办事' },
  { key: '/reservations', label: '我的预约' },
  { key: '/chat', label: '智能导办' },
  { key: '/city', label: '城市服务' },
];

const adminMenuItems = [
  { key: '/admin', label: '管理首页' },
  { key: '/admin/applications', label: '申报审核' },
  { key: '/admin/effectiveness', label: '政策效能' },
  { key: '/admin/services', label: '服务管理' },
  { key: '/admin/publish', label: '多端发布' },
  { key: '/admin/monitor', label: '系统监控' },
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', label: '个人中心', onClick: () => navigate('/profile') },
    { key: 'logout', label: '退出登录', onClick: handleLogout, danger: true }
  ];

  const isAdmin = user?.userType === 'admin';
  const currentMenuItems = location.pathname.startsWith('/admin') ? adminMenuItems : menuItems;

  const getSelectedKey = () => {
    const path = location.pathname;
    const match = currentMenuItems.find(item => path === item.key || path.startsWith(item.key + '/'));
    return match ? [match.key] : [path];
  };

  return (
    <Layout>
      <Header>
        <div className="logo">浙江省一网通办平台</div>
        <div className="user-info">
          <Dropdown menu={{ items: userMenuItems }}>
            <span style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span style={{ marginLeft: 8, color: '#fff' }}>{user?.realName || user?.username}</span>
              <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
                [{isAdmin ? '管理员' : user?.userType === 'enterprise' ? '企业用户' : '个人用户'}]
              </span>
            </span>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={200} collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKey()}
            items={currentMenuItems}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Layout>
          <Content>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/enterprise" element={<EnterpriseList />} />
              <Route path="/enterprise/:id" element={<EnterpriseDetail />} />
              <Route path="/policy" element={<PolicyList />} />
              <Route path="/policy/:id" element={<PolicyDetail />} />
              <Route path="/policy/:id/apply" element={<PolicyApplication />} />
              <Route path="/policy/applications" element={<MyApplications />} />
              <Route path="/services" element={<ServiceList />} />
              <Route path="/services/:code" element={<ServiceDetail />} />
              <Route path="/reservation" element={<Reservation />} />
              <Route path="/reservations" element={<MyReservations />} />
              <Route path="/declarations" element={<DeclarationList />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/city" element={<CityServices />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/applications" element={<AdminApplications />} />
              <Route path="/admin/effectiveness" element={<Effectiveness />} />
              <Route path="/admin/services" element={<ServiceManage />} />
              <Route path="/admin/publish" element={<PublishManage />} />
              <Route path="/admin/monitor" element={<Monitor />} />
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/home" /> : <Login onLogin={() => setIsAuthenticated(true)} />
        } />
        <Route path="/*" element={
          isAuthenticated ? <MainLayout /> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
