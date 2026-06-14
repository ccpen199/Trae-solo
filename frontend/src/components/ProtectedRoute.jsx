import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button, Skeleton } from 'antd';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated, loading, checkPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !checkPermission(permission)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问该页面"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  return children;
};

export default ProtectedRoute;
