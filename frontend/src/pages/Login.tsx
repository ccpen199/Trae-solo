import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await login(values.username, values.password);

      if (result.success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err: any) {
      setError(err.message || '登录过程中发生错误');
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
          width: 400,
          maxWidth: '100%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <MedicineBoxOutlined
            style={{
              fontSize: 48,
              color: '#1890ff',
              marginBottom: 16,
            }}
          />
          <Title level={3} style={{ marginBottom: 8 }}>
            电子病历系统
          </Title>
          <Text type="secondary">EMR System - 医疗临床专用PC端</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form
          name="login"
          initialValues={{ username: 'doctor1', password: 'Emr@2024Secure' }}
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

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ height: 44 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          <Text strong>测试账号：</Text>
          <br />
          <Text type="secondary">
            医生: doctor1 / Emr@2024Secure
            <br />
            护士: nurse1 / Emr@2024Secure
            <br />
            药师: pharmacist1 / Emr@2024Secure
            <br />
            管理员: admin / Emr@2024Secure
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
