import React from 'react';
import { Layout, Button, Typography, message } from 'antd';
import { LogoutOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  const handleMyApplications = () => {
    navigate('/credit');
  };

  const showHeader = !['/login'].includes(location.pathname);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {showHeader && (
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Title level={4} style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/products')}>
            贷款服务平台
          </Title>
          <div className="header-right">
            <Button
              icon={<FileTextOutlined />}
              onClick={handleMyApplications}
              type={location.pathname === '/credit' ? 'primary' : 'text'}
            >
              我的申请
            </Button>
            <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text">
              退出
            </Button>
          </div>
        </Header>
      )}
      <Content>
        {title && (
          <div style={{ padding: '16px 24px 0', background: '#fff' }}>
            <Title level={3} style={{ margin: 0 }}>{title}</Title>
          </div>
        )}
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;
