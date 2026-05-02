import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Button, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  ProductOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { notificationApi } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const roleMenuItems = {
  policyholder: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/products', icon: <ProductOutlined />, label: '选购险种' },
    { key: '/policies', icon: <FileTextOutlined />, label: '我的保单' },
    { key: '/claims', icon: <SafetyCertificateOutlined />, label: '理赔申请' }
  ],
  agent: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/products', icon: <ProductOutlined />, label: '险种管理' },
    { key: '/policies', icon: <FileTextOutlined />, label: '保单管理' }
  ],
  underwriter: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/products', icon: <ProductOutlined />, label: '险种审批' },
    { key: '/policies', icon: <FileTextOutlined />, label: '核保处理' }
  ],
  claim_adjuster: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/claims', icon: <SafetyCertificateOutlined />, label: '理赔处理' }
  ],
  admin: [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/products', icon: <ProductOutlined />, label: '险种管理' },
    { key: '/policies', icon: <FileTextOutlined />, label: '保单管理' },
    { key: '/claims', icon: <SafetyCertificateOutlined />, label: '理赔管理' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统设置' }
  ]
};

const roleNames = {
  policyholder: '投保人',
  agent: '代理人',
  underwriter: '核保员',
  claim_adjuster: '理赔员',
  admin: '管理员'
};

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('获取未读消息失败:', error);
      }
    };
    fetchUnread();
    
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = roleMenuItems[user?.role] || roleMenuItems.policyholder;

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    try {
      await notificationApi.markAllAsRead();
    } catch (e) {
      console.error('Logout error:', e);
    }
    clearAuth();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'notifications',
      icon: (
        <Badge count={unreadCount} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: '消息通知'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true
    }
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'notifications') {
      navigate('/notifications');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        width={240}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? 0 : 16
        }}>
          <ProductOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          {!collapsed && (
            <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>保险系统</span>
          )}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount}>
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            
            <Dropdown 
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4
              }}>
                <Avatar icon={<UserOutlined />} />
                {!collapsed && (
                  <div style={{ marginLeft: 8, textAlign: 'left' }}>
                    <Text strong style={{ display: 'block', fontSize: 14 }}>{user?.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{roleNames[user?.role]}</Text>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{ 
          margin: 24, 
          padding: 24, 
          minHeight: 280,
          background: colorBgContainer,
          borderRadius: 8
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
