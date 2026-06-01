import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout as AntLayout, Menu } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Devices from './pages/Devices';
import Tags from './pages/Tags';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import {
  DesktopOutlined,
  TagOutlined,
  SendOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

const menuItems = [
  {
    key: '/devices',
    icon: <DesktopOutlined />,
    label: '设备管理'
  },
  {
    key: '/tags',
    icon: <TagOutlined />,
    label: '标签管理'
  },
  {
    key: '/tasks',
    icon: <SendOutlined />,
    label: '推送任务'
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: '报表统计'
  }
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const currentPath = location.pathname;

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Sider style={{ background: '#001529' }}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          推送管理系统
        </div>
        <Menu
          theme="dark"
          selectedKeys={[currentPath]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            {menuItems.find(item => item.key === currentPath)?.label || '系统'}
          </h2>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/devices" replace />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <HashRouter>
        <MainLayout />
      </HashRouter>
    </ConfigProvider>
  );
};

export default App;
