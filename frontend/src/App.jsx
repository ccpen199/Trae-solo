import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  UserOutlined,
  AudioOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Scenes from './pages/Scenes';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Voice from './pages/Voice';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">数据看板</Link> },
  { key: '/devices', icon: <AppstoreOutlined />, label: <Link to="/devices">设备管理</Link> },
  { key: '/scenes', icon: <ThunderboltOutlined />, label: <Link to="/scenes">场景编排</Link> },
  { key: '/orders', icon: <FileTextOutlined />, label: <Link to="/orders">服务工单</Link> },
  { key: '/users', icon: <UserOutlined />, label: <Link to="/users">用户管理</Link> },
  { key: '/voice', icon: <AudioOutlined />, label: <Link to="/voice">语音控制</Link> }
];

function App() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
          {collapsed ? '海信IoT' : '海信智慧家庭'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '16px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/scenes" element={<Scenes />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/users" element={<Users />} />
            <Route path="/voice" element={<Voice />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
