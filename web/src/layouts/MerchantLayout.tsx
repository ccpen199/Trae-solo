import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, Dropdown, Button } from 'antd';
import {
  HomeOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api';

const { Header, Sider, Content } = Layout;

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/messages/unread-count').then((res) => setUnread(res.data.count));
  }, []);

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '工作台' },
    { key: '/products', icon: <ShopOutlined />, label: '商品管理' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
    { key: '/messages', icon: <Badge count={unread}><MessageOutlined /></Badge>, label: '消息中心' },
    { key: '/profile', icon: <UserOutlined />, label: '账户设置' },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '账户设置', onClick: () => navigate('/profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider style={{ background: '#001529' }}>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: '#fff' }}>商户平台</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>社区生活服务</p>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={<MessageOutlined />} onClick={() => navigate('/messages')}>
            <Badge count={unread} offset={[4, 0]}>消息</Badge>
          </Button>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: '#f5f7fa' }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
