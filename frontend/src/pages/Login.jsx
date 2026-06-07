import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { authAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUserLogin = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.userLogin(values);
      if (res.data.success) {
        message.success('登录成功');
        onLogin(res.data.user, 'user', res.data.token);
        navigate('/');
      }
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLawyerLogin = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.lawyerLogin(values);
      if (res.data.success) {
        message.success('登录成功');
        onLogin(res.data.lawyer, 'lawyer', res.data.token);
        navigate('/lawyer/dashboard');
      }
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.adminLogin(values);
      if (res.data.success) {
        message.success('登录成功');
        onLogin(res.data.admin, 'admin', res.data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'user',
      label: '用户登录',
      children: (
        <Form name="user_login" onFinish={handleUserLogin} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              用户登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'lawyer',
      label: '律师登录',
      children: (
        <Form name="lawyer_login" onFinish={handleLawyerLogin} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              律师登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'admin',
      label: '管理员登录',
      children: (
        <Form name="admin_login" onFinish={handleAdminLogin} autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<SafetyOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              管理员登录
            </Button>
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            默认管理员账号: admin / admin123
          </Typography.Text>
        </Form>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#f0f2f5' }}>
      <Card style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>⚖️ 法智云平台</Title>
          <Typography.Text type="secondary">专业法律服务，就在您身边</Typography.Text>
        </Space>
        <div style={{ marginTop: 32 }}>
          <Tabs items={tabItems} centered />
        </div>
      </Card>
    </div>
  );
}

export default Login;
