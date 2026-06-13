import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Menu, theme, Avatar, Dropdown, Badge, Button, Tooltip, App, Tag, Space,
} from 'antd';
import {
  DashboardOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  AlertOutlined,
  CloudUploadOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  BulbFilled,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SettingOutlined,
  ApiOutlined,
  MonitorOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { monitoringAPI } from '../services/api';

const { Header, Sider, Content } = Layout;

type UserRoleType = 'user' | 'admin' | 'super_admin';

const ROLE_META: Record<UserRoleType, { label: string; color: string; icon: React.ReactNode }> = {
  user: { label: '普通用户', color: 'blue', icon: <TeamOutlined /> },
  admin: { label: '厂商接入方', color: 'geekblue', icon: <SafetyCertificateOutlined /> },
  super_admin: { label: '平台超级管理员', color: 'magenta', icon: <CrownOutlined /> },
};

const ROLE_PERMISSIONS: Record<UserRoleType, string[]> = {
  user: ['dashboard', 'devices', 'scenes', 'voice', 'alerts', 'ota', 'share', 'analytics', 'learning', 'homes'],
  admin: ['dashboard', 'devices', 'scenes', 'voice', 'alerts', 'ota', 'share', 'analytics', 'learning', 'homes', 'admin_vendors'],
  super_admin: ['dashboard', 'devices', 'scenes', 'voice', 'alerts', 'ota', 'share', 'analytics', 'learning', 'homes', 'admin_dashboard', 'admin_vendors'],
};

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const { user, logout } = useAuthStore();
  const { collapsed, toggleCollapsed, addNotification } = useAppStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [alertCount, setAlertCount] = useState(0);
  const role = (user?.role || 'user') as UserRoleType;
  const roleMeta = ROLE_META[role];
  const allowedPerms = ROLE_PERMISSIONS[role];

  useEffect(() => {
    fetchOpenAlerts();
    const interval = setInterval(fetchOpenAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchOpenAlerts = async () => {
    try {
      const result = await monitoringAPI.getAlerts({ status: 'open', pageSize: 1 });
      if (result && typeof result === 'object' && 'total' in result) {
        const newCount = result.total as number;
        if (newCount > alertCount && alertCount > 0) {
          addNotification({
            id: String(Date.now()),
            type: 'warning',
            title: `新增告警 (${newCount - alertCount})`,
            message: '点击查看最新告警信息',
            timestamp: new Date().toISOString(),
          });
        }
        setAlertCount(newCount);
      }
    } catch {}
  };

  const allMenuItems = useMemo(() => [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台', perm: 'dashboard', tip: '设备总览、快捷操作、能耗统计' },
    { key: '/devices', icon: <BulbOutlined />, label: '设备管理', perm: 'devices', tip: '多品牌设备统一管控、抽象属性配置、状态监控' },
    { key: '/scenes', icon: <ThunderboltOutlined />, label: '智能场景', perm: 'scenes', tip: 'IF-THEN 规则编排、时间/传感器触发、组合动作' },
    { key: '/voice', icon: <MessageOutlined />, label: '语音控制', perm: 'voice', tip: '对接天猫精灵/小爱同学、语义解析、指令下发' },
    { key: '/alerts', icon: <AlertOutlined />, label: '告警中心', perm: 'alerts', tip: '设备离线、异常功耗、低电量等告警推送与处理', badge: alertCount > 0 ? alertCount : undefined },
    { key: '/ota', icon: <CloudUploadOutlined />, label: '固件升级', perm: 'ota', tip: '固件版本管理、OTA 批量升级、灰度发布' },
    { key: '/share', icon: <ShareAltOutlined />, label: '设备分享', perm: 'share', tip: '细粒度权限：仅查看/可操作/可分享' },
    { key: '/analytics', icon: <BarChartOutlined />, label: '数据分析', perm: 'analytics', tip: '在线率、能耗、使用习惯多维度分析' },
    { key: '/learning', icon: <BulbFilled />, label: 'AI 学习', perm: 'learning', tip: '用户习惯学习、场景执行时段智能优化' },
    { key: '/homes', icon: <HomeOutlined />, label: '家庭管理', perm: 'homes', tip: '家庭空间、房间、成员权限管理' },
    {
      key: 'admin',
      icon: <MonitorOutlined />,
      label: '平台管理',
      perm: 'admin_any',
      tip: role === 'super_admin' ? '全局平台管控能力' : '厂商接入与设备管理',
      children: [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '平台仪表盘', perm: 'admin_dashboard', tip: '全平台数据总览（仅超级管理员）' },
        { key: '/admin/vendors', icon: <ApiOutlined />, label: '厂商管理', perm: 'admin_vendors', tip: '厂商白名单、API Key、接入审核' },
      ],
    },
  ], [alertCount, role]);

  const filterMenuItems = (items: any[]): any[] => {
    return items
      .filter((item) => {
        if (item.perm === 'admin_any') {
          return item.children && item.children.some((c: any) => allowedPerms.includes(c.perm));
        }
        return allowedPerms.includes(item.perm);
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: filterMenuItems(item.children),
          };
        }
        return item;
      });
  };

  const menuItems = useMemo(() => filterMenuItems(allMenuItems), [allMenuItems, allowedPerms]);

  const userMenuItems = [
    {
      key: 'role-info',
      disabled: true,
      label: (
        <Space direction="vertical" size={2} style={{ padding: '4px 8px' }}>
          <Space>
            <Tag color={roleMeta.color} icon={roleMeta.icon} style={{ margin: 0 }}>{roleMeta.label}</Tag>
          </Space>
          <div style={{ fontSize: 11, color: '#888' }}>
            权限: {allowedPerms.length} 项功能模块
          </div>
        </Space>
      ),
    },
    { type: 'divider' as const },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料与权限',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '偏好设置',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: async () => {
        try {
          await logout();
          message.success(`已退出登录（${roleMeta.label}：${user?.username}）`);
          navigate('/login');
        } catch {
          navigate('/login');
        }
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return [path];
    if (path.startsWith('/devices/')) return ['/devices'];
    if (path.startsWith('/scenes/')) return ['/scenes'];
    return [path];
  };

  const getOpenKeys = () => {
    if (location.pathname.startsWith('/admin')) return ['admin'];
    return [];
  };

  const getCurrentPageTip = () => {
    const findTip = (items: any[]): string | undefined => {
      for (const item of items) {
        if (item.key === location.pathname) return item.tip;
        if (item.children) {
          const found = findTip(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    if (location.pathname.startsWith('/devices/')) return '设备详情页：查看状态、远程控制、分享管理、OTA升级';
    if (location.pathname.startsWith('/scenes/builder')) return '可视化场景编排：拖拽创建 IF-THEN 规则、触发条件、设备动作';
    if (location.pathname.startsWith('/scenes/')) return '场景编辑：修改触发规则、动作组合、执行时间';
    return findTip(allMenuItems);
  };

  const getCurrentPageLabel = () => {
    const findLabel = (items: any[]): string | undefined => {
      for (const item of items) {
        if (item.key === location.pathname) return item.label;
        if (item.children) {
          const found = findLabel(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    if (location.pathname.startsWith('/devices/')) return '设备详情';
    if (location.pathname.startsWith('/scenes/builder')) return '场景编排';
    if (location.pathname.startsWith('/scenes/')) return '场景编辑';
    return findLabel(allMenuItems);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={232}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0 8px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            fontSize: collapsed ? 20 : 20,
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
            <RocketOutlined style={{ color: '#1677ff', fontSize: collapsed ? 22 : 24 }} />
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.5 }}>IoT 管控平台</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  Cross-Brand Unified Platform
                </span>
              </div>
            )}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, paddingTop: 8 }}
        />
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Tag
                color={roleMeta.color}
                icon={roleMeta.icon}
                style={{ margin: 0, fontSize: 11, width: '100%', textAlign: 'center' }}
              >
                当前角色：{roleMeta.label}
              </Tag>
              <div style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}>
                可用模块: {allowedPerms.length} 项<br />
                <span style={{ opacity: 0.6 }}>跨品牌设备 {role === 'super_admin' ? '全局' : role === 'admin' ? '厂商' : '个人'} 管理</span>
              </div>
            </Space>
          </div>
        )}
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 20px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#222', display: 'flex', alignItems: 'center', gap: 8 }}>
                {getCurrentPageLabel() || '工作台'}
                {role === 'super_admin' && (
                  <Tag color="magenta" icon={<CrownOutlined />} style={{ fontSize: 11, padding: '0 6px' }}>
                    超级管理员
                  </Tag>
                )}
                {role === 'admin' && (
                  <Tag color="geekblue" icon={<SafetyCertificateOutlined />} style={{ fontSize: 11, padding: '0 6px' }}>
                    厂商权限
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {getCurrentPageTip() || '欢迎使用 IoT 跨品牌统一管控平台'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Space>
              <Tag color="purple" style={{ fontSize: 11, padding: '2px 10px', margin: 0 }}>
                <LockOutlined style={{ fontSize: 11, marginRight: 4 }} />
                厂商白名单模式
              </Tag>
              <Tag color="cyan" style={{ fontSize: 11, padding: '2px 10px', margin: 0 }}>
                MQTT / HTTP 接入
              </Tag>
            </Space>
            <Tooltip title="告警中心">
              <Badge count={alertCount} size="small" offset={[0, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={() => navigate('/alerts')}
                  style={{ width: 40, height: 40 }}
                />
              </Badge>
            </Tooltip>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 10,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f7fa')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar
                  size={34}
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  style={{
                    border: `2px solid ${role === 'super_admin' ? '#eb2f96' : role === 'admin' ? '#1677ff' : '#52c41a'}`,
                  }}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{user?.username}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                    <Tag
                      color={roleMeta.color}
                      icon={roleMeta.icon}
                      style={{ margin: 0, fontSize: 10, padding: '0 6px', height: 16, lineHeight: '14px' }}
                    >
                      {roleMeta.label}
                    </Tag>
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 64px - 32px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
