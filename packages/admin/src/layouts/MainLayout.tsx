import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Tag, Button, Space } from 'antd';
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
  SwapOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore, USER_ROLES, RoleConfig } from '@/store/user';
import type { PropsWithChildren } from 'react';

const { Header, Sider, Content } = Layout;

const baseMenuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '数据概览',
  },
  {
    key: '/kpi',
    icon: <BarChartOutlined />,
    label: 'KPI 看板',
    roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'PROPERTY_STAFF', 'COMMITTEE'],
  },
  {
    key: 'access',
    icon: <KeyOutlined />,
    label: '门禁管理',
    roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'PROPERTY_STAFF', 'COMMITTEE'],
    children: [
      { key: '/access/devices', label: '门禁设备' },
      { key: '/access/logs', label: '通行日志' },
    ],
  },
  {
    key: 'ticket',
    icon: <FileTextOutlined />,
    label: '工单管理',
    roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'PROPERTY_STAFF', 'COMMITTEE', 'RESIDENT'],
    children: [
      { key: '/tickets', label: '工单列表' },
    ],
  },
  {
    key: 'service',
    icon: <ShopOutlined />,
    label: 'O2O 服务',
    roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'SERVICE_PROVIDER', 'RESIDENT'],
    children: [
      { key: '/service/providers', label: '服务商管理', roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN'] },
      { key: '/service/items', label: '服务商品' },
      { key: '/service/orders', label: '服务订单' },
      { key: '/service/commissions', label: '佣金结算', roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'SERVICE_PROVIDER'] },
    ],
  },
  {
    key: 'community',
    icon: <HomeOutlined />,
    label: '社区管理',
    roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'COMMITTEE'],
    children: [
      { key: '/community/list', label: '小区列表', roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN'] },
      { key: '/community/buildings', label: '楼栋房产' },
    ],
  },
  {
    key: '/users',
    icon: <TeamOutlined />,
    label: '用户管理',
    roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN'],
  },
  {
    key: 'monitor',
    icon: <MonitorOutlined />,
    label: '监控告警',
    roles: ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'PROPERTY_STAFF'],
    children: [
      { key: '/monitor/status', label: '设备监控' },
      { key: '/monitor/alerts', label: '告警中心' },
    ],
  },
];

const filterMenuByRole = (items: any[], role: string): any[] => {
  return items
    .filter((item) => {
      if (item.roles && !item.roles.includes(role)) return false;
      return true;
    })
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterMenuByRole(item.children, role);
        return { ...item, children: filteredChildren };
      }
      return item;
    });
};

export default function MainLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, switchRole, getUserByRole } = useUserStore();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const role = user?.role || 'SUPER_ADMIN';
  const menuItems = filterMenuByRole(baseMenuItems, role);
  const roleInfo = USER_ROLES[role as keyof typeof USER_ROLES];

  useEffect(() => {
    const path = location.pathname;
    const matched: string[] = [];
    for (const item of baseMenuItems) {
      if (item.children?.some((c: any) => c.key === path)) {
        matched.push(item.key);
      }
    }
    setOpenKeys(matched);
  }, [location.pathname]);

  const handleSwitchRole = (newRole: string) => {
    const targetUser = getUserByRole(newRole);
    if (targetUser) {
      switchRole(newRole, targetUser);
      setRoleModalOpen(false);
      navigate('/dashboard');
    }
  };

  const userMenu = [
    {
      key: 'switch-role',
      icon: <SwapOutlined />,
      label: '切换角色身份',
      onClick: () => setRoleModalOpen(true),
    },
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

  const breadcrumbTitle = (() => {
    const findLabel = (items: any[], path: string): string | null => {
      for (const item of items) {
        if (item.key === path) return item.label;
        if (item.children) {
          const sub = findLabel(item.children, path);
          if (sub) return sub;
        }
      }
      return null;
    };
    return findLabel(baseMenuItems, location.pathname) || '数据概览';
  })();

  const availableRoles = (Object.keys(USER_ROLES) as Array<keyof typeof USER_ROLES>).filter((r) => {
    if (role === 'SUPER_ADMIN') return true;
    return r === role;
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="dark" breakpoint="lg" collapsedWidth="0">
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
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ color: '#0F172A', fontSize: 16, fontWeight: 500 }}>
              {breadcrumbTitle}
            </div>
            <Tag color={roleInfo?.color || 'default'} icon={<SafetyOutlined />} style={{ cursor: 'pointer' }} onClick={() => setRoleModalOpen(true)}>
              {roleInfo?.name}
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Button type="dashed" size="small" icon={<SwapOutlined />} onClick={() => setRoleModalOpen(true)}>
              切换身份
            </Button>
            <Badge count={3} dot>
              <BellOutlined style={{ fontSize: 20, color: '#64748B', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <Avatar size={32} style={{ backgroundColor: roleInfo?.color || '#10B981' }}>
                  {user?.nickname?.charAt(0)}
                </Avatar>
                <span style={{ color: '#334155' }}>{user?.nickname}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        {roleModalOpen && (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setRoleModalOpen(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 28,
                width: 560,
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#0F172A' }}>
                  <SwapOutlined style={{ color: '#10B981', marginRight: 8 }} />
                  切换角色身份
                </div>
                <Button type="text" onClick={() => setRoleModalOpen(false)}>✕</Button>
              </div>
              <div style={{ color: '#64748B', marginBottom: 16, fontSize: 13 }}>
                选择不同角色可体验各业务角色实际操作权限和数据可见范围
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {availableRoles.map((r) => {
                  const info = USER_ROLES[r] as RoleConfig;
                  const isActive = r === role;
                  return (
                    <div
                      key={r}
                      onClick={() => handleSwitchRole(r)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: `2px solid ${isActive ? info.color : '#E2E8F0'}`,
                        background: isActive ? `${info.color}10` : '#F8FAFC',
                        cursor: 'pointer',
                        transition: 'all .2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Avatar size={36} style={{ backgroundColor: info.color }}>{info.name.charAt(0)}</Avatar>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{info.name}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>{info.phone}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{info.desc}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {info.permissions.slice(0, 3).map((p) => (
                          <Tag key={p} color="geekblue" style={{ fontSize: 11, margin: 0 }}>{p}</Tag>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
