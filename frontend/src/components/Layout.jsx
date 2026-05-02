import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Badge, Button, theme } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  FileTextOutlined,
  BellOutlined,
  SearchOutlined,
  AuditOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  CrownOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { notificationApi } from '../services/api';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isOperator, isFinance, isTechLead } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        setUnreadCount(response.data.data.unreadCount);
      } catch (e) {
        console.error('Failed to fetch unread count:', e);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMenuItems = () => {
    const items = [];
    
    if (isAdmin() || isOperator() || isFinance() || isTechLead()) {
      items.push({
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表盘',
      });
    }
    
    items.push({
      key: '/plans',
      icon: <ShopOutlined />,
      label: '套餐中心',
    });
    
    items.push({
      key: '/subscriptions',
      icon: <CrownOutlined />,
      label: '我的订阅',
    });
    
    items.push({
      key: '/invoices',
      icon: <FileTextOutlined />,
      label: '账单管理',
    });
    
    items.push({
      key: '/notifications',
      icon: <BellOutlined />,
      label: '通知中心',
      badge: unreadCount > 0 ? unreadCount : null,
    });
    
    if (isFinance() || isAdmin()) {
      items.push({
        key: '/audit',
        icon: <AuditOutlined />,
        label: '审计查询',
      });
    }
    
    return items;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'divider1',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const selectedKey = location.pathname;
  const menuItems = getMenuItems();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
      >
        <div className="sider-logo">
          {collapsed ? '订阅' : '订阅计费系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map(item => ({
            ...item,
            label: item.badge ? (
              <Badge count={item.badge} size="small" offset={[10, 0]}>
                {item.label}
              </Badge>
            ) : item.label,
          }))}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ float: 'right', marginRight: 24, display: 'flex', alignItems: 'center', height: '100%' }}>
            <Badge count={unreadCount} size="small" className="notification-badge">
              <Button 
                type="text" 
                icon={<BellOutlined style={{ fontSize: 18 }} />} 
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            
            <Dropdown 
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div className="user-dropdown">
                <Avatar 
                  icon={<UserOutlined />} 
                  className="user-avatar"
                />
                <span>{user?.display_name || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
