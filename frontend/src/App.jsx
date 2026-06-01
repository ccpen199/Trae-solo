import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BellOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Scheduling from './pages/Scheduling';
import Notifications from './pages/Notifications';
import Statistics from './pages/Statistics';

const { Header, Content, Sider } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '首页概览' },
    { key: '/cases', icon: <FileTextOutlined />, label: '案件管理' },
    { key: '/scheduling', icon: <CalendarOutlined />, label: '排期日历' },
    { key: '/notifications', icon: <BellOutlined />, label: '通知管理' },
    { key: '/statistics', icon: <BarChartOutlined />, label: '统计分析' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          庭审排期系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px', overflow: 'auto' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/scheduling" element={<Scheduling />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
