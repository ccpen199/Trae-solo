import { Layout, Menu, Avatar, Dropdown, Badge, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TruckOutlined,
  CalculatorOutlined,
  FileDoneOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '数据看板',
  },
  {
    key: '/waybills',
    icon: <FileTextOutlined />,
    label: '电子运单',
  },
  {
    key: '/tracking',
    icon: <TruckOutlined />,
    label: '物流追踪',
  },
  {
    key: '/freight',
    icon: <CalculatorOutlined />,
    label: '运费计算',
  },
  {
    key: '/dispatch',
    icon: <TruckOutlined />,
    label: '运力调度',
  },
  {
    key: '/customer-service',
    icon: <UserOutlined />,
    label: '客户服务',
    children: [
      { key: '/customer-service/invoices', label: '电子发票' },
      { key: '/customer-service/statements', label: '对账单' },
      { key: '/customer-service/addresses', label: '常用地址' },
    ],
  },
  {
    key: '/admin',
    icon: <SettingOutlined />,
    label: '后台管理',
    children: [
      { key: '/admin/credit', label: '信用额度管理' },
      { key: '/admin/green-channel', label: '绿色通道管理' },
    ],
  },
  {
    key: '/integration',
    icon: <GlobalOutlined />,
    label: '系统集成',
    children: [
      { key: '/integration/customs', label: '海关数据交换' },
      { key: '/integration/airport', label: '机场系统对接' },
    ],
  },
];

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const alerts = useAppStore((state) => state.alerts);
  const currentUser = useAppStore((state) => state.currentUser);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const userDropdownItems = [
    { key: '1', label: '个人中心' },
    { key: '2', label: '账号设置' },
    { type: 'divider' as const },
    { key: '3', label: '退出登录' },
  ];

  const notificationDropdownItems = alerts.slice(0, 5).map((alert) => ({
    key: alert.id,
    label: (
      <div style={{ maxWidth: 300 }}>
        <div style={{ fontWeight: 500 }}>{alert.title}</div>
        <div style={{ color: '#999', fontSize: 12 }}>{alert.description}</div>
      </div>
    ),
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        style={{ background: '#001529' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
            borderBottom: '1px solid #002140',
          }}
        >
          {collapsed ? '跨越' : '跨越速运'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/customer-service', '/admin', '/integration']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500 }}>B2B快运业务协同平台</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Dropdown menu={{ items: notificationDropdownItems }} placement="bottomRight">
              <Badge count={unreadCount} size="small">
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{currentUser.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
