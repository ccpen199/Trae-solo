import { Layout, Menu, Dropdown, Avatar, Badge, Button, Space } from 'antd';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import { useEffect } from 'react';

const { Header, Content, Footer } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useUserStore();
  const { items, fetchCart } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/news',
      icon: <FileTextOutlined />,
      label: <Link to="/news">新闻中心</Link>,
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: <Link to="/products">产品中心</Link>,
    },
  ];

  const getUserMenu = () => {
    const items = [];
    
    if (isAuthenticated) {
      items.push({
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile'),
      });
      
      if (user?.role === 'DEALER') {
        items.push({
          key: 'dealer',
          icon: <SettingOutlined />,
          label: '经销商门户',
          onClick: () => navigate('/dealer'),
        });
      }
      
      items.push({
        type: 'divider' as const,
      });
      
      items.push({
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
          navigate('/');
        },
      });
    }

    return items;
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return '/';
    if (path.startsWith('/news')) return '/news';
    if (path.startsWith('/products')) return '/products';
    return path;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 50px',
          background: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            marginRight: '40px',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          金种子酒业
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            borderBottom: 'none',
          }}
        />

        <Space size="middle">
          <Badge count={items.length} showZero>
            <Button
              type="text"
              icon={<ShoppingCartOutlined style={{ fontSize: '18px', color: 'white' }} />}
              onClick={() => navigate('/cart')}
              style={{ color: 'white' }}
            />
          </Badge>

          {isAuthenticated ? (
            <Dropdown menu={{ items: getUserMenu() }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
                <span style={{ color: 'white', marginLeft: '8px' }}>
                  {user?.nickname || user?.username}
                </span>
              </div>
            </Dropdown>
          ) : (
            <Space>
              <Button type="text" style={{ color: 'white' }} onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                注册
              </Button>
            </Space>
          )}
        </Space>
      </Header>

      <Content
        style={{
          padding: '24px 50px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px - 70px)',
        }}
      >
        <Outlet />
      </Content>

      <Footer
        style={{
          textAlign: 'center',
          background: '#333',
          color: '#999',
        }}
      >
        <p>金种子酒业 ©2024 Created by 金种子团队</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          品牌宣传 | 产品中心 | 会员系统 | 在线下单 | 经销商门户
        </p>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
