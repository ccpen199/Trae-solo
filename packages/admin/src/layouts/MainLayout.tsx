import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  KeyOutlined,
  FileTextOutlined,
  ShopOutlined,
  TeamOutlined,
  BarChartOutlined,
  MonitorOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import type { PropsWithChildren } from 'react';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '数据概览',
  },
  {
    key: '/kpi',
    icon: <BarChartOutlined />,
    label: 'KPI 看板',
  },
  {
    key: 'access',
    icon: <KeyOutlined />,
    label: '门禁管理',
    children: [
      { key: '/access/devices', label: '门禁设备' },
      { key: '/access/logs', label: '通行日志' },
    ],
  },
  {
    key: 'ticket',
    icon: <FileTextOutlined />,
    label: '工单管理',
    children: [
      { key: '/tickets', label: '工单列表' },
    ],
  },
  {
    key: 'service',
    icon: <ShopOutlined />,
    label: 'O2O 服务',
    children: [
      { key: '/service/providers', label: '服务商管理' },
      { key: '/service/items', label: '服务商品' },
      { key: '/service/orders', label: '服务订单' },
      { key: '/service/commissions', label: '佣金结算' },
    ],
  },
  {
    key: 'community',
    icon: <HomeOutlined />,
    label: '社区管理',
    children: [
      { key: '/community/list', label: '小区列表' },
      { key: '/community/buildings', label: '楼栋房产' },
    ],
  },
  {
    key: '/users',
    icon: <TeamOutlined />,
    label: '用户管理',
  },
  {
    key: 'monitor',
    icon: <MonitorOutlined />,
    label: '监控告警',
    children: [
      { key: '/monitor/status', label: '设备监控' },
      { key: '/monitor/alerts', label: '告警中心' },
    ],
  },
];

export default function MainLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const userMenu = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人设置',
    },
    {
      type: 'divider' as const,
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

  const findOpenKeys = () => {
    const path = location.pathname;
    for (const item of menuItems) {
      if (item.children?.some((c: any) => c.key === path)) {
        return [item.key];
      }
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          borderBottom: '1px solid #1E293B',
        }}>
          <span style={{ fontSize: 28 }}>🏘️</span>
          <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>社区服务中台</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={findOpenKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none', paddingTop: 12 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ color: '#0F172A', fontSize: 16, fontWeight: 500 }}>
            欢迎回来，{user?.nickname}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Badge count={3} dot>
              <BellOutlined style={{ fontSize: 20, color: '#64748B', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <Avatar size={32} style={{ backgroundColor: '#10B981' }}>
                  {user?.nickname?.charAt(0)}
                </Avatar>
                <span style={{ color: '#334155' }}>{user?.nickname}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
