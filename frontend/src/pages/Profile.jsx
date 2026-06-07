import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Avatar, List, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { authAPI, enterpriseAPI } from '../services/api';

function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <div>加载中...</div>;

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <h2 style={{ marginTop: 16 }}>{profile.realName || profile.username}</h2>
          <Tag color={profile.userType === 'admin' ? 'red' : profile.userType === 'enterprise' ? 'blue' : 'green'}>
            {profile.userType === 'admin' ? '管理员' : profile.userType === 'enterprise' ? '企业用户' : '个人用户'}
          </Tag>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名">{profile.username}</Descriptions.Item>
          <Descriptions.Item label="真实姓名">{profile.realName || '-'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{profile.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{profile.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="身份证号" span={2}>
            {profile.idCard || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {profile.enterpriseBindings?.length > 0 && (
        <Card title="绑定的企业" style={{ marginTop: 16 }}>
          <List
            dataSource={profile.enterpriseBindings}
            renderItem={item => (
              <List.Item
                actions={[
                  <Tag color={item.status === 'verified' ? 'green' : 'orange'} key="status">
                    {item.status === 'verified' ? '已认证' : '待审核'}
                  </Tag>,
                  <Tag color="blue" key="role">{item.role === 'admin' ? '管理员' : '员工'}</Tag>
                ]}
              >
                <List.Item.Meta
                  title={item.enterprise_name}
                  description={item.unified_credit_code}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

export default Profile;
