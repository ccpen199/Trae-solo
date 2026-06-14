import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  MoneyCollectOutlined,
  CalculatorOutlined,
  WarningOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

type UserType = 'resident' | 'flexible' | 'admin_tax' | 'admin_ops' | null;

const getUserType = (): UserType => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.userType as UserType;
    } catch {
      return null;
    }
  }
  return 'admin_ops';
};

const isAdmin = (userType: UserType): boolean => {
  return userType === 'admin_tax' || userType === 'admin_ops';
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userType = getUserType();
  const admin = isAdmin(userType);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      },
    },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/family',
      icon: <TeamOutlined />,
      label: '家庭共济账户',
      onClick: () => navigate('/family'),
    },
    {
      key: '/benefit',
      icon: <MoneyCollectOutlined />,
      label: '待遇发放中心',
      onClick: () => navigate('/benefit'),
    },
    {
      key: '/calculator',
      icon: <CalculatorOutlined />,
      label: '政策计算器',
      onClick: () => navigate('/calculator'),
    },
    ...(admin
      ? [
          {
            key: '/admin/warning',
            icon: <WarningOutlined />,
            label: '管理中心',
            onClick: () => navigate('/admin/warning'),
          },
          {
            key: '/admin/audit',
            icon: <FileTextOutlined />,
            label: '稽核规则',
            onClick: () => navigate('/admin/audit'),
          },
          {
            key: '/admin/datashare',
            icon: <ShareAltOutlined />,
            label: '数据共享',
            onClick: () => navigate('/admin/datashare'),
          },
        ]
      : []),
  ];

  const getSelectedKeys = (): string[] => {
    if (location.pathname === '/admin') return ['/admin/warning'];
    return [location.pathname];
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        className="bg-[#001529]"
      >
        <div className="h-16 flex items-center justify-center text-white font-bold text-xl border-b border-gray-700">
          {collapsed ? '社保' : '社保服务平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          className="border-none"
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm h-16">
          <h1 className="text-lg font-semibold text-gray-800">
            {(menuItems.find((item) => item && 'key' in item && item.key === location.pathname) as { label?: string })?.label ||
              '社保服务平台'}
          </h1>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
              <Avatar size="small" icon={<UserOutlined />} className="bg-primary" />
              <span className="text-gray-700">
                {userType === 'admin_tax' || userType === 'admin_ops' ? '管理员' : '用户'}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content className="m-6">
          <div className="bg-white rounded-lg p-6 min-h-[calc(100vh-176px)]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
