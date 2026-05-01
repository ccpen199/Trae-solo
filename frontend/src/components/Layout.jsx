import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
import {
  HomeOutlined,
  VideoCameraOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store';

const { Header, Sider, Content } = AntLayout;

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const roleMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <HomeOutlined />,
        label: '首页',
        onClick: () => navigate('/dashboard')
      },
      {
        key: '/lives',
        icon: <VideoCameraOutlined />,
        label: '直播间',
        onClick: () => navigate('/lives')
      },
      {
        key: '/orders',
        icon: <ShoppingCartOutlined />,
        label: '我的订单',
        onClick: () => navigate('/orders')
      }
    ];

    if (user?.role === 'merchant' || user?.role === 'platform_admin') {
      items.push({
        key: '/inventory',
        icon: <ShopOutlined />,
        label: '商品管理',
        onClick: () => navigate('/inventory')
      });
    }

    if (user?.role === 'platform_admin') {
      items.push({
        key: '/admin',
        icon: <DashboardOutlined />,
        label: '运营后台',
        onClick: () => navigate('/admin')
      });
    }

    items.push({
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    });

    return items;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  const getRoleName = (role) => {
    const roleMap = {
      platform_admin: '平台管理员',
      streamer: '主播',
      merchant: '商家',
      viewer: '观众'
    };
    return roleMap[role] || role;
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #1890ff, #ff4d4f)'
        }}>
          直播带货系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={roleMenuItems()}
        />
      </Sider>
      <AntLayout style={{ marginLeft: 200 }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
            欢迎使用直播带货系统
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.nickname || user?.username}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{getRoleName(user?.role)}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
