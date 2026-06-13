import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, App, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const result: any = await authAPI.login(values);
      setAuth(result);
      message.success('登录成功');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const result: any = await authAPI.register(values);
      setAuth(result);
      message.success('注册成功');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24,
    }}>
      <Card style={{ width: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, color: '#1677ff', marginBottom: 12 }}>⚡</div>
          <Title level={3} style={{ margin: 0 }}>IoT 统一管控平台</Title>
          <Text type="secondary">跨品牌智能设备统一管理</Text>
        </div>

        <Tabs
          activeKey={mode}
          onChange={(k) => setMode(k as any)}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  layout="vertical"
                  onFinish={handleLogin}
                  initialValues={{ username: '', password: '' }}
                  size="large"
                >
                  <Form.Item
                    name="username"
                    label="用户名 / 邮箱 / 手机号"
                    rules={[{ required: true, message: '请输入登录信息' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      登录
                    </Button>
                  </Form.Item>
                  <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                    测试账户: demo / demo1234
                  </div>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form
                  layout="vertical"
                  onFinish={handleRegister}
                  size="large"
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ required: true, min: 3, message: '用户名至少3位' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请设置用户名" />
                  </Form.Item>
                  <Form.Item name="email" label="邮箱 (可选)">
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                  </Form.Item>
                  <Form.Item name="phone" label="手机号 (可选)">
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, min: 8, message: '密码至少8位' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="请设置密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default LoginPage;
