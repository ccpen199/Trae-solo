import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  HomeOutlined,
  ApartmentOutlined,
  UserOutlined,
  DashboardOutlined,
  ShopOutlined,
  SafetyOutlined,
  BookOutlined,
  MoneyCollectOutlined,
  BellOutlined,
  SearchOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useRequest } from 'ahooks';
import { mapApi } from '../../api';

const { Header, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserLocation, setCenterLocation } = useAppStore();

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setCenterLocation(loc);
        },
        () => {
          setCenterLocation({ lat: 39.9042, lng: 116.4074 });
        }
      );
    }
  }, [setUserLocation, setCenterLocation]);

  useRequest(() => mapApi.getHealth(), {
    retryCount: 3,
    retryInterval: 2000,
    onError: (err) => {
      console.warn('Backend health check failed:', err.message);
    },
  });

  const mainMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">地图找房</Link>,
    },
    {
      key: '/properties',
      icon: <ApartmentOutlined />,
      label: <Link to="/properties">房源列表</Link>,
    },
    {
      key: '/estates',
      icon: <ShopOutlined />,
      label: <Link to="/estates">楼盘字典</Link>,
    },
    {
      key: '/brokers',
      icon: <UserOutlined />,
      label: <Link to="/brokers">经纪人</Link>,
    },
    {
      key: '/price-evaluation',
      icon: <MoneyCollectOutlined />,
      label: <Link to="/price-evaluation">房价评估</Link>,
    },
  ];

  const adminMenuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">管理看板</Link>,
    },
    {
      key: '/admin/estate-dictionary',
      icon: <ShopOutlined />,
      label: <Link to="/admin/estate-dictionary">楼盘字典</Link>,
    },
    {
      key: '/admin/fake-detection',
      icon: <SafetyOutlined />,
      label: <Link to="/admin/fake-detection">虚假房源</Link>,
    },
    {
      key: '/admin/training',
      icon: <BookOutlined />,
      label: <Link to="/admin/training">培训管理</Link>,
    },
    {
      key: '/admin/commissions',
      icon: <MoneyCollectOutlined />,
      label: <Link to="/admin/commissions">佣金管理</Link>,
    },
  ];

  const userMenu = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: '2',
      icon: <BellOutlined />,
      label: '消息通知',
    },
    {
      type: 'divider' as const,
    },
    {
      key: '3',
      label: '退出登录',
    },
  ];

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return [adminMenuItems.find(item => path.startsWith(item.key))?.key || '/admin/dashboard'];
    }
    return [mainMenuItems.find(item => path.startsWith(item.key))?.key || '/'];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1677ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onClick={() => navigate('/')}
          >
            <EnvironmentOutlined style={{ fontSize: 24 }} />
            中原地产
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={getSelectedKeys()}
            items={location.pathname.startsWith('/admin') ? adminMenuItems : mainMenuItems}
            style={{ minWidth: 500, borderBottom: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {location.pathname.startsWith('/admin') ? (
            <a onClick={() => navigate('/')} style={{ color: '#666' }}>
              ← 返回前台
            </a>
          ) : (
            <a onClick={() => navigate('/admin/dashboard')} style={{ color: '#666' }}>
              管理后台 →
            </a>
          )}
          <Badge count={3} size="small">
            <BellOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
          </Badge>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
              <span style={{ color: '#333' }}>张先生</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout;
