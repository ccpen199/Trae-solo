import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={[
          <Button type="primary" key="home" onClick={() => navigate('/')}>
            返回首页
          </Button>,
          <Button key="back" onClick={() => navigate(-1)}>
            返回上一页
          </Button>,
        ]}
      />
    </div>
  );
};

export default NotFound;
