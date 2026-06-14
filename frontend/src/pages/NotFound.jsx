import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { HomeOutlined, QrcodeOutlined, FrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '24px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          textAlign: 'center',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <FrownOutlined style={{ fontSize: '80px', color: '#1890ff', marginBottom: '16px' }} />
        <Title level={1} style={{ marginBottom: '8px', fontSize: '72px', color: '#1890ff' }}>
          404
        </Title>
        <Title level={3} style={{ marginTop: 0, marginBottom: '8px' }}>
          页面未找到
        </Title>
        <Paragraph style={{ color: '#8c8c8c', marginBottom: '24px' }}>
          抱歉，您访问的页面不存在或已被移除。
        </Paragraph>
        <Space size="middle">
          <Button 
            type="primary" 
            size="large" 
            icon={<HomeOutlined />}
            onClick={() => navigate('/home')}
          >
            返回首页
          </Button>
          <Button 
            size="large" 
            icon={<QrcodeOutlined />}
            onClick={() => navigate('/qrcode')}
          >
            乘车码
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default NotFound;
