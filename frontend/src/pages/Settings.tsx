import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Avatar, message, Space, Divider } from 'antd';
import { UserOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        phone: user.phone,
        role: user.role,
      });
    }
  }, [user, form]);

  const onFinish = async () => {
    setLoading(true);
    try {
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const roleMap: Record<string, string> = {
    admin: '系统管理员',
    surveyor: '查勘员',
    assessor: '定损员',
    reviewer: '审核员',
    service: '客服',
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>系统设置</Title>

      <Card title="个人信息">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} style={{ marginRight: 24 }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>{user?.name}</Title>
            <Text type="secondary">用户名: {user?.username}</Text>
            <br />
            <Text type="secondary">角色: {roleMap[user?.role || '']}</Text>
          </div>
        </div>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 500 }}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="关于系统" style={{ marginTop: 24 }}>
        <div style={{ lineHeight: 2 }}>
          <p><strong>保险查勘定损平台</strong></p>
          <p>版本: 1.0.0</p>
          <p>功能模块:</p>
          <ul>
            <li>查勘任务管理</li>
            <li>照片取证管理</li>
            <li>损失项目录入</li>
            <li>定损审核流程</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
