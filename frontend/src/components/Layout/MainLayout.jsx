import { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  InsuranceOutlined,
  SolutionOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const { Header, Sider, Content, Footer } = Layout;

const menuConfig = {
  personal: [
    { key: '/dashboard', icon: <HomeOutlined />, label: '首页' },
    { key: '/insurance', icon: <InsuranceOutlined />, label: '社保服务' },
    {
      key: '/employment',
      icon: <SolutionOutlined />,
      label: '就业服务',
      children: [
        { key: '/employment/jobs', label: '岗位招聘' },
        { key: '/employment/resume', label: '简历管理' },
        { key: '/employment/applications', label: '投递记录' },
        { key: '/employment/fairs', label: '招聘会' },
        { key: '/employment/training', label: '培训课程' },
      ],
    },
    { key: '/exam', icon: <FileTextOutlined />, label: '人事考试' },
    { key: '/policy', icon: <QuestionCircleOutlined />, label: '政策咨询' },
  ],
  enterprise: [
    { key: '/dashboard', icon: <HomeOutlined />, label: '首页' },
    {
      key: '/insurance',
      icon: <InsuranceOutlined />,
      label: '社保服务',
      children: [{ key: '/insurance/base-declare', label: '基数申报' }],
    },
    {
      key: '/employment',
      icon: <SolutionOutlined />,
      label: '就业服务',
      children: [{ key: '/employment/job-publish', label: '岗位发布' }],
    },
    { key: '/exam', icon: <FileTextOutlined />, label: '人事考试' },
    { key: '/policy', icon: <QuestionCircleOutlined />, label: '政策咨询' },
  ],
  staff: [
    { key: '/dashboard', icon: <HomeOutlined />, label: '首页' },
    { key: '/insurance', icon: <InsuranceOutlined />, label: '社保服务' },
    { key: '/employment', icon: <SolutionOutlined />, label: '就业服务' },
    { key: '/exam', icon: <FileTextOutlined />, label: '人事考试' },
    { key: '/policy', icon: <QuestionCircleOutlined />, label: '政策咨询' },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '运营管理',
      children: [
        { key: '/analytics/time-monitoring', label: '时效监测' },
        { key: '/analytics/satisfaction', label: '满意度分析' },
        { key: '/analytics/heatmap', label: '热力分析' },
        { key: '/analytics/audit-logs', label: '审计日志' },
      ],
    },
  ],
  agency_admin: [
    { key: '/dashboard', icon: <HomeOutlined />, label: '首页' },
    { key: '/insurance', icon: <InsuranceOutlined />, label: '社保服务' },
    { key: '/employment', icon: <SolutionOutlined />, label: '就业服务' },
    { key: '/exam', icon: <FileTextOutlined />, label: '人事考试' },
    { key: '/policy', icon: <QuestionCircleOutlined />, label: '政策咨询' },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '运营管理',
      children: [
        { key: '/analytics/dashboard', label: '运营总览' },
        { key: '/analytics/time-monitoring', label: '时效监测' },
        { key: '/analytics/satisfaction', label: '满意度分析' },
        { key: '/analytics/heatmap', label: '热力分析' },
        { key: '/analytics/audit-logs', label: '审计日志' },
      ],
    },
  ],
};

const serviceNav = [
  { key: 'insurance', label: '社保服务' },
  { key: 'employment', label: '就业服务' },
  { key: 'exam', label: '人事考试' },
  { key: 'policy', label: '政策咨询' },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    if (!user) return menuConfig.personal;
    const role = user.role || user.roles?.[0] || 'personal';
    return menuConfig[role] || menuConfig.personal;
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/user/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
      onClick: () => navigate('/user/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getRoleName = () => {
    const roleMap = {
      personal: '个人用户',
      enterprise: '企业HR',
      staff: '基层经办',
      agency_admin: '经办机构管理员',
    };
    const role = user?.role || user?.roles?.[0] || 'personal';
    return roleMap[role] || '个人用户';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#1E6FDB',
          padding: '0 24px',
          height: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 48 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: '#fff',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <span style={{ color: '#1E6FDB', fontSize: 20, fontWeight: 'bold' }}>政</span>
            </div>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>政务服务平台</span>
          </div>

          <Space size={8} style={{ flex: 1, justifyContent: 'center' }}>
            {serviceNav.map((item) => (
              <Button
                key={item.key}
                type="text"
                style={{ color: '#fff', fontSize: 14 }}
                onClick={() => navigate(`/${item.key}`)}
              >
                {item.label}
              </Button>
            ))}
          </Space>
        </div>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar size={32} icon={<UserOutlined />} src={user?.avatar} />
            <span>{user?.name || user?.username || '用户'}</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>({getRoleName()})</span>
            <DownOutlined style={{ fontSize: 12 }} />
          </Space>
        </Dropdown>
      </Header>

      <Layout>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
        >
          <div
            style={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: '100%', height: '100%' }}
            />
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            onClick={handleMenuClick}
            style={{ borderRight: 0, height: 'calc(100vh - 112px)' }}
          />
        </Sider>

        <Layout style={{ background: '#f5f7fa' }}>
          <Content style={{ margin: 0, minHeight: 280 }}>
            <div style={{ padding: 24, minHeight: 'calc(100vh - 176px)' }}>
              <Outlet />
            </div>
          </Content>
          <Footer
            style={{
              textAlign: 'center',
              background: '#fff',
              borderTop: '1px solid #f0f0f0',
              padding: '16px 24px',
            }}
          >
            政务服务平台 ©{new Date().getFullYear()} 版权所有 | 技术支持：政务信息化中心
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
