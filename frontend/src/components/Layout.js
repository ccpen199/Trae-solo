import React from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Typography, theme } from 'antd';
import { 
  DashboardOutlined, 
  ProjectOutlined, 
  FileTextOutlined,
  HistoryOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

const roleLabels = {
  tenderer: '招标方',
  bidder: '竞买人',
  supervisor: '监管人员',
  auditor: '审计员',
  expert: '专家',
  finance: '财务人员'
};

const getMenuItems = (role) => {
  const baseItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台'
    }
  ];

  if (role === 'tenderer' || role === 'supervisor') {
    baseItems.push({
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理'
    });
  }

  if (role === 'bidder') {
    baseItems.push(
      {
        key: '/projects',
        icon: <ProjectOutlined />,
        label: '项目列表'
      },
      {
        key: '/my-registrations',
        icon: <FileTextOutlined />,
        label: '我的报名'
      },
      {
        key: '/my-bids',
        icon: <HistoryOutlined />,
        label: '竞价记录'
      }
    );
  }

  if (role === 'auditor' || role === 'supervisor') {
    baseItems.push(
      {
        key: '/audit',
        icon: <SafetyOutlined />,
        label: '审计监管'
      }
    );
  }

  return baseItems;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true
    }
  ];

  const handleMenuDropdownClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
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
          background: 'rgba(255,255,255,0.1)'
        }}>
          <SafetyOutlined style={{ fontSize: 24, color: '#fff', marginRight: 8 }} />
          <Title level={5} style={{ color: '#fff', margin: 0 }}>政府采购系统</Title>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(user?.role)}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <AntLayout style={{ marginLeft: 200 }}>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <div style={{ marginRight: 16 }}>
            {user && (
              <Dropdown menu={{ items: userMenuItems, onClick: handleMenuDropdownClick }}>
                <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '4px'
              }}>
                  <Avatar icon={<UserOutlined />} />
                  <span style={{ marginLeft: 8 }}>
                    {user.realName || user.username}
                    <span style={{ 
                      marginLeft: 8, 
                      color: '#1890ff', 
                      fontSize: 12 
                    }}>
                      [{roleLabels[user.role] || user.role}]
                    </span>
                  </span>
                </div>
              </Dropdown>
            )}
          </div>
        </Header>
        
        <Content style={{
          margin: '24px',
          padding: 24,
          minHeight: 280,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
