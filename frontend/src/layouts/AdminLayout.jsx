import React, { useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, theme } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  DashboardOutlined,
  ProductOutlined,
  FileTextOutlined,
  MessageOutlined,
  BriefcaseOutlined,
  FileDoneOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import useUserStore from '../store/userStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/admin/dashboard',
    icon: <DashboardOutlined />,
    label: '控制台',
  },
  {
    key: '/admin/products',
    icon: <ProductOutlined />,
    label: '产品管理',
  },
  {
    key: '/admin/news',
    icon: <FileTextOutlined />,
    label: '新闻管理',
  },
  {
    key: '/admin/messages',
    icon: <MessageOutlined />,
    label: '留言管理',
  },
  {
    key: '/admin/jobs',
    icon: <BriefcaseOutlined />,
    label: '职位管理',
  },
  {
    key: '/admin/resumes',
    icon: <FileDoneOutlined />,
    label: '简历管理',
  },
  {
    key: '/admin/members',
    icon: <TeamOutlined />,
    label: '会员管理',
  },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoggedIn } = useUserStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/admin/login');
    }
  }, [isLoggedIn, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人中心
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        系统设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid #333'
        }}>
          企业网站后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/" target="_blank">
              <Button type="link">查看前台</Button>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ marginLeft: 8 }}>{user?.realName || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: colorBgContainer, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
