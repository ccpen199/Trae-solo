import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Descriptions, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import api from '../utils/api';

function Profile({ user, setUser }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('加载用户信息失败', error);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile', values);
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    }
    setLoading(false);
  };

  if (!user) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>个人中心</h1>

      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="账户类型">
            <Tag color={user.type === 'enterprise' ? 'blue' : 'green'}>
              {user.type === 'enterprise' ? '企业账户' : '个人账户'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="账户状态">
            <Tag color="green">正常</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="编辑资料">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ maxWidth: 500 }}
        >
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="收货地址">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Profile;
