import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Badge } from 'antd';
import { 
  HomeOutlined, 
  FileTextOutlined, 
  TeamOutlined, 
  BookOutlined, 
  WalletOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: '/consultations',
      icon: <FileTextOutlined />,
      label: '我的咨询',
      onClick: () => navigate('/consultations')
    },
    {
      key: '/lawyers',
      icon: <TeamOutlined />,
      label: '律师推荐',
      onClick: () => navigate('/lawyers')
    },
    {
      key: '/cases',
      icon: <BookOutlined />,
      label: '案例库',
      onClick: () => navigate('/cases')
    },
    {
      key: '/wallet',
      icon: <WalletOutlined />,
      label: '我的钱包',
      onClick: () => navigate('/wallet')
    }
  ];

  const supportMenuItems = [
    ...menuItems,
    {
      key: '/disputes',
      icon: <SettingOutlined />,
      label: '争议处理',
      onClick: () => navigate('/disputes')
    }
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人信息
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const getRoleText = (role) => {
    const roleMap = {
      client: '普通用户',
      lawyer: '认证律师',
      support: '平台客服',
      finance: '财务人员',
      admin: '管理员'
    };
    return roleMap[role] || role;
  };

  const currentMenuItems = user?.role === 'support' ? supportMenuItems : menuItems;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#001529'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            color: '#fff', 
            fontSize: '20px', 
            fontWeight: 'bold',
            marginRight: '24px'
          }}>
            在线法律咨询平台
          </div>
        </div>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={0} showZero>
              <Button 
                type="text" 
                icon={<NotificationOutlined style={{ color: '#fff', fontSize: '18px' }} />} 
              />
            </Badge>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                <span>{user.realName || user.username}</span>
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '12px', 
                  color: 'rgba(255,255,255,0.7)' 
                }}>
                  ({getRoleText(user.role)})
                </span>
              </div>
            </Dropdown>
          </div>
        ) : (
          <div>
            <Button 
              type="text" 
              style={{ color: '#fff', marginRight: '8px' }}
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
            <Button 
              type="primary"
              onClick={() => navigate('/register')}
            >
              注册
            </Button>
          </div>
        )}
      </Header>
      
      <Layout>
        {user && (
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              style={{ height: '100%', borderRight: 0 }}
              items={currentMenuItems}
            />
          </Sider>
        )}
        
        <Layout style={{ padding: '24px', background: '#f0f2f5' }}>
          <Content style={{ 
            background: '#fff', 
            padding: '24px', 
            minHeight: 280,
            borderRadius: '8px'
          }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
