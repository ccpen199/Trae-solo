import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  HomeOutlined,
  MessageOutlined,
  FireOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TrophyOutlined,
  WalletOutlined,
  TeamOutlined,
  BuildOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider, Header, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/topics', icon: <MessageOutlined />, label: '邻里话题' },
  { key: '/topics/aggregated', icon: <FireOutlined />, label: '跨区热议' },
  { key: '/shop', icon: <ShopOutlined />, label: '邻里优选' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '我的订单' },
  { key: '/tasks', icon: <TrophyOutlined />, label: '任务中心' },
  { key: '/wallet', icon: <WalletOutlined />, label: '小金库' },
  { key: '/partners', icon: <TeamOutlined />, label: '合伙开店' },
  { key: '/property', icon: <BuildOutlined />, label: '物业服务' },
  { key: '/admin', icon: <SettingOutlined />, label: '管理后台' },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const community = localStorage.getItem('community') || '默认社区';

  const selectedKey = menuItems?.find((item) => {
    if (!item || typeof item === 'string') return false;
    const key = (item as { key: string }).key;
    if (key === '/') return location.pathname === '/';
    return location.pathname.startsWith(key);
  })
    ? ((menuItems?.find((item) => {
        if (!item || typeof item === 'string') return false;
        const key = (item as { key: string }).key;
        if (key === '/') return location.pathname === '/';
        return location.pathname.startsWith(key);
      }) as { key: string })?.key ?? '/')
    : '/';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('community');
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') handleLogout();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 32,
            margin: 16,
            color: '#fff',
            textAlign: 'center',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 'bold',
            lineHeight: '32px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '邻里' : '邻里数字基座'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            🏘️ {community}
          </span>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>居民用户</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#f5f5f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
