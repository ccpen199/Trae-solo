import React from 'react';
import { Card, Descriptions, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  const roleMap: Record<string, string> = {
    customer: '普通用户',
    provider: '服务商',
    admin: '系统管理员',
  };

  return (
    <div>
      <Card title="个人中心">
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
          <div>
            <h2 style={{ margin: 0 }}>{user?.name}</h2>
            <p style={{ color: '#999', margin: '8px 0' }}>{roleMap[user?.role || 'customer']}</p>
            <div style={{ display: 'flex', gap: 16 }}>
              {user?.role === 'provider' && (
                <>
                  <span>评分：{user.rating} / 5</span>
                  <span>完成订单：{user.orderCount} 单</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="手机号">{user?.phone}</Descriptions.Item>
          <Descriptions.Item label="认证状态">
            {user?.isVerified ? (
              <span style={{ color: '#52c41a' }}>已认证</span>
            ) : (
              <span style={{ color: '#faad14' }}>未认证</span>
            )}
          </Descriptions.Item>
          {user?.role === 'provider' && (
            <>
              <Descriptions.Item label="人脸识别">
                {user.faceVerified ? (
                  <span style={{ color: '#52c41a' }}>已通过</span>
                ) : (
                  <span style={{ color: '#faad14' }}>未认证</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="服务区域">{user.address || '-'}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="注册时间">{user ? new Date().toLocaleDateString() : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Profile;
