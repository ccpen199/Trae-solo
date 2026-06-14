import React, { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Breadcrumb } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  CreditCardOutlined,
  TransactionOutlined,
  WarningOutlined,
  FileTextOutlined,
  ForkOutlined,
  GiftOutlined,
  HistoryOutlined,
  LogoutOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentKey = pathParts[pathParts.length - 1] || 'dashboard';

  const adminStr = localStorage.getItem('tft_admin');
  let admin = null;
  try {
    admin = adminStr ? JSON.parse(adminStr) : null;
  } catch (error) {
    admin = null;
  }
  const adminToken = localStorage.getItem('tft_admin_token');

  useEffect(() => {
    if (!adminToken || !admin) {
      localStorage.removeItem('tft_admin_token');
      localStorage.removeItem('tft_admin');
      navigate('/login', { replace: true });
    }
  }, [adminToken, admin, navigate]);

  if (!adminToken || !admin) {
    return null;
  }

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据概览' },
    { key: 'users', icon: <UserOutlined />, label: '用户管理' },
    { key: 'cards', icon: <CreditCardOutlined />, label: '卡片管理' },
    { key: 'transactions', icon: <TransactionOutlined />, label: '交易管理' },
    { key: 'risk', icon: <WarningOutlined />, label: '风险控制' },
    { key: 'renewals', icon: <FileTextOutlined />, label: '年审管理' },
    { key: 'routes', icon: <ForkOutlined />, label: '线路管理' },
    { key: 'products', icon: <GiftOutlined />, label: '商品管理' },
    { key: 'logs', icon: <HistoryOutlined />, label: '操作日志' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(`/admin/${key}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('tft_admin_token');
    localStorage.removeItem('tft_admin');
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const adminMenu = {
    items: [
      { key: 'home', icon: <HomeOutlined />, label: '返回前台', onClick: handleGoHome },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ]
  };

  const breadcrumbItems = [
    { title: '管理后台' },
    { title: menuItems.find(m => m.key === currentKey)?.label || '页面' }
  ];

  return (
    <Layout className="admin-layout" style={{ minHeight: '100vh' }}>
      <Sider width={220}>
        <div style={{ padding: 20, color: 'white', fontSize: 18, fontWeight: 600, textAlign: 'center' }}>
          🚌 管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Breadcrumb items={breadcrumbItems} />
          {admin && (
            <Dropdown menu={adminMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#722ed1' }} icon={<UserOutlined />} />
                <span>{admin.real_name || admin.username}</span>
              </Space>
            </Dropdown>
          )}
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 'calc(100vh - 112px)' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
