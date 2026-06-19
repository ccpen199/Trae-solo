import React from 'react';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useService } from './ServiceProvider';

const PermissionDenied: React.FC = () => {
  const { toast, navigate, roleLabel } = useService();

  const goBack = () => {
    navigate('/dashboard');
    toast.info('已返回数据看板');
  };

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Result
        status="403"
        icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
        title="403"
        subTitle={`您当前的角色【${roleLabel}】无权限访问该页面。如需开通，请联系超级管理员。`}
        extra={
          <Button type="primary" onClick={goBack}>
            返回数据看板
          </Button>
        }
      />
    </div>
  );
};

export default PermissionDenied;
