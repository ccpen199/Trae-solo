import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  HomeOutlined,
  ToolOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import useStore from './store/useStore';

import HomePage from './pages/HomePage';
import FaultDiagnosisPage from './pages/FaultDiagnosisPage';
import SubmitOrderPage from './pages/SubmitOrderPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import EngineerListPage from './pages/EngineerListPage';
import DashboardPage from './pages/admin/DashboardPage';
import EngineerManagePage from './pages/admin/EngineerManagePage';
import FaultLibraryPage from './pages/admin/FaultLibraryPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import PartsManagePage from './pages/admin/PartsManagePage';
import UsedDevicePage from './pages/admin/UsedDevicePage';

const { Header, Sider, Content } = Layout;

const App = () => {
  const currentView = useStore((state) => state.currentView);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const currentUser = useStore((state) => state.currentUser);
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: 'diagnosis',
      icon: <ToolOutlined />,
      label: '故障诊断',
    },
    {
      key: 'submit-order',
      icon: <SettingOutlined />,
      label: '提交维修',
    },
    {
      key: 'orders',
      icon: <DashboardOutlined />,
      label: '订单管理',
    },
    {
      key: 'engineers',
      icon: <TeamOutlined />,
      label: '工程师管理',
    },
    {
      key: 'admin-group',
      label: '运营后台',
      icon: <DatabaseOutlined />,
      children: [
        { key: 'dashboard', icon: <BarChartOutlined />, label: '数据看板' },
        { key: 'engineer-manage', label: '工程师管理' },
        { key: 'fault-library', label: '故障库管理' },
        { key: 'analytics', label: '数据分析' },
        { key: 'parts-manage', label: '配件管理' },
        { key: 'used-devices', label: '二手机库存' }
      ]
    }
  ];

  const renderPage = () => {
    switch (currentView) {
      case 'home': return <HomePage />;
      case 'diagnosis': return <FaultDiagnosisPage />;
      case 'submit-order': return <SubmitOrderPage />;
      case 'orders': return <OrderListPage />;
      case 'order-detail': return <OrderDetailPage />;
      case 'engineers': return <EngineerListPage />;
      case 'dashboard': return <DashboardPage />;
      case 'engineer-manage': return <EngineerManagePage />;
      case 'fault-library': return <FaultLibraryPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'parts-manage': return <PartsManagePage />;
      case 'used-devices': return <UsedDevicePage />;
      default: return <HomePage />;
    }
  };

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 600,
          background: 'rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '3C' : '3C维修平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentView]}
          items={menuItems}
          onClick={({ key }) => setCurrentView(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            欢迎使用3C设备上门维修O2O服务平台
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserOutlined />
            <span>{currentUser.name}</span>
          </div>
        </Header>
        <Content className="page-content">
          <div
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              padding: 24,
              minHeight: '100%'
            }}
          >
            {renderPage()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
