import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  GiftOutlined,
  UserSwitchOutlined,
  ToolOutlined,
  MessageOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore, User } from '../store/auth';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const getMenuItems = (user: User | null) => {
    const items = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: '首页',
        onClick: () => navigate('/')
      },
      {
        key: '/resumes',
        icon: <FileTextOutlined />,
        label: '简历库',
        onClick: () => navigate('/resumes')
      },
      {
        key: '/jobs',
        icon: <GiftOutlined />,
        label: '职位悬赏',
        onClick: () => navigate('/jobs')
      },
      {
        key: '/recommendations',
        icon: <UserSwitchOutlined />,
        label: '推荐管理',
        onClick: () => navigate('/recommendations')
      },
      {
        key: '/toolbox',
        icon: <ToolOutlined />,
        label: '猎头工具箱',
        onClick: () => navigate('/toolbox')
      },
      {
        key: '/im',
        icon: <MessageOutlined />,
        label: '消息中心',
        onClick: () => navigate('/im')
      }
    ];

    if (user?.role === 'admin') {
      items.push({
        key: '/admin',
        icon: <SettingOutlined />,
        label: '管理后台',
        onClick: () => navigate('/admin')
      });
    }

    return items;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    {
      type: 'divider' as const
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

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/resumes')) return '/resumes';
    if (path.startsWith('/jobs')) return '/jobs';
    if (path.startsWith('/recommendations')) return '/recommendations';
    if (path.startsWith('/admin')) return '/admin';
    return path;
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: collapsed ? 14 : 20,
          color: '#1677ff',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {collapsed ? '猎' : '猎头平台'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={getMenuItems(user)}
          style={{ borderRight: 'none', paddingTop: 12 }}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          height: 64
        }}>
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px' }}
          >
            {collapsed ? '→' : '←'}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Badge count={3} offset={[-2, 2]}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
                transition: 'background 0.2s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar size={36} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{user?.real_name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {user?.role === 'admin' ? '管理员' : user?.role === 'company' ? '企业用户' : '猎头顾问'}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ background: '#f5f7fa', padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
