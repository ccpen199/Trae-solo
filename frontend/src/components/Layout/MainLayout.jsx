import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Switch, Tooltip, Tag, Divider } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined, IdcardOutlined, FileTextOutlined, AppstoreOutlined,
  FileSearchOutlined, CloudOutlined, UserOutlined, DashboardOutlined,
  LogoutOutlined, BulbOutlined, BulbFilled, TeamOutlined, ToolOutlined,
  SwapOutlined, AlertOutlined, SafetyOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../store/user';

const { Header, Content, Sider } = Layout;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isElderMode, toggleElderMode } = useUserStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  const personalMenu = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/certificates', icon: <IdcardOutlined />, label: '电子证照' },
    { key: '/services', icon: <AppstoreOutlined />, label: '服务大厅' },
    { key: '/guide', icon: <FileSearchOutlined />, label: '智能导办' },
    { key: '/applications', icon: <FileTextOutlined />, label: '我的办件' },
    { key: '/policy', icon: <FileTextOutlined />, label: '政策速递' },
    { key: '/city', icon: <CloudOutlined />, label: '城市服务' },
    { key: '/profile', icon: <UserOutlined />, label: '个人中心' },
  ];

  const legalMenu = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/certificates', icon: <IdcardOutlined />, label: '电子证照' },
    { key: '/services', icon: <AppstoreOutlined />, label: '法人办事' },
    { key: '/guide', icon: <FileSearchOutlined />, label: '智能导办' },
    { key: '/applications', icon: <FileTextOutlined />, label: '我的办件' },
    { key: '/policy', icon: <FileTextOutlined />, label: '政策速递' },
    { key: '/city', icon: <CloudOutlined />, label: '城市服务' },
    { key: '/profile', icon: <TeamOutlined />, label: '法人中心' },
  ];

  const adminMenu = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/certificates', icon: <IdcardOutlined />, label: '电子证照' },
    { key: '/services', icon: <AppstoreOutlined />, label: '服务大厅' },
    { key: '/applications', icon: <FileTextOutlined />, label: '我的办件' },
    { type: 'divider' },
    {
      key: 'admin-group',
      icon: <SafetyOutlined />,
      label: '管理后台',
      children: [
        { key: '/admin', icon: <DashboardOutlined />, label: '管理看板' },
        { key: '/admin/services', icon: <ToolOutlined />, label: '事项配置中心' },
        { key: '/admin/gateway', icon: <SwapOutlined />, label: '跨部门网关' },
        { key: '/admin/audit', icon: <AlertOutlined />, label: '办件质量审计' },
      ]
    },
  ];

  const getMenuItems = () => {
    if (user?.type === 'admin') return adminMenu;
    if (user?.type === 'legal') return legalMenu;
    return personalMenu;
  };

  const getRoleTag = () => {
    if (user?.type === 'admin') return <Tag color="red">管理员</Tag>;
    if (user?.type === 'legal') return <Tag color="orange">法人用户</Tag>;
    return <Tag color="blue">个人用户</Tag>;
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
  ];

  if (!user) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>正在跳转至登录页...</div>;
  }

  const selectedKey = location.pathname;
  const openKeys = selectedKey.startsWith('/admin') ? ['admin-group'] : [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#1890ff', padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'white', fontSize: isElderMode ? '22px' : '18px', fontWeight: 'bold' }}>
            省级一体化移动政务服务平台
          </span>
          {getRoleTag()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Tooltip title={isElderMode ? '关闭适老模式' : '开启适老模式'}>
            <Switch
              checkedChildren={<BulbFilled />}
              unCheckedChildren={<BulbOutlined />}
              checked={isElderMode}
              onChange={toggleElderMode}
            />
            <span style={{ color: 'white', marginLeft: '8px' }}>
              {isElderMode ? '适老版' : '标准版'}
            </span>
          </Tooltip>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ color: 'white', marginLeft: '8px' }}>{user.name}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={isElderMode ? 240 : 200}
          style={{ background: '#fff', overflowY: 'auto' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={openKeys}
            items={getMenuItems()}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{
            padding: '24px', margin: 0, minHeight: 280,
            background: '#fff', borderRadius: '8px', overflow: 'auto'
          }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
