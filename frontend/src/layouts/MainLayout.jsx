import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  SearchOutlined,
  HeartOutlined,
  MessageOutlined,
  FileTextOutlined,
  UserOutlined,
  PlusOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/stores/userStore';

const { Header, Content, Footer } = Layout;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/houses',
      icon: <SearchOutlined />,
      label: '找房子',
      onClick: () => navigate('/houses'),
    },
    {
      key: '/demands',
      icon: <PlusOutlined />,
      label: '找房需求',
      onClick: () => navigate('/demands'),
    },
  ];

  const userMenuItems = [
    {
      key: 'orders',
      icon: <FileTextOutlined />,
      label: '我的订单',
      onClick: () => navigate('/orders'),
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: '我的收藏',
      onClick: () => navigate('/favorites'),
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: '消息中心',
      onClick: () => navigate('/messages'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    ...(user?.role === 'landlord'
      ? [
          { type: 'divider' },
          {
            key: 'landlord',
            icon: <SettingOutlined />,
            label: '房东后台',
            onClick: () => navigate('/landlord'),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/');
      },
    },
  ];

  return (
    <Layout>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#ff4d4f',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            蚂蚁短租
          </div>
          
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{
              minWidth: 300,
              borderBottom: 'none',
              marginLeft: 24,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              <Badge count={0} size="small">
                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  onClick={() => navigate('/messages')}
                  style={{ fontSize: 18 }}
                />
              </Badge>
              <Badge count={0} size="small">
                <Button
                  type="text"
                  icon={<HeartOutlined />}
                  onClick={() => navigate('/favorites')}
                  style={{ fontSize: 18 }}
                />
              </Badge>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 20,
                    transition: 'background 0.3s',
                  }}
                >
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    src={user.avatar}
                    style={{ backgroundColor: '#ff4d4f' }}
                  />
                  <span style={{ marginLeft: 8, marginRight: 4 }}>
                    {user.nickname}
                  </span>
                  <DownOutlined style={{ fontSize: 12 }} />
                </div>
              </Dropdown>
            </>
          ) : (
            <>
              <Button type="text" onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                注册
              </Button>
            </>
          )}
        </div>
      </Header>

      <Content
        style={{
          minHeight: 'calc(100vh - 130px)',
          padding: '24px 48px',
        }}
      >
        <Outlet />
      </Content>

      <Footer
        style={{
          textAlign: 'center',
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <span style={{ marginRight: 24 }}>关于我们</span>
          <span style={{ marginRight: 24 }}>联系方式</span>
          <span style={{ marginRight: 24 }}>帮助中心</span>
          <span>隐私政策</span>
        </div>
        <div style={{ color: '#999', fontSize: 12 }}>
          蚂蚁短租 ©{new Date().getFullYear()} Created with ❤️
        </div>
      </Footer>
    </Layout>
  );
}

export default MainLayout;
