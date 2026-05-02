import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge, theme } from 'antd';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  SwapOutlined, 
  MoneyCollectOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer } } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/bills',
      icon: <FileTextOutlined />,
      label: '票据台账',
    },
    {
      key: '/endorsements',
      icon: <SwapOutlined />,
      label: '背书流转',
    },
    {
      key: '/discounts',
      icon: <MoneyCollectOutlined />,
      label: '贴现申请',
    },
    {
      key: '/maturities',
      icon: <ClockCircleOutlined />,
      label: '到期提醒',
    },
    {
      key: '/differences',
      icon: <WarningOutlined />,
      label: '差异处理',
    }
  ];

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
      label: `${user?.name} (${getRoleLabel(user?.role)})`,
      disabled: true
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '0 16px'
        }}>
          <Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
            票据管理系统
          </Title>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout style={{ marginLeft: 220 }}>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{user?.name}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content 
          style={{ 
            margin: '24px',
            padding: 24,
            background: colorBgContainer,
            minHeight: 280,
            borderRadius: 6
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

const getRoleLabel = (role) => {
  const labels = {
    admin: '管理员',
    finance: '财务',
    bank: '银行',
    supplier: '供应商',
    customer: '客户',
    auditor: '审计'
  };
  return labels[role] || role;
};

export default MainLayout;
