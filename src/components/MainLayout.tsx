import { ReactNode, useState, useMemo } from 'react';
import { Layout, Menu, Segmented, Avatar, Dropdown, Badge, Tag, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  LayoutDashboard,
  ShieldCheck,
  Shield,
  Calculator,
  ArrowLeftRight,
  IdCard,
  Network,
  Headphones,
  DollarSign,
  Settings,
  FileText,
  Monitor,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Building2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { CITY_NAMES, CITIES, CityCode, UserRole } from 'shared/types';

const { Sider, Header, Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

const ROLE_LABELS: Record<UserRole, { text: string; color: string }> = {
  PERSONAL: { text: '个人用户', color: 'blue' },
  ENTERPRISE_HR: { text: '企业HR', color: 'purple' },
  FINANCE: { text: '财务人员', color: 'orange' },
  CS_AGENT: { text: '客服坐席', color: 'cyan' },
  ADMIN: { text: '系统管理员', color: 'red' },
};

function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentCity, switchCity, logout } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = useMemo<MenuProps['items']>(() => {
    const role = user?.role || 'PERSONAL';
    const isAdmin = role === 'ADMIN';
    const isFinance = role === 'FINANCE' || isAdmin;
    const isHR = role === 'ENTERPRISE_HR' || isFinance || isAdmin;
    const isCS = role === 'CS_AGENT' || isAdmin;

    const baseItems: MenuProps['items'] = [
      {
        key: '/dashboard',
        icon: <LayoutDashboard size={18} />,
        label: '工作台',
      },
      {
        key: '/auth',
        icon: <ShieldCheck size={18} />,
        label: '认证中心',
      },
    ];

    if (isHR || role === 'PERSONAL') {
      baseItems.push({
        key: '/insurance',
        icon: <Shield size={18} />,
        label: '参保方案',
      });
    }

    baseItems.push({
      key: '/calculator',
      icon: <Calculator size={18} />,
      label: '社保计算器',
    });

    if (isHR || role === 'PERSONAL') {
      baseItems.push({
        key: '/transaction',
        icon: <ArrowLeftRight size={18} />,
        label: '业务办理',
      });
    }

    baseItems.push({
      key: '/certificates',
      icon: <IdCard size={18} />,
      label: '凭证中心',
    });

    baseItems.push({
      key: '/policy',
      icon: <Network size={18} />,
      label: '政策图谱',
    });

    if (isCS || isHR || isAdmin) {
      baseItems.push({
        key: '/support',
        icon: <Headphones size={18} />,
        label: '客服中心',
      });
    }

    if (isFinance) {
      baseItems.push({
        key: '/finance',
        icon: <DollarSign size={18} />,
        label: '财务控制台',
      });
    }

    if (isAdmin) {
      baseItems.push({
        key: '/admin',
        icon: <Settings size={18} />,
        label: '系统管理',
        children: [
          {
            key: '/admin/dashboard',
            icon: <LayoutDashboard size={16} />,
            label: '管理概览',
          },
          {
            key: '/admin/policy',
            icon: <FileText size={16} />,
            label: '政策管理',
          },
          {
            key: '/admin/monitor',
            icon: <Monitor size={16} />,
            label: '系统监控',
          },
          {
            key: '/admin/audit',
            icon: <ClipboardList size={16} />,
            label: '审计日志',
          },
        ],
      });
    }

    return baseItems;
  }, [user?.role]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const getSelectedKeys = (): string[] => {
    const pathname = location.pathname;
    if (pathname.startsWith('/admin')) {
      return [pathname];
    }
    return [pathname];
  };

  const getOpenKeys = (): string[] => {
    if (location.pathname.startsWith('/admin')) {
      return ['/admin'];
    }
    return [];
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User size={16} />,
      label: '个人中心',
      onClick: () => navigate('/auth'),
    },
    {
      key: 'auth-center',
      icon: <ShieldCheck size={16} />,
      label: '认证中心',
      onClick: () => navigate('/auth'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const displayName = user?.nickname || (user?.phone ? maskPhone(user.phone) : '未登录');
  const roleInfo = user?.role ? ROLE_LABELS[user.role] : null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 700,
            fontFamily: '"Noto Serif SC", serif',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            gap: 8,
            padding: '0 16px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <Building2 size={collapsed ? 20 : 24} strokeWidth={2.5} />
          {!collapsed && <span>社保通</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            background: 'transparent',
            marginTop: 8,
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            height: 64,
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#0F172A',
                fontFamily: '"Noto Serif SC", serif',
              }}
            >
              政务社保公积金代缴服务平台
            </div>
            <Segmented
              value={currentCity}
              onChange={(value) => switchCity(value as CityCode)}
              options={CITIES.map((city) => ({
                label: CITY_NAMES[city],
                value: city,
              }))}
              size="middle"
              style={{
                background: '#F1F5F9',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small" offset={[-2, 2]}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: '#F1F5F9',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#DBEAFE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                }}
              >
                <Bell size={18} color="#1E40AF" />
              </div>
            </Badge>
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '4px 12px 4px 4px',
                  borderRadius: 24,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Avatar
                  size={36}
                  style={{
                    background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                    fontWeight: 600,
                  }}
                  icon={<User size={18} />}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                    {displayName}
                  </span>
                  {roleInfo && (
                    <Tag
                      color={roleInfo.color}
                      style={{
                        margin: 0,
                        fontSize: 11,
                        lineHeight: '16px',
                        padding: '0 6px',
                      }}
                    >
                      {roleInfo.text}
                    </Tag>
                  )}
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            background: '#F1F5F9',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
