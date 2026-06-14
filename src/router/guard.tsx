import React, { type ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useUserStore } from '@/stores/useUserStore';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [checking, setChecking] = useState(true);
  const { token } = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname },
      });
      return;
    }
    setChecking(false);
  }, [token, location.pathname, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4 text-sm text-neutral-500">正在验证身份...</div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Result
          icon={<LockOutlined style={{ color: '#165DFF' }} />}
          title="403"
          subTitle="您还未登录，请先登录后再访问"
          extra={
            <Button type="primary" onClick={() => navigate('/login')}>
              去登录
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
