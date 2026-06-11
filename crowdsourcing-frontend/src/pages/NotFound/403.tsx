import React from 'react';
import { Button, Result } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

const Page403: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useUserStore();

  const getRedirectPath = () => {
    switch (userInfo?.role) {
      case 'employer':
        return '/employer/dashboard';
      case 'provider':
        return '/provider/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={[
          <Button 
            type="primary" 
            key="home"
            icon={<HomeOutlined />}
            onClick={() => navigate(getRedirectPath())}
          >
            返回首页
          </Button>,
          <Button 
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            返回上一页
          </Button>
        ]}
      />
    </div>
  );
};

export default Page403;
