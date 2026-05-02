import React from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Button, Badge } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuth } from '../store/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider, Header, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  FINANCIAL_MANAGER: 'FINANCIAL_MANAGER',
  CFO: 'CFO',
  AUDITOR: 'AUDITOR',
};

const getMenuItems = (role: string) => {
  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '资金看板',
      roles: [ROLES.ADMIN, ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.AUDITOR],
    },
    {
      key: '/accounts',
      icon: <BankOutlined />,
      label: '账户管理',
      roles: [ROLES.ADMIN, ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.CFO],
    },
    {
      key: '/payments',
      icon: <PayCircleOutlined />,
      label: '付款申请',
      roles: [ROLES.ADMIN, ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.CFO],
    },
    {
      key: '/reconciliation',
      icon: <CheckCircleOutlined />,
      label: '对账管理',
      roles: [ROLES.ADMIN, ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.AUDITOR],
    },
    {
      key: '/forecast',
      icon: <LineChartOutlined />,
      label: '资金预测',
      roles: [ROLES.ADMIN, ROLES.CFO, ROLES.FINANCIAL_MANAGER],
    },
    {
      key: '/audit',
      icon: <SafetyOutlined />,
      label: '审计日志',
      roles: [ROLES.ADMIN, ROLES.AUDITOR, ROLES.CFO],
    },
  ];

  return allMenuItems.filter((item) => item.roles.includes(role));
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: '系统管理员',
    CASHIER: '出纳',
    FINANCIAL_MANAGER: '财务经理',
    CFO: 'CFO',
    AUDITOR: '审计员',
  };
  return labels[role] || role;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = getMenuItems(user?.role || ROLES.CASHIER);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout className="main-layout">
      <Sider width={200} theme="dark">
        <div className="logo">
          <BankOutlined style={{ marginRight: 8 }} />
          银行账户管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header>
          <div className="header-left">
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {menuItems.find((m) => m.key === location.pathname)?.label || '资金看板'}
            </span>
          </div>
          <div className="header-right">
            <Badge count={0} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info" style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div style={{ fontSize: 14, color: '#333' }}>{user?.username}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{getRoleLabel(user?.role || '')}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>{children}</Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
