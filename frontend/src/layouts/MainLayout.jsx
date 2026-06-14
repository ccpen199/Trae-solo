import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ProjectOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  FileProtectOutlined,
  AuditOutlined,
  ShopOutlined,
  BookOutlined,
  TagOutlined,
  AlertOutlined,
  UnorderedListOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getMenuItems = () => {
    const role = user?.role;
    const items = [
      { key: '/', icon: <HomeOutlined />, label: '首页' },
      { key: '/cases', icon: <AppstoreOutlined />, label: '案例图库' },
      { key: '/style-migration', icon: <PictureOutlined />, label: 'AI风格迁移' }
    ];

    if (role === 'owner' || role === 'admin' || role === 'designer' || role === 'company_admin') {
      items.push({ key: '/quotations', icon: <FileTextOutlined />, label: '报价管理' });
      items.push({ key: '/projects', icon: <ProjectOutlined />, label: '项目管理' });
    }

    if (role === 'designer' || role === 'company_admin' || role === 'admin') {
      items.push({
        key: '/erp',
        icon: <ScheduleOutlined />,
        label: 'ERP协同',
        children: [
          { key: '/erp/schedules', icon: <ScheduleOutlined />, label: '设计师排期' },
          { key: '/erp/gantt', icon: <BarChartOutlined />, label: '施工甘特图' },
          { key: '/erp/materials', icon: <FileProtectOutlined />, label: '材料进场计划' }
        ]
      });
    }

    if (role === 'manager' || role === 'owner' || role === 'company_admin' || role === 'admin') {
      items.push({
        key: '/manager',
        icon: <AuditOutlined />,
        label: '装修管家',
        children: [
          { key: '/manager/logs', icon: <FileTextOutlined />, label: '施工日志' },
          { key: '/manager/acceptance', icon: <AuditOutlined />, label: '验收打卡' },
          { key: '/manager/funds', icon: <TagOutlined />, label: '资金监管' },
          { key: '/manager/disputes', icon: <AlertOutlined />, label: '纠纷仲裁' }
        ]
      });
    }

    if (role === 'admin') {
      items.push({ key: '/admin/dashboard', icon: <ShopOutlined />, label: '后台管理' });
      items.push({ key: '/admin/companies', icon: <ShopOutlined />, label: '装修公司审核' });
      items.push({ key: '/admin/process', icon: <BookOutlined />, label: '工艺工法知识库' });
      items.push({ key: '/admin/materials', icon: <TagOutlined />, label: '建材价格监测' });
      items.push({ key: '/admin/complaints', icon: <AlertOutlined />, label: '投诉溯源分析' });
      items.push({ key: '/admin/audit-logs', icon: <UnorderedListOutlined />, label: '操作审计日志' });
    }

    return items;
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
    ]
  };

  const selectedKeys = [location.pathname];
  const openKeys = [];
  if (location.pathname.startsWith('/erp')) openKeys.push('/erp');
  if (location.pathname.startsWith('/manager')) openKeys.push('/manager');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          color: '#fff',
          fontSize: collapsed ? 14 : 16,
          fontWeight: 600,
          background: 'rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '装修' : '装修产业协同平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            欢迎使用装修产业互联网设计协同平台
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={userMenu}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.name || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '16px', background: '#fff', borderRadius: 8, padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
