import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Tabs, Avatar, Dropdown, Button, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileSearchOutlined,
  ApiOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  FormatPainterOutlined,
  DollarOutlined,
  SendOutlined,
  AuditOutlined,
  AlertOutlined,
  MonitorOutlined,
  WarningOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  BranchesOutlined,
  BookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider, Header, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '系统首页' },
  {
    key: '/auth', icon: <UserOutlined />, label: '认证管理',
    children: [
      { key: '/auth/user', icon: <UserOutlined />, label: '用户管理' },
      { key: '/auth/role', icon: <TeamOutlined />, label: '角色管理' },
      { key: '/auth/audit', icon: <FileSearchOutlined />, label: '审计日志' },
    ],
  },
  {
    key: '/data', icon: <ApiOutlined />, label: '数据共享',
    children: [
      { key: '/data/api', icon: <ApiOutlined />, label: 'API管理' },
      { key: '/data/permission', icon: <LockOutlined />, label: '数据权限' },
      { key: '/data/desensitize', icon: <SafetyCertificateOutlined />, label: '脱敏规则' },
    ],
  },
  {
    key: '/certificate', icon: <IdcardOutlined />, label: '证照管理',
    children: [
      { key: '/certificate/manage', icon: <IdcardOutlined />, label: '证照管理' },
      { key: '/certificate/template', icon: <FormatPainterOutlined />, label: '模板管理' },
    ],
  },
  {
    key: '/subsidy', icon: <DollarOutlined />, label: '补贴监管',
    children: [
      { key: '/subsidy/policy', icon: <DollarOutlined />, label: '政策管理' },
      { key: '/subsidy/grant', icon: <SendOutlined />, label: '发放管理' },
      { key: '/subsidy/fund', icon: <AuditOutlined />, label: '资金追踪' },
      { key: '/subsidy/risk', icon: <AlertOutlined />, label: '风险预警' },
    ],
  },
  {
    key: '/monitor', icon: <MonitorOutlined />, label: '服务监控',
    children: [
      { key: '/monitor/service', icon: <MonitorOutlined />, label: '服务监控' },
      { key: '/monitor/alert', icon: <WarningOutlined />, label: '告警管理' },
      { key: '/monitor/sla', icon: <SafetyOutlined />, label: 'SLA管理' },
    ],
  },
  {
    key: '/ticket', icon: <CustomerServiceOutlined />, label: '诉求管理',
    children: [
      { key: '/ticket/manage', icon: <CustomerServiceOutlined />, label: '工单管理' },
      { key: '/ticket/dispatch', icon: <BranchesOutlined />, label: '分拨规则' },
      { key: '/ticket/knowledge', icon: <BookOutlined />, label: '知识库' },
    ],
  },
];

const menuLabelMap: Record<string, string> = {
  '/dashboard': '系统首页',
  '/auth/user': '用户管理',
  '/auth/role': '角色管理',
  '/auth/audit': '审计日志',
  '/data/api': 'API管理',
  '/data/permission': '数据权限',
  '/data/desensitize': '脱敏规则',
  '/certificate/manage': '证照管理',
  '/certificate/template': '模板管理',
  '/subsidy/policy': '政策管理',
  '/subsidy/grant': '发放管理',
  '/subsidy/fund': '资金追踪',
  '/subsidy/risk': '风险预警',
  '/monitor/service': '服务监控',
  '/monitor/alert': '告警管理',
  '/monitor/sla': 'SLA管理',
  '/ticket/manage': '工单管理',
  '/ticket/dispatch': '分拨规则',
  '/ticket/knowledge': '知识库',
};

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTabs, setActiveTabs] = useState<{ key: string; label: string }[]>([
    { key: '/dashboard', label: '系统首页' },
  ]);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    if (!activeTabs.find((t) => t.key === key)) {
      setActiveTabs([...activeTabs, { key, label: menuLabelMap[key] || key }]);
    }
  };

  const handleTabChange = (key: string) => {
    navigate(key);
  };

  const handleTabEdit = (targetKey: string | number, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const targetKeyStr = String(targetKey);
      const idx = activeTabs.findIndex((t) => t.key === targetKeyStr);
      if (idx === -1) return;
      const newTabs = activeTabs.filter((t) => t.key !== targetKeyStr);
      if (location.pathname === targetKeyStr && newTabs.length > 0) {
        const nextTab = newTabs[Math.min(idx, newTabs.length - 1)];
        navigate(nextTab.key);
      }
      setActiveTabs(newTabs);
    }
  };

  const openKeys = (() => {
    const path = location.pathname;
    const parent = path.split('/').slice(0, 2).join('/');
    return parent !== '/dashboard' ? [parent] : [];
  })();

  const userMenuItems: MenuProps['items'] = [
    { key: 'setting', icon: <SettingOutlined />, label: '个人设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  return (
    <Layout className="admin-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} width={220} theme="dark">
        <div className="admin-sidebar">
          <div className="sidebar-logo">
            <span className="logo-icon">◈</span>
            {!collapsed && <span>数字服务融合平台</span>}
          </div>
          <div className="sidebar-menu-wrapper">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              defaultOpenKeys={openKeys}
              items={menuItems}
              onClick={handleMenuClick}
            />
          </div>
        </div>
      </Sider>
      <Layout>
        <Header className="admin-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <span style={{ fontSize: 15, color: themeToken.colorTextSecondary }}>
              贵州省全域数字服务融合平台
            </span>
          </div>
          <div className="header-right">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>管理员</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <div className="admin-tabs">
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={location.pathname}
            onChange={handleTabChange}
            onEdit={handleTabEdit}
            items={activeTabs.map((t) => ({
              key: t.key,
              label: t.label,
              closable: t.key !== '/dashboard',
            }))}
            size="small"
          />
        </div>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
