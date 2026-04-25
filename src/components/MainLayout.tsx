import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography } from 'antd';
import {
  DashboardOutlined,
  GlobalOutlined,
  SearchOutlined,
  BellOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppStore } from '../store/appStore';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentPage, setCurrentPage, alerts } = useAppStore();
  
  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;
  
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '舆情概览',
      onClick: () => setCurrentPage('dashboard')
    },
    {
      key: 'sources',
      icon: <GlobalOutlined />,
      label: '来源管理',
      onClick: () => setCurrentPage('sources')
    },
    {
      key: 'monitoring',
      icon: <SearchOutlined />,
      label: '舆情监测',
      onClick: () => setCurrentPage('monitoring')
    },
    {
      key: 'alerts',
      icon: (
        <Badge count={unreadAlertsCount} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: '风险预警',
      onClick: () => setCurrentPage('alerts')
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: '简报导出',
      onClick: () => setCurrentPage('reports')
    }
  ];
  
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ];
  
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return '舆情概览';
      case 'sources': return '来源管理';
      case 'monitoring': return '舆情监测';
      case 'alerts': return '风险预警';
      case 'reports': return '简报导出';
      default: return '舆情监控系统';
    }
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={240}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          {collapsed ? (
            <DashboardOutlined style={{ fontSize: 24, color: '#fff' }} />
          ) : (
            <Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
              舆情监控系统
            </Title>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
        />
      </Sider>
      
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: 18, cursor: 'pointer' }
              }
            )}
            <Title level={4} style={{ margin: 0 }}>{getPageTitle()}</Title>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadAlertsCount} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => setCurrentPage('alerts')} />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer'
              }}>
                <Avatar icon={<UserOutlined />} />
                <span>张三</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{
          margin: 24,
          padding: 24,
          background: '#fff',
          minHeight: 280,
          borderRadius: 8
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
