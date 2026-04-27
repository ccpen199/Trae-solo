import { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  StockOutlined,
  CoffeeOutlined,
  MedicineBoxOutlined,
  CalculatorOutlined,
  WarningOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { UserRoleLabels } from '@/types';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
    path: '/',
  },
  {
    key: 'livestock',
    icon: <StockOutlined />,
    label: '牲畜管理',
    path: '/livestock',
    children: [
      { key: 'livestock-list', icon: null, label: '牲畜列表', path: '/livestock/list' },
      { key: 'livestock-admission', icon: null, label: '进场登记', path: '/livestock/admission' },
    ],
  },
  {
    key: 'feeding',
    icon: <CoffeeOutlined />,
    label: '饲喂管理',
    path: '/feeding',
    children: [
      { key: 'feeding-record', icon: null, label: '饲喂记录', path: '/feeding/record' },
      { key: 'feeding-plan', icon: null, label: '喂养计划', path: '/feeding/plan' },
    ],
  },
  {
    key: 'vaccination',
    icon: <MedicineBoxOutlined />,
    label: '防疫管理',
    path: '/vaccination',
    children: [
      { key: 'vaccination-record', icon: null, label: '防疫记录', path: '/vaccination/record' },
      { key: 'vaccination-calendar', icon: null, label: '疫苗日历', path: '/vaccination/calendar' },
      { key: 'vaccination-compliance', icon: null, label: '合规检查', path: '/vaccination/compliance' },
    ],
  },
  {
    key: 'settlement',
    icon: <CalculatorOutlined />,
    label: '结算管理',
    path: '/settlement',
    children: [
      { key: 'settlement-slaughter', icon: null, label: '出栏结算', path: '/settlement/slaughter' },
      { key: 'settlement-profit', icon: null, label: '毛利看板', path: '/settlement/profit' },
    ],
  },
  {
    key: 'anomaly',
    icon: <WarningOutlined />,
    label: '异常管理',
    path: '/anomaly',
    children: [
      { key: 'anomaly-queue', icon: null, label: '异常队列', path: '/anomaly/queue' },
      { key: 'anomaly-health-check', icon: null, label: '健康排查', path: '/anomaly/health-check' },
      { key: 'anomaly-history', icon: null, label: '异常历史', path: '/anomaly/history' },
    ],
  },
  {
    key: 'statistics',
    icon: <BarChartOutlined />,
    label: '统计分析',
    path: '/statistics',
    children: [
      { key: 'statistics-overview', icon: null, label: '全场概览', path: '/statistics/overview' },
      { key: 'statistics-production', icon: null, label: '生产性能', path: '/statistics/production' },
      { key: 'statistics-cost', icon: null, label: '成本毛利', path: '/statistics/cost' },
      { key: 'statistics-anomaly', icon: null, label: '异常监控', path: '/statistics/anomaly' },
    ],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    path: '/system',
    children: [
      { key: 'system-user', icon: null, label: '用户管理', path: '/system/user' },
      { key: 'system-role', icon: null, label: '角色权限', path: '/system/role' },
      { key: 'system-barn', icon: null, label: '栏舍管理', path: '/system/barn' },
      { key: 'system-settings', icon: null, label: '系统设置', path: '/system/settings' },
    ],
  },
];

const flattenMenuItems = (items: MenuItem[]): Record<string, string> => {
  const result: Record<string, string> = {};
  items.forEach((item) => {
    result[item.path] = item.key;
    if (item.children) {
      Object.assign(result, flattenMenuItems(item.children));
    }
  });
  return result;
};

const pathToKeyMap = flattenMenuItems(menuItems);

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const getSelectedKeys = () => {
    const key = pathToKeyMap[location.pathname];
    return key ? [key] : [];
  };

  const getOpenKeys = () => {
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.path === location.pathname || location.pathname.startsWith(item.path)) {
            return [item.key];
          }
        }
      }
    }
    return [];
  };

  const handleMenuClick: MenuProps['onClick'] = ({ keyPath }) => {
    const allItems = [...menuItems];
    menuItems.forEach((item) => {
      if (item.children) {
        allItems.push(...item.children);
      }
    });
    const clickedItem = allItems.find((item) => item.key === keyPath[0]);
    if (clickedItem) {
      navigate(clickedItem.path);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={240}>
        <div className="logo" style={{ height: 64, margin: 16, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 20, fontWeight: 'bold' }}>
          {collapsed ? '畜' : '畜牧管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          onClick={handleMenuClick}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: item.children?.map((child) => ({
              key: child.key,
              label: child.label,
            })),
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
              {user?.name} ({user ? UserRoleLabels[user.role] : ''})
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar size={40} icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 6,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
