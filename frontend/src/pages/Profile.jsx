import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  message,
  Divider,
  Modal
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store';
import { authApi, userApi } from '../api';

const { TextArea } = Input;

function Profile() {
  const { user, updateUser, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();

  const roleMap = {
    platform_admin: '平台管理员',
    streamer: '主播',
    merchant: '商家',
    viewer: '观众'
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await userApi.updateProfile({
        nickname: values.nickname,
        avatar: values.avatar
      });

      if (result.success) {
        message.success('个人信息更新成功');
        updateUser({
          ...user,
          nickname: values.nickname,
          avatar: values.avatar
        });
      }
    } catch (error) {
      message.error('更新个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.changePassword(values.oldPassword, values.newPassword);
      
      if (result.success) {
        message.success('密码修改成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      }
    } catch (error) {
      message.error(error.error?.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>个人中心</h2>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar
            size={100}
            icon={<UserOutlined />}
            src={user?.avatar}
            style={{ marginBottom: 16 }}
          />
          <h2>{user?.nickname || user?.username}</h2>
          <p style={{ color: '#666' }}>
            用户名: {user?.username}
          </p>
          <p>
            角色: <strong>{roleMap[user?.role] || user?.role}</strong>
          </p>
        </div>

        <Divider>个人信息</Divider>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            nickname: user?.nickname || '',
            avatar: user?.avatar || ''
          }}
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input prefix={<EditOutlined />} placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="头像链接"
          >
            <Input placeholder="请输入头像链接（可选）" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              保存修改
            </Button>
          </Form.Item>
        </Form>

        <Divider>账号安全</Divider>

        <Button
          type="default"
          icon={<LockOutlined />}
          onClick={() => setPasswordModalVisible(true)}
          block
        >
          修改密码
        </Button>
      </Card>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        onOk={() => passwordForm.submit()}
        okText="确认"
        cancelText="取消"
        confirmLoading={loading}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6个字符）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请确认新密码' }
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Profile;
