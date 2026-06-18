import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FileProtectOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, roleNames } from '../store/auth';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getMenuItems = () => {
    const items: any[] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '工作台',
        onClick: () => navigate('/dashboard'),
      },
    ];

    if (user?.role === 'owner') {
      items.push(
        { key: '/demands', icon: <FileTextOutlined />, label: '我的需求', onClick: () => navigate('/demands') },
        { key: '/contracts', icon: <FileProtectOutlined />, label: '我的合同', onClick: () => navigate('/contracts') },
        { key: '/supervision', icon: <VideoCameraOutlined />, label: '工地监控', onClick: () => navigate('/supervision') },
        { key: '/showroom', icon: <ShopOutlined />, label: '云样板间', onClick: () => navigate('/showroom') },
        { key: '/workorders', icon: <CustomerServiceOutlined />, label: '工单中心', onClick: () => navigate('/workorders') }
      );
    }

    if (user?.role === 'designer') {
      items.push(
        { key: '/demands', icon: <FileTextOutlined />, label: '需求列表', onClick: () => navigate('/demands') },
        { key: '/contracts', icon: <FileProtectOutlined />, label: '项目合同', onClick: () => navigate('/contracts') },
        { key: '/supervision', icon: <VideoCameraOutlined />, label: '工地监控', onClick: () => navigate('/supervision') },
        { key: '/showroom', icon: <ShopOutlined />, label: '云样板间', onClick: () => navigate('/showroom') }
      );
    }

    if (user?.role === 'supervisor') {
      items.push(
        { key: '/contracts', icon: <FileProtectOutlined />, label: '负责项目', onClick: () => navigate('/contracts') },
        { key: '/supervision', icon: <VideoCameraOutlined />, label: 'AI监理', onClick: () => navigate('/supervision') },
        { key: '/gis', icon: <EnvironmentOutlined />, label: 'GIS服务', onClick: () => navigate('/gis') }
      );
    }

    if (user?.role === 'supplier') {
      items.push(
        { key: '/contracts', icon: <FileProtectOutlined />, label: '供货合同', onClick: () => navigate('/contracts') },
        { key: '/gis', icon: <EnvironmentOutlined />, label: '网点分布', onClick: () => navigate('/gis') }
      );
    }

    if (user?.role === 'store_manager' || user?.role === 'admin') {
      items.push(
        { key: '/demands', icon: <FileTextOutlined />, label: '需求管理', onClick: () => navigate('/demands') },
        { key: '/contracts', icon: <FileProtectOutlined />, label: '合同管理', onClick: () => navigate('/contracts') },
        { key: '/supervision', icon: <VideoCameraOutlined />, label: 'AI监理', onClick: () => navigate('/supervision') },
        { key: '/showroom', icon: <ShopOutlined />, label: '云样板间', onClick: () => navigate('/showroom') },
        { key: '/gis', icon: <EnvironmentOutlined />, label: 'GIS服务', onClick: () => navigate('/gis') },
        { key: '/workorders', icon: <CustomerServiceOutlined />, label: '工单管理', onClick: () => navigate('/workorders') },
        {
          key: 'admin',
          icon: <BarChartOutlined />,
          label: '管理后台',
          children: [
            { key: '/admin/dashboard', label: '数据看板', onClick: () => navigate('/admin/dashboard') },
            { key: '/admin/contracts', label: '履约追踪', onClick: () => navigate('/admin/contracts') },
            { key: '/admin/bom', label: 'BOM分析', onClick: () => navigate('/admin/bom') },
            { key: '/admin/warranty', label: '质保管理', onClick: () => navigate('/admin/warranty') },
            { key: '/admin/nps', label: 'NPS回访', onClick: () => navigate('/admin/nps') },
            { key: '/admin/users', label: '用户管理', onClick: () => navigate('/admin/users') },
          ],
        }
      );
    }

    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          height: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            家装产业协同SaaS平台
          </Title>
          {user && (
            <Text type="secondary">
              {roleNames[user.role]} · {user.real_name}
            </Text>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" onClick={() => navigate('/gis')}>
            <EnvironmentOutlined /> GIS服务
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />}>
                {user?.real_name?.charAt(0)}
              </Avatar>
              <Text>{user?.real_name}</Text>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider
          width={220}
          style={{ background: '#001529', paddingTop: 16 }}
          theme="dark"
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            style={{ border: 'none' }}
          />
        </Sider>

        <Layout style={{ padding: 24, background: '#f5f7fa' }}>
          <Content style={{ minHeight: 'calc(100vh - 64px - 48px)' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
