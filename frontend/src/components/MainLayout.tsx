import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  BookOutlined,
  MessageOutlined,
  SafetyOutlined,
  SettingOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  UserAddOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <HomeOutlined />, label: '工作台总览' },
  {
    key: 'workers-group',
    icon: <TeamOutlined />,
    label: '阿姨管理',
    children: [
      { key: '/workers', icon: <TeamOutlined />, label: '阿姨列表' },
      { key: '/admin/approval', icon: <UserAddOutlined />, label: '资质审核' },
      { key: '/admin/performance', icon: <BarChartOutlined />, label: '业绩报表' },
    ],
  },
  { key: '/employers', icon: <UserOutlined />, label: '雇主管理' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
  { key: '/training', icon: <BookOutlined />, label: '岗前培训' },
  { key: '/community', icon: <MessageOutlined />, label: '圈子社区' },
  {
    key: 'support-group',
    icon: <SafetyOutlined />,
    label: '保障中心',
    children: [
      { key: '/support/insurance', icon: <SafetyOutlined />, label: '意外险保单' },
      { key: '/support/disputes', icon: <FileTextOutlined />, label: '纠纷仲裁' },
      { key: '/support/salaries', icon: <ApartmentOutlined />, label: '薪资代发' },
    ],
  },
  {
    key: 'admin-group',
    icon: <SettingOutlined />,
    label: '机构管理',
    children: [
      { key: '/admin/service-grids', icon: <ApartmentOutlined />, label: '服务网格' },
      { key: '/admin/funnel', icon: <BarChartOutlined />, label: '转化漏斗' },
    ],
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const roleMap: Record<string, string> = {
    admin: '管理员',
    worker: '阿姨',
    employer: '雇主',
    expert: '专家',
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: '1', icon: <UserOutlined />, label: `${roleMap[user?.role] || '用户'}：${user?.username || ''}` },
      { key: '2', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  };

  const findOpenKeys = () => {
    for (const item of menuItems) {
      if ((item as any).children) {
        for (const child of (item as any).children) {
          if (location.pathname.startsWith(child.key)) {
            return [(item as any).key];
          }
        }
      }
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={230}>
        <div className="logo">
          <span className="logo-icon">🏠</span>
          {!collapsed && <span>家政工作台</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={findOpenKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key as string)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 64, height: 64 }}
            />
          </div>
          <div className="header-right">
            <Dropdown menu={userMenu} placement="bottomRight">
              <div className="user-info">
                <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
                <span style={{ fontSize: 14 }}>{user?.username}</span>
                <span style={{ color: '#999', fontSize: 12 }}>{roleMap[user?.role]}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '0', background: '#f0f2f5' }}>
          <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
