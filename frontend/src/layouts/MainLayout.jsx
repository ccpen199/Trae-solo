import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import { 
  HomeOutlined, 
  TeamOutlined, 
  SearchOutlined, 
  UserOutlined, 
  FileTextOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserMenuItems = () => {
    const items = [
      {
        key: 'password',
        icon: <LockOutlined />,
        label: '修改密码',
        onClick: () => navigate('/password'),
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ];
    return items;
  };

  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <HomeOutlined />,
        label: '首页',
        onClick: () => navigate('/dashboard'),
      },
      {
        key: '/households',
        icon: <TeamOutlined />,
        label: '户籍管理',
        onClick: () => navigate('/households'),
      },
      {
        key: '/households/search',
        icon: <SearchOutlined />,
        label: '户籍查询',
        onClick: () => navigate('/households/search'),
      },
    ];

    if (isAdmin()) {
      items.push(
        {
          key: '/users',
          icon: <UserOutlined />,
          label: '用户管理',
          onClick: () => navigate('/users'),
        },
        {
          key: '/logs',
          icon: <FileTextOutlined />,
          label: '操作日志',
          onClick: () => navigate('/logs'),
        }
      );
    }

    return items;
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/households/') && path !== '/households/search') {
      return ['/households'];
    }
    return [path];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
      >
        <div style={{
          height: 64,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 18,
        }}>
          {collapsed ? '户籍' : '户籍管理系统'}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={getMenuItems()}
        />
      </Sider>
      
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#666' }}>
              {user?.realName} ({user?.role === 'admin' ? '管理员' : '普通用户'})
            </span>
            <Dropdown menu={{ items: getUserMenuItems() }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}>
                {user?.realName?.charAt(0)}
              </Avatar>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 4 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
