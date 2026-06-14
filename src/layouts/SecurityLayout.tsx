import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useUserStore } from '@/stores/useUserStore';
import { usePermissionStore } from '@/stores/usePermissionStore';
import useAuth from '@/hooks/useAuth';
import usePermission from '@/hooks/usePermission';

export interface SecurityLayoutProps {
  children?: React.ReactNode;
}

const SecurityLayout: React.FC<SecurityLayoutProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const { token, userInfo } = useUserStore();
  const { routes } = usePermissionStore();
  const { isAuthenticated } = useAuth();
  const { hasRoute } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);

      if (!isAuthenticated()) {
        setLoading(false);
        setAuthorized(false);
        navigate('/login', {
          state: { from: location.pathname },
          replace: true,
        });
        return;
      }

      if (!userInfo) {
        try {
          // 尝试获取用户信息
          console.log('Fetching user info...');
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      }

      if (routes.length === 0) {
        try {
          // 尝试获取权限信息
          console.log('Fetching permissions...');
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
        }
      }

      // 检查路由权限
      const hasPermission = hasRoute(location.pathname);
      if (!hasPermission && location.pathname !== '/dashboard') {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [token, userInfo, routes.length, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <Spin size="large" tip="正在加载权限信息..." />
          <div className="mt-4 text-sm text-neutral-500">山东省文旅场所智慧监管服务平台</div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Result
          icon={<LockOutlined className="text-primary-500" />}
          title="403"
          subTitle={
            !token
              ? '您还未登录，请先登录后再访问'
              : '抱歉，您没有权限访问该页面'
          }
          extra={[
            <Button
              type="primary"
              key="login"
              onClick={() => navigate(!token ? '/login' : '/dashboard')}
            >
              {!token ? '去登录' : '返回首页'}
            </Button>,
          ]}
        />
      </div>
    );
  }

  return children || <Outlet />;
};

export default SecurityLayout;
