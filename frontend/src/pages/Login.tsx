import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, roleNames } from '../store/auth';

const { Title, Text } = Typography;

const testAccounts = [
  { username: 'owner1', name: '张三', role: 'owner', password: '123456' },
  { username: 'owner2', name: '李四', role: 'owner', password: '123456' },
  { username: 'designer1', name: '王设计', role: 'designer', password: '123456' },
  { username: 'designer2', name: '李设计', role: 'designer', password: '123456' },
  { username: 'supervisor1', name: '赵监理', role: 'supervisor', password: '123456' },
  { username: 'supplier1', name: '孙供应商', role: 'supplier', password: '123456' },
  { username: 'manager1', name: '吴经理', role: 'store_manager', password: '123456' },
  { username: 'admin', name: '系统管理员', role: 'store_manager', password: 'admin123' },
];

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            家装产业协同SaaS平台
          </Title>
          <Text type="secondary">Home Decoration Collaboration Platform</Text>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          name="login"
          initialValues={{ username: 'owner1', password: '123456' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            测试账号：
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {testAccounts.map((acc) => (
              <Button
                key={acc.username}
                size="small"
                onClick={() => onFinish({ username: acc.username, password: acc.password })}
                disabled={loading}
              >
                {acc.name} ({roleNames[acc.role as keyof typeof roleNames]})
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
