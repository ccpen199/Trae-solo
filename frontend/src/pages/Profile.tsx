import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Avatar, message, Space, Divider, Descriptions } from 'antd';
import { UserOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        phone: user.phone,
      });
    }
  }, [user, form]);

  const onFinish = async () => {
    setLoading(true);
    try {
      message.success('个人信息保存成功');
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
      <Title level={3} style={{ marginBottom: 24 }}>个人信息</Title>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={100} icon={<UserOutlined />} style={{ marginRight: 32 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>{user?.name}</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {roleMap[user?.role || '']}
            </Text>
          </div>
        </div>

        <Divider />

        <Descriptions bordered column={2} style={{ marginBottom: 32 }}>
          <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{user?.phone}</Descriptions.Item>
          <Descriptions.Item label="用户ID">{user?.id}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{dayjs(user?.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={5}>编辑信息</Title>

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
    </div>
  );
};

export default Profile;
