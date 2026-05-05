import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  // 如果已登录，直接跳转
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const response = await authApi.login(values.username, values.password);
      
      if (response.success) {
        setAuth(response.data.token, response.data.user);
        message.success('登录成功！');
        
        // 根据角色跳转
        const role = response.data.user.role;
        if (role === Role.ADMIN) {
          navigate('/dashboard/users');
        } else {
          navigate('/dashboard/tasks');
        }
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || '登录失败，请检查用户名和密码';
      message.error(errorMsg);
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
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            任务管理系统
          </Title>
          <Text type="secondary">请登录您的账户</Text>
        </div>

        <Form
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
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%' }}
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            测试账号：
          </Text>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <Text>管理员: admin / admin123</Text>
            <br />
            <Text>主管: supervisor / 123456</Text>
            <br />
            <Text>员工: employee1 / 123456</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
