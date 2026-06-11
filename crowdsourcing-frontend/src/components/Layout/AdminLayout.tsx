import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Input, Button } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  BgColorsOutlined,
  AuditOutlined,
  TeamOutlined,
  SafetyOutlined,
  AlertOutlined,
  FileTextOutlined,
  WalletOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { message } from 'antd';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, logout } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
      onClick: () => navigate('/admin/dashboard')
    },
    {
      key: '/admin/tasks-group',
      icon: <UnorderedListOutlined />,
      label: '办件管理',
      children: [
        {
          key: '/admin/tasks',
          label: '办件列表',
          onClick: () => navigate('/admin/tasks')
        },
        {
          key: '/admin/tasks/board',
          label: '办件看板',
          onClick: () => navigate('/admin/tasks/board')
        },
        {
          key: '/admin/tasks/review',
          label: '办件审核',
          onClick: () => navigate('/admin/tasks/review')
        }
      ]
    },
    {
      key: '/admin/providers',
      icon: <TeamOutlined />,
      label: '人员管理',
      onClick: () => navigate('/admin/providers')
    },
    {
      key: '/admin/ip',
      icon: <SafetyOutlined />,
      label: '知识产权',
      onClick: () => navigate('/admin/ip')
    },
    {
      key: '/admin/disputes',
      icon: <AlertOutlined />,
      label: '争议仲裁',
      onClick: () => navigate('/admin/disputes')
    },
    {
      key: '/admin/audit',
      icon: <FileTextOutlined />,
      label: '合规审计',
      onClick: () => navigate('/admin/audit')
    },
    {
      key: '/admin/finance',
      icon: <WalletOutlined />,
      label: '财务中心',
      onClick: () => navigate('/admin/finance')
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/admin/settings')
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      message.success('退出登录成功');
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/tasks')) {
      return [path];
    }
    return [path];
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        width={220}
        collapsed={collapsed}
        trigger={null}
        className="bg-white"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <h1 className={`font-bold text-primary-800 ${collapsed ? 'text-lg' : 'text-lg'}`}>
            {collapsed ? 'Admin' : '城市服务中枢'}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={['/admin/tasks-group']}
          items={menuItems}
          className="h-full border-none"
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between border-b border-gray-100 h-16">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="mr-4"
            />
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <Input
                placeholder="全局搜索..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge count={3}>
              <BellOutlined className="text-xl text-gray-600 cursor-pointer hover:text-primary-700 transition-colors" />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                <Avatar size={32} src={userInfo?.avatar} icon={<UserOutlined />}>
                  {userInfo?.name?.charAt(0)}
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-800">{userInfo?.name}</div>
                  <div className="text-xs text-gray-500">管理员</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
