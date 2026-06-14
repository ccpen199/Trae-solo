import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SolutionOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  ShopOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  BankOutlined,
  CreditCardOutlined,
  AlertOutlined,
  BarChartOutlined,
  PrinterOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getUser, clearAuth, isEnterprise, isJobseeker, isAdmin, isLoggedIn } from '../utils/auth';
import type { User } from '../types';

const { Header, Sider, Content } = Layout;

const enterpriseMenuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '工作台',
  },
  {
    key: '/enterprise/jobs',
    icon: <SolutionOutlined />,
    label: '岗位管理',
  },
  {
    key: '/enterprise/resumes',
    icon: <FileTextOutlined />,
    label: '简历解析',
  },
  {
    key: '/enterprise/recommend',
    icon: <TeamOutlined />,
    label: '人才推荐',
  },
  {
    key: '/enterprise/interviews',
    icon: <CalendarOutlined />,
    label: '面试安排',
  },
];

const jobseekerMenuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '工作台',
  },
  {
    key: '/jobseeker/resume',
    icon: <EditOutlined />,
    label: '简历编辑',
  },
  {
    key: '/jobseeker/jobs',
    icon: <ShopOutlined />,
    label: '求职广场',
  },
  {
    key: '/jobseeker/community',
    icon: <MessageOutlined />,
    label: '行业社群',
  },
  {
    key: '/jobseeker/interviews',
    icon: <ClockCircleOutlined />,
    label: '我的面试',
  },
];

const adminMenuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '工作台',
  },
  {
    key: '/admin/enterprises',
    icon: <BankOutlined />,
    label: '企业管理',
  },
  {
    key: '/admin/credit',
    icon: <CreditCardOutlined />,
    label: '信用档案',
  },
  {
    key: '/admin/sensitive-words',
    icon: <AlertOutlined />,
    label: '敏感词管理',
  },
  {
    key: '/admin/warnings',
    icon: <AlertOutlined />,
    label: '预警列表',
  },
  {
    key: '/admin/statistics',
    icon: <BarChartOutlined />,
    label: '系统统计',
  },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser() as User | null;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);

  const getMenuItems = () => {
    if (isEnterprise()) return enterpriseMenuItems;
    if (isJobseeker()) return jobseekerMenuItems;
    if (isAdmin()) return adminMenuItems;
    return [];
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getRoleLabel = () => {
    if (isEnterprise()) return '企业用户';
    if (isJobseeker()) return '求职者';
    if (isAdmin()) return '管理员';
    return '';
  };

  if (!isLoggedIn()) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <PrinterOutlined style={{ fontSize: '28px' }} />
          <span>印刷人才招聘平台</span>
        </div>
        <Space size="16">
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            {getRoleLabel()}
          </span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', color: 'white' }}>
              <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
              <span>{user?.name || user?.email}</span>
            </Space>
          </Dropdown>
          <Button type="text" danger onClick={handleLogout} icon={<LogoutOutlined />}>
            登出
          </Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 184px)',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
