import { Layout, Menu, Avatar, Dropdown, Space, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, CompassOutlined, QrcodeOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, SettingOutlined, DashboardOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

function MainLayout({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/discover', icon: <CompassOutlined />, label: '发现' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const userMenu = {
    items: [
      user?.role === 'admin' ? { key: 'admin', icon: <SettingOutlined />, label: '管理后台' } : null,
      { key: 'orders', icon: <ShoppingOutlined />, label: '我的订单' },
      { key: 'tickets', icon: <QrcodeOutlined />, label: '我的票夹' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }
    ].filter(Boolean),
    onClick: ({ key }) => {
      if (key === 'logout') {
        handleLogout();
      } else if (key === 'admin') {
        navigate('/admin');
      } else {
        navigate(`/${key}`);
      }
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1890ff', margin: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>
            🎫 票务中台
          </h1>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ border: 'none', flex: 1 }}
          />
        </div>
        <Space size="middle">
          {user ? (
            <>
              <Space size={4}>
                <Button type="text" size="small" icon={<ShoppingOutlined />} onClick={() => navigate('/orders')}>我的订单</Button>
                <Button type="text" size="small" icon={<QrcodeOutlined />} onClick={() => navigate('/tickets')}>我的票夹</Button>
                {user.role === 'admin' && (
                  <Button type="primary" size="small" icon={<DashboardOutlined />} onClick={() => navigate('/admin')}>管理后台</Button>
                )}
              </Space>
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{user.username}</span>
                </Space>
              </Dropdown>
            </>
          ) : (
            <Space>
              <a onClick={() => navigate('/login')} style={{ color: '#666' }}>登录</a>
              <a onClick={() => navigate('/register')} style={{ color: '#666' }}>注册</a>
            </Space>
          )}
        </Space>
      </Header>
      <Content style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        泛娱乐票务中台系统 ©2024
      </Footer>
    </Layout>
  );
}

export default MainLayout;
