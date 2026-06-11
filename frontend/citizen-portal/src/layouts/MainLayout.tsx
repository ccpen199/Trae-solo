import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Input, Avatar, Dropdown, Button, theme } from 'antd';
import {
  HomeOutlined,
  BankOutlined,
  PayCircleOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  IdcardOutlined,
  MessageOutlined,
  UserOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { logoutThunk } from '@/store/slices/authSlice';
import { clearUserInfo } from '@/store/slices/userSlice';
import { removeToken } from '@/utils/auth';

const { Header, Sider, Content, Footer } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/government', icon: <BankOutlined />, label: '政务服务' },
  { key: '/payment', icon: <PayCircleOutlined />, label: '便民缴费' },
  { key: '/living', icon: <CustomerServiceOutlined />, label: '生活服务' },
  { key: '/subsidy', icon: <GiftOutlined />, label: '消费补贴' },
  { key: '/certificate', icon: <IdcardOutlined />, label: '我的证照' },
  { key: '/ticket', icon: <MessageOutlined />, label: '诉求提交' },
  { key: '/profile', icon: <UserOutlined />, label: '个人中心' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const userInfo = useSelector((state: RootState) => state.user.info);
  const { token: { colorBgContainer } } = theme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk());
      dispatch(clearUserInfo());
      removeToken();
      navigate('/login');
    } catch {
      dispatch(clearUserInfo());
      removeToken();
      navigate('/login');
    }
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'logout') {
      handleLogout();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%)',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#fff', fontSize: 16 }}
          />
          <h1
            style={{ color: '#fff', margin: 0, fontSize: 18, whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            贵州省全域数字服务融合平台
          </h1>
        </div>
        <Input
          placeholder="搜索服务事项..."
          prefix={<SearchOutlined />}
          style={{ width: 300, borderRadius: 20 }}
          allowClear
        />
        <div>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar
                  src={userInfo?.avatar}
                  icon={!userInfo?.avatar && <UserOutlined />}
                  style={{ backgroundColor: '#fff', color: '#1B5E20' }}
                />
                <span style={{ color: '#fff' }}>{userInfo?.name || '用户'}</span>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" ghost onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </div>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={200}
          style={{ background: colorBgContainer }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Content style={{ background: colorBgContainer, margin: 0 }}>
            <Outlet />
          </Content>
          <Footer style={{ textAlign: 'center', background: colorBgContainer }}>
            贵州省全域数字服务融合平台 ©2024 版权所有 | 黔ICP备XXXXXXXX号 | 联系电话：0851-12345
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}
