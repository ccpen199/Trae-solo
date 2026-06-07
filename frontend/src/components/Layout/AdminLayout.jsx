import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { DashboardOutlined, CalendarOutlined, BarChartOutlined, TeamOutlined, FileTextOutlined, BookOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function AdminLayout({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
    { key: '/admin/events', icon: <CalendarOutlined />, label: '活动管理' },
    { key: '/admin/sales', icon: <BarChartOutlined />, label: '销售统计' },
    { key: '/admin/agents', icon: <TeamOutlined />, label: '代理管理' },
    { key: '/admin/settlements', icon: <FileTextOutlined />, label: '分账清算' },
    { key: '/admin/content', icon: <BookOutlined />, label: '内容管理' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const userMenu = {
    items: [
      { key: 'home', icon: <HomeOutlined />, label: '返回前台' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        handleLogout();
      } else if (key === 'home') {
        navigate('/');
      }
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>🎫 票务中台管理系统</h2>
        <Dropdown menu={userMenu} placement="bottomRight">
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar size="small" src="https://api.dicebear.com/7.x/miniavs/svg?seed=admin" />
            <span>{user?.username || '管理员'}</span>
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Layout style={{ padding: '24px', background: '#f5f5f5' }}>
          <Content style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
