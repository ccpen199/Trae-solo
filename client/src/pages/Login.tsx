import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';
import { User } from '@/types';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setUser, setTokens } = useAuthStore();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await authApi.login(values.username, values.password);
      
      if (result.success) {
        setTokens(result.token, result.refreshToken);
        setUser(result.user as User);
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          borderRadius: 8
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
            优惠券营销系统
          </Title>
          <Text type="secondary">Coupon Marketing System</Text>
        </div>

        <Form
          name="login"
          size="large"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名 / 邮箱"
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

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认账号：
          </Text>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            <div>管理员: admin / Admin@123</div>
            <div>运营: operator / Operator@123</div>
            <div>商家: merchant / Merchant@123</div>
            <div>财务: finance / Finance@123</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
