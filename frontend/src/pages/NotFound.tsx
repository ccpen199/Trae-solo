import React from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '48px 64px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        extra={[
          <Button
            type="primary"
            key="home"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            size="large"
          >
            返回首页
          </Button>,
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            size="large"
          >
            返回上一页
          </Button>
        ]}
      />
    </div>
  );
};

export default NotFound;
