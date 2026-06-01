import React, { useState } from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FileSearchOutlined,
  AlertOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '首页概览',
  },
  {
    key: '/cases',
    icon: <FileSearchOutlined />,
    label: '感染病例',
  },
  {
    key: '/alerts',
    icon: <AlertOutlined />,
    label: '暴发预警',
  },
  {
    key: '/tasks',
    icon: <CheckSquareOutlined />,
    label: '整改追踪',
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: '统计报表',
  },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = location.pathname.startsWith('/cases/') ? '/cases' :
                      location.pathname.startsWith('/alerts/') ? '/alerts' :
                      location.pathname.startsWith('/tasks/') ? '/tasks' :
                      location.pathname;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: 64,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 12 : 16,
          fontWeight: 'bold',
        }}>
          {collapsed ? '感控' : '感染监测系统'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: 0, background: '#fff' }}>
          <div style={{ padding: '0 24px', fontSize: 18, fontWeight: 'bold' }}>
            医院感染管理科
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 8 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
