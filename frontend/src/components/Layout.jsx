import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Button, Badge, message } from 'antd';
import {
  HomeOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  PlusOutlined,
  BellOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content, Sider } = Layout;

const AppLayout = ({ children, showSidebar = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人中心</Link>
    },
    {
      key: 'my-products',
      icon: <ShopOutlined />,
      label: <Link to="/my-products">我的商品</Link>
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/orders">我的订单</Link>
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <Link to="/favorites">我的收藏</Link>
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  if (user?.role === 'admin') {
    userMenuItems.splice(5, 0, {
      key: 'admin',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">管理后台</Link>
    });
  }

  const headerMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>
    },
    {
      key: '/announcements',
      icon: <BellOutlined />,
      label: <Link to="/announcements">公告</Link>
    }
  ];

  const userAvatar = (
    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
        <span style={{ color: '#fff' }}>{user?.nickname || user?.username}</span>
      </div>
    </Dropdown>
  );

  const getSidebarMenuItems = () => {
    const items = [
      {
        key: '/profile',
        icon: <UserOutlined />,
        label: <Link to="/profile">个人资料</Link>
      },
      {
        key: '/my-products',
        icon: <ShopOutlined />,
        label: <Link to="/my-products">我的商品</Link>
      },
      {
        key: '/publish',
        icon: <PlusOutlined />,
        label: <Link to="/publish">发布商品</Link>
      },
      {
        key: '/orders',
        icon: <ShoppingCartOutlined />,
        label: <Link to="/orders">我的订单</Link>
      },
      {
        key: '/favorites',
        icon: <HeartOutlined />,
        label: <Link to="/favorites">我的收藏</Link>
      }
    ];

    if (user?.role === 'admin') {
      items.push({
        key: '/admin',
        icon: <DashboardOutlined />,
        label: <Link to="/admin">管理后台</Link>
      });
    }

    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#001529'
      }}>
        <div style={{ 
          color: '#fff', 
          fontSize: 20, 
          fontWeight: 'bold',
          marginRight: 40
        }}>
          <Link to="/" style={{ color: '#fff' }}>
            校园二手交易
          </Link>
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={headerMenuItems}
          style={{ flex: 1, minWidth: 0 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated ? (
            <>
              <Link to="/publish">
                <Button type="primary" icon={<PlusOutlined />}>
                  发布商品
                </Button>
              </Link>
              {userAvatar}
            </>
          ) : (
            <>
              <Link to="/login">
                <Button type="primary">登录</Button>
              </Link>
              <Link to="/login">
                <Button>注册</Button>
              </Link>
            </>
          )}
        </div>
      </Header>

      <Layout>
        {showSidebar && isAuthenticated && (
          <Sider width={200} theme="light" style={{ position: 'sticky', top: 64, height: 'calc(100vh - 64px)' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={getSidebarMenuItems()}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
        )}
        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
