import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Space, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  SettingOutlined,
  AuditOutlined,
  TeamOutlined,
  LogoutOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../store/authStore';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const jobseekerMenu = [
    { key: '/', icon: <HomeOutlined />, label: '职位大厅' },
    { key: '/seeker/profile', icon: <UserOutlined />, label: '我的资料' },
    { key: '/seeker/resume', icon: <FileTextOutlined />, label: '三维简历' },
    { key: '/seeker/certificates', icon: <TrophyOutlined />, label: '技能证书' },
    { key: '/seeker/applications', icon: <SearchOutlined />, label: '投递记录' },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  ];

  const enterpriseMenu = [
    { key: '/', icon: <HomeOutlined />, label: '职位大厅' },
    { key: '/enterprise/dashboard', icon: <DashboardOutlined />, label: '企业看板' },
    { key: '/enterprise/jobs', icon: <AppstoreOutlined />, label: '职位管理' },
    { key: '/enterprise/applications', icon: <FileSearchOutlined />, label: '简历初筛' },
    { key: '/enterprise/interviews', icon: <CalendarOutlined />, label: '面试安排' },
    { key: '/enterprise/templates', icon: <FileTextOutlined />, label: 'JD模板库' },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '行业数据' },
  ];

  const adminMenu = [
    { key: '/', icon: <HomeOutlined />, label: '职位大厅' },
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '管理概览' },
    { key: '/admin/enterprises', icon: <TeamOutlined />, label: '企业资质审核' },
    { key: '/admin/audit-logs', icon: <AuditOutlined />, label: '操作审计日志' },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '行业数据' },
  ];

  const getMenuItems = () => {
    if (!user) return jobseekerMenu.slice(0, 2);
    switch (user.role) {
      case 'jobseeker': return jobseekerMenu;
      case 'hr': return enterpriseMenu;
      case 'admin': return adminMenu;
      default: return jobseekerMenu.slice(0, 2);
    }
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
    ],
  };

  const getWelcomeText = () => {
    if (!user) return '欢迎访问制造业招聘平台';
    if (user.role === 'jobseeker') return `欢迎回来，${profile?.name || user.username}`;
    if (user.role === 'hr') return `欢迎回来，${profile?.enterprise_name || user.username}`;
    if (user.role === 'admin') return `管理员：${user.username}`;
    return '';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: '#001529' }}
        width={240}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? 0 : 20,
          color: '#fff',
          fontSize: collapsed ? 20 : 18,
          fontWeight: 600,
          background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
        }}>
          {collapsed ? '制造' : '制造业招聘SaaS'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 16, color: '#595959' }}>
              {getWelcomeText()}
            </div>
            {user?.role === 'hr' && (
              <Space size={4}>
                <Button type="text" size="small" icon={<FileSearchOutlined />} onClick={() => navigate('/enterprise/applications')}>
                  ATS初筛
                </Button>
                <Button type="text" size="small" icon={<CalendarOutlined />} onClick={() => navigate('/enterprise/interviews')}>
                  面试日历
                </Button>
                <Button type="text" size="small" icon={<AppstoreOutlined />} onClick={() => navigate('/enterprise/jobs')}>
                  职位管理
                </Button>
              </Space>
            )}
            {user?.role === 'admin' && (
              <Space size={4}>
                <Button type="text" size="small" icon={<TeamOutlined />} onClick={() => navigate('/admin/enterprises')}>
                  资质审核
                </Button>
                <Button type="text" size="small" icon={<AuditOutlined />} onClick={() => navigate('/admin/audit-logs')}>
                  操作审计
                </Button>
                <Button type="text" size="small" icon={<DashboardOutlined />} onClick={() => navigate('/admin/dashboard')}>
                  管理概览
                </Button>
              </Space>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <Dropdown menu={userMenu} placement="bottomRight">
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                  <span>{user.username}</span>
                  <span className={`qualification-status ${profile?.qualification_status || ''}`} style={{ marginLeft: 8 }}>
                    {user.role === 'jobseeker' ? '求职者' :
                     user.role === 'hr' ? (profile?.qualification_status === 'approved' ? '已认证' : '待审核') :
                     '管理员'}
                  </span>
                </div>
              </Dropdown>
            )}
            {!user && (
              <>
                <a onClick={() => navigate('/login')}>登录</a>
                <a onClick={() => navigate('/register')}>注册</a>
              </>
            )}
          </div>
        </Header>
        <Content style={{
          margin: '0',
          padding: '0',
          minHeight: 'calc(100vh - 64px)',
          background: '#f0f2f5',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
