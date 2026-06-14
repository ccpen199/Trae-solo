import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Breadcrumb,
  Dropdown,
  Avatar,
  Badge,
  Button,
  theme,
  ConfigProvider,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  LayoutDashboard,
  UserCheck,
  ClipboardList,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Shield,
  BarChart3,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalStore } from '@/store/useGlobalStore';

const { Header, Sider, Content } = Layout;

const medicalBlue = '#1E6FD9';

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    label: 'Dashboard',
  },
  {
    key: '/nurses',
    icon: <UserCheck size={18} />,
    label: '护士资质',
  },
  {
    key: '/orders',
    icon: <ClipboardList size={18} />,
    label: '订单调度',
  },
  {
    key: '/service-control',
    icon: <ShieldCheck size={18} />,
    label: '服务管控',
  },
  {
    key: '/audit',
    icon: <FileCheck size={18} />,
    label: '审核中心',
  },
  {
    key: '/risk-control',
    icon: <AlertTriangle size={18} />,
    label: '风控中心',
  },
  {
    key: '/insurance',
    icon: <Shield size={18} />,
    label: '保险中心',
  },
  {
    key: '/statistics',
    icon: <BarChart3 size={18} />,
    label: '统计报表',
  },
];

const breadcrumbMap: Record<string, string[]> = {
  '/dashboard': ['首页', 'Dashboard'],
  '/nurses': ['首页', '护士资质管理'],
  '/orders': ['首页', '订单调度管理'],
  '/service-control': ['首页', '服务管控'],
  '/audit': ['首页', '审核中心'],
  '/risk-control': ['首页', '风控中心'],
  '/insurance': ['首页', '保险中心'],
  '/statistics': ['首页', '统计报表'],
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, dashboardStats, setAuth } = useGlobalStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User size={16} />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <Settings size={16} />,
      label: '系统设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      setAuth(null);
      navigate('/login');
    }
  };

  const breadcrumbItems = (breadcrumbMap[selectedKey] || ['首页']).map((item) => ({
    title: item,
  }));

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: medicalBlue,
          borderRadius: 6,
        },
        components: {
          Layout: {
            siderBg: '#001529',
            headerBg: '#ffffff',
          },
          Menu: {
            darkItemBg: '#001529',
            darkSubMenuItemBg: '#000c17',
            darkItemSelectedBg: medicalBlue,
          },
        },
      }}
    >
      <Layout className="min-h-screen">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          className="overflow-hidden"
        >
          <div
            className={cn(
              'flex h-16 items-center gap-3 border-b border-white/10 px-4',
              collapsed ? 'justify-center px-2' : ''
            )}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: medicalBlue }}
            >
              <Stethoscope size={20} className="text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="truncate text-base font-semibold text-white">
                  居家护理调度中台
                </div>
                <div className="truncate text-xs text-white/60">
                  安康护理服务中心
                </div>
              </div>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={handleMenuClick}
            className="border-r-0 py-2"
          />
        </Sider>
        <Layout>
          <Header
            className="flex h-16 items-center justify-between border-b px-0 shadow-sm"
            style={{ background: colorBgContainer, padding: 0 }}
          >
            <div className="flex items-center gap-4 pl-4">
              <Button
                type="text"
                icon={
                  collapsed ? (
                    <MenuUnfoldOutlined />
                  ) : (
                    <MenuFoldOutlined />
                  )
                }
                onClick={() => setCollapsed(!collapsed)}
                className="h-10 w-10"
              />
              <Breadcrumb
                items={breadcrumbItems}
                className="hidden md:block"
              />
            </div>
            <div className="flex items-center gap-2 pr-4">
              <Badge count={dashboardStats.riskAlerts} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<Bell size={18} />}
                  className="relative h-10 w-10"
                />
              </Badge>
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div
                  className="ml-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-100"
                  onClick={(e) => e.preventDefault()}
                >
                  <Avatar
                    size={32}
                    style={{ backgroundColor: medicalBlue }}
                    icon={<User size={16} />}
                  />
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-800">
                      {auth?.name || '用户'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {auth?.organizationName || ''}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </Dropdown>
            </div>
          </Header>
          <Content
            className="m-4 overflow-auto"
            style={{
              padding: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <div className="h-full p-6">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
