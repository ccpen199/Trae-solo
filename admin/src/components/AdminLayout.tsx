import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, FormOutlined, AuditOutlined, FileDoneOutlined,
  SettingOutlined, FileTextOutlined, AppstoreOutlined,
  LogoutOutlined, UserOutlined, DatabaseOutlined, SafetyOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAdminStore(s => s.user);
  const logout = useAdminStore(s => s.logout);
  const [collapsed, setCollapsed] = useState(false);

  const items: MenuProps['items'] = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '审批总览看板' },
    { key: '/assign', icon: <AuditOutlined />, label: '审核事项指派' },
    { key: '/review', icon: <FormOutlined />, label: '分级审核台' },
    { key: '/items', icon: <AppstoreOutlined />, label: '登记事项配置' },
    { key: '/templates', icon: <FileTextOutlined />, label: '表单动态配置' },
    { key: '/tracking', icon: <FileDoneOutlined />, label: '全流程追踪' },
    { key: '/evidence', icon: <SafetyOutlined />, label: '证据包/档案' },
    { key: '/audit', icon: <AuditOutlined />, label: '🧾 审计存证' },
    { key: '/archive-verify', icon: <DatabaseOutlined />, label: '📦 档案核验' },
    { key: '/system', icon: <SettingOutlined />, label: '系统管理' },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: `${user?.name || ''}（${user?.role === 'admin' ? '系统管理员' : '审核员'}）` },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '安全退出', onClick: () => { logout(); navigate('/login'); } }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}
        trigger={null} width={240}
        style={{ background: '#001529' }}>
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', gap: 10,
          padding: '0 16px'
        }}>
          <DatabaseOutlined style={{ fontSize: 24, color: '#40a9ff' }} />
          {!collapsed && <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>
            省局电子政务平台
          </span>}
        </div>
        <Menu
          theme="dark" mode="inline"
          selectedKeys={[location.pathname]}
          style={{ borderRight: 0, padding: '12px 8px' }}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              aria-label={collapsed ? '展开' : '收起'}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '展开' : '收起'}
            </Button>
            <Text strong style={{ fontSize: 16 }}>后台管理系统</Text>
            <Tag color="blue" style={{ fontSize: 11 }}>国密合规</Tag>
            <Tag color="green" style={{ fontSize: 11 }}>TSA对接</Tag>
            <Tag color="orange" style={{ fontSize: 11 }}>政务云</Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </Text>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1E5DAB', fontWeight: 600 }}
                  icon={<UserOutlined />} size="default">
                  {user?.name?.slice(0, 1)}
                </Avatar>
                <span style={{ fontSize: 13 }}>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: 12 }}>
          省级市场监督管理局 · 电子签名政务平台 v1.0 &nbsp;|&nbsp;
          符合《电子签名法》《密码法》&nbsp;|&nbsp;
          服务端：SM2/SM3/SM4 &nbsp;|&nbsp;
          © 2024 政务云 · 全部操作受审计
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
