import React from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  WalletOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  AlertOutlined,
  TeamOutlined,
  BuildOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const roleMenuItems = {
  personal: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/account/balance', icon: <WalletOutlined />, label: '账户余额' },
    { key: '/account/transactions', icon: <FileTextOutlined />, label: '交易明细' },
    { key: '/account/loan', icon: <FileTextOutlined />, label: '贷款信息' },
    { key: '/withdrawal/apply', icon: <FileTextOutlined />, label: '提取申请' },
    { key: '/withdrawal/list', icon: <FileTextOutlined />, label: '申请记录' }
  ],
  unit_admin: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/unit/dashboard', icon: <TeamOutlined />, label: '数据看板' }
  ],
  developer: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/developer/dashboard', icon: <BuildOutlined />, label: '项目管理' }
  ],
  supervisor: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/admin/dashboard', icon: <BarChartOutlined />, label: '数据看板' },
    { key: '/withdrawal/approve', icon: <SafetyCertificateOutlined />, label: '提取审批' },
    { key: '/admin/audit', icon: <FileTextOutlined />, label: '审计日志' },
    { key: '/admin/config', icon: <SettingOutlined />, label: '中心配置' },
    { key: '/admin/risk', icon: <AlertOutlined />, label: '风险预警' }
  ],
  super_admin: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/admin/dashboard', icon: <BarChartOutlined />, label: '数据看板' },
    { key: '/withdrawal/approve', icon: <SafetyCertificateOutlined />, label: '提取审批' },
    { key: '/admin/audit', icon: <FileTextOutlined />, label: '审计日志' },
    { key: '/admin/config', icon: <SettingOutlined />, label: '中心配置' },
    { key: '/admin/risk', icon: <AlertOutlined />, label: '风险预警' }
  ]
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
  ];

  const menuItems = roleMenuItems[user?.role] || roleMenuItems.personal;

  return (
    <Layout className="layout-container">
      <Header className="header">
        <div className="header-title">
          全国住房公积金统一服务中台
        </div>
        <div className="header-user">
          <span>欢迎，{user?.name}</span>
          <Dropdown menu={{ items: userMenuItems }}>
            <Avatar icon={<UserOutlined />} />
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={200} className="sidebar">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            theme="dark"
          />
        </Sider>
        <Layout>
          <Content className="content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
