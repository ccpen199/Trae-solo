import React from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      await login(values.username, values.password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || '登录失败');
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
      padding: 20
    }}>
      <Card style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>多因素认证系统</Title>
          <Text type="secondary">MFA Authentication System</Text>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: 16, padding: 12, background: '#fff1f0', borderRadius: 4 }}>
            {error}
          </div>
        )}

        <Form
          name="login"
          onFinish={onFinish}
          size="large"
          autoComplete="off"
          initialValues={{ username: 'platform_engineer', password: 'Admin@123' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Text strong>测试账号 (密码: Admin@123):</Text>
          <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.8 }}>
            <div>• platform_engineer (平台工程师)</div>
            <div>• ops_admin (运维)</div>
            <div>• developer (开发者)</div>
            <div>• app_owner (应用负责人)</div>
            <div>• security_admin (安全管理员)</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
