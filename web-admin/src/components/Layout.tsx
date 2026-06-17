import { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Breadcrumb, Input, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  Activity,
  FileText,
  Package,
  PlayCircle,
  Shield,
  User,
  LogOut,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Monitor,
  Plus,
} from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;

const breadcrumbMap: Record<string, string[]> = {
  '/health': ['健康看板', '健康概览'],
  '/health/dev001': ['健康看板', '设备健康详情'],
  '/audit': ['审计日志'],
  '/ota/firmwares': ['OTA管理', '固件管理'],
  '/ota/tasks': ['OTA管理', '发布任务'],
  '/ota/tasks/create': ['OTA管理', '创建任务'],
};

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(['health']);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const keys: string[] = [];
    if (path.startsWith('/health')) keys.push('health');
    if (path.startsWith('/ota')) keys.push('ota');
    if (keys.length > 0) {
      setOpenKeys(keys);
    }
  }, [location.pathname]);

  const getSelectedKeys = (): string[] => {
    const path = location.pathname;
    if (path === '/health') return ['health-overview'];
    if (path.startsWith('/health/')) return ['health-detail'];
    if (path.startsWith('/audit')) return ['audit'];
    if (path.startsWith('/ota/firmwares')) return ['firmwares'];
    if (path === '/ota/tasks') return ['tasks'];
    if (path.startsWith('/ota/tasks/create')) return ['create-task'];
    return [];
  };

  const getBreadcrumbs = (): string[] => {
    const path = location.pathname;
    if (path.startsWith('/health/') && path !== '/health' && path !== '/health/dev001') {
      return ['健康看板', '设备详情'];
    }
    for (const key of Object.keys(breadcrumbMap)) {
      if (path === key || (key !== '/health' && path.startsWith(key + '/'))) {
        return breadcrumbMap[key];
      }
      if (key === '/health' && path === '/health') {
        return breadcrumbMap[key];
      }
    }
    return ['首页'];
  };

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys as string[]);
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'health-overview':
        navigate('/health');
        break;
      case 'health-detail':
        navigate('/health/dev001');
        break;
      case 'audit':
        navigate('/audit');
        break;
      case 'firmwares':
        navigate('/ota/firmwares');
        break;
      case 'tasks':
        navigate('/ota/tasks');
        break;
      case 'create-task':
        navigate('/ota/tasks/create');
        break;
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'health',
      icon: <Activity size={18} />,
      label: '健康看板',
      children: [
        {
          key: 'health-overview',
          icon: <Activity size={16} />,
          label: '健康概览',
        },
        {
          key: 'health-detail',
          icon: <Monitor size={16} />,
          label: '设备健康详情',
        },
      ],
    },
    {
      key: 'audit',
      icon: <FileText size={18} />,
      label: '审计日志',
    },
    {
      key: 'ota',
      icon: <Package size={18} />,
      label: 'OTA管理',
      children: [
        {
          key: 'firmwares',
          icon: <Package size={16} />,
          label: '固件管理',
        },
        {
          key: 'tasks',
          icon: <PlayCircle size={16} />,
          label: '发布任务',
        },
        {
          key: 'create-task',
          icon: <Plus size={16} />,
          label: '创建任务',
        },
      ],
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User size={14} />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <Settings size={14} />,
      label: '系统设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <AntLayout className="h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        width={240}
        collapsedWidth={64}
        trigger={null}
      >
        <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-700/50">
          <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-semibold text-base truncate">IoT安防云平台</span>
              <span className="text-gray-400 text-xs truncate">管理控制台</span>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          items={menuItems}
          className="border-none mt-2"
          inlineIndent={16}
        />
      </Sider>
      <AntLayout>
        <Header className="bg-white border-b border-gray-200 px-6 flex items-center justify-between h-16 shadow-sm">
          <div className="flex items-center gap-4">
            <Breadcrumb
              separator={<ChevronRight size={14} className="text-gray-400" />}
              items={getBreadcrumbs().map((item, index) => ({
                title: (
                  <span className={index === getBreadcrumbs().length - 1 ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                    {item}
                  </span>
                ),
              }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="搜索设备、日志..."
              prefix={<Search size={16} className="text-gray-400" />}
              className="w-64"
              size="middle"
              allowClear
            />
            <Badge count={5} size="small">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                <Bell size={20} />
              </button>
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar
                  size={36}
                  className="bg-primary-500"
                  icon={<User size={18} />}
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-800">系统管理员</div>
                  <div className="text-xs text-gray-500">admin@iot-platform.com</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 overflow-auto">
          <div className="p-6 min-h-full">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
