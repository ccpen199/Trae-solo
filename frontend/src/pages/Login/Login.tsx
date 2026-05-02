import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const { Title } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state, getDashboardPath]);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const success = await login(values);
      if (!success) {
        message.error('用户名或密码错误');
      }
    } catch (error) {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (username: string, password: string) => {
    form.setFieldsValue({ username, password });
    setLoading(true);
    try {
      await login({ username, password });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            医院预约挂号系统
          </Title>
          <Typography.Text type="secondary">请登录以继续使用</Typography.Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            快速登录测试账号：
          </Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button size="small" onClick={() => quickLogin('admin', 'admin123')}>
              管理员
            </Button>
            <Button size="small" onClick={() => quickLogin('doctor1', 'doctor123')}>
              医生
            </Button>
            <Button size="small" onClick={() => quickLogin('nurse1', 'nurse123')}>
              护士
            </Button>
            <Button size="small" onClick={() => quickLogin('registrar1', 'registrar123')}>
              挂号员
            </Button>
            <Button size="small" onClick={() => quickLogin('patient1', 'patient123')}>
              患者
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
