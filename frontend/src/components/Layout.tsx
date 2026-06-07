import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Tag, Button } from 'antd';
import {
  HomeOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DashboardOutlined,
  SettingOutlined,
  BarChartOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth';

const { Header, Content, Footer } = Layout;

const roleLabelMap: Record<string, { label: string; color: string }> = {
  jobseeker: { label: '求职者', color: 'blue' },
  hr: { label: '企业HR', color: 'green' },
  admin: { label: '管理员', color: 'red' },
};

const roleDashboardMap: Record<string, string> = {
  jobseeker: '/jobseeker/profile',
  hr: '/hr/dashboard',
  admin: '/admin/dashboard',
};

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [
      { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
      { key: '/jobs', icon: <SearchOutlined />, label: <Link to="/jobs">找工作</Link> },
    ];

    if (user?.role === 'jobseeker') {
      items.push(
        { key: '/jobseeker/profile', icon: <UserOutlined />, label: <Link to="/jobseeker/profile">我的简历</Link> },
        { key: '/jobseeker/applications', icon: <FileTextOutlined />, label: <Link to="/jobseeker/applications">我的申请</Link> },
        { key: '/jobseeker/interviews', icon: <CalendarOutlined />, label: <Link to="/jobseeker/interviews">面试安排</Link> }
      );
    } else if (user?.role === 'hr') {
      items.push(
        { key: '/hr/dashboard', icon: <DashboardOutlined />, label: <Link to="/hr/dashboard">HR工作台</Link> },
        { key: '/hr/jobs', icon: <FileTextOutlined />, label: <Link to="/hr/jobs">职位管理</Link> },
        { key: '/hr/applications', icon: <UserOutlined />, label: <Link to="/hr/applications">简历管理</Link> },
        { key: '/hr/interviews', icon: <CalendarOutlined />, label: <Link to="/hr/interviews">面试管理</Link> }
      );
    } else if (user?.role === 'admin') {
      items.push(
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">管理后台</Link> },
        { key: '/admin/risk-control', icon: <SettingOutlined />, label: <Link to="/admin/risk-control">风控中心</Link> },
        { key: '/admin/analytics', icon: <BarChartOutlined />, label: <Link to="/admin/analytics">数据看板</Link> }
      );
    }

    return items;
  };

  const getUserDropdownItems = () => {
    if (!user) return [];

    const items: any[] = [];

    const dashboard = roleDashboardMap[user.role];
    if (dashboard) {
      items.push({
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: '我的主页',
        onClick: () => navigate(dashboard),
      });
    }

    items.push({
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人资料',
      onClick: () => navigate(dashboard || '/'),
    });

    items.push({ type: 'divider' });

    items.push({
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    });

    return items;
  };

  const roleInfo = user ? roleLabelMap[user.role] : null;

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff', marginRight: '40px' }}>
          智聘平台
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          style={{ flex: 1, borderBottom: 'none' }}
        />
        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <Dropdown menu={{ items: getUserDropdownItems() }}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <span style={{ fontSize: 14, color: '#333' }}>{user.name}</span>
                {roleInfo && <Tag color={roleInfo.color} style={{ marginLeft: 0 }}>{roleInfo.label}</Tag>}
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
          )}
        </div>
      </Header>
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 134px)' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        智聘平台 ©2024 泛蓝领与白领融合招聘服务平台
      </Footer>
    </Layout>
  );
}
