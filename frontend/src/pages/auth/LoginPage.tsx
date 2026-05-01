import React from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import './auth.css';

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        login(user, token);
        message.success('登录成功');
        navigate(from, { replace: true });
      } else {
        message.error(response.data.error || '登录失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { username: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', values);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        login(user, token);
        message.success('注册成功，已自动登录');
        navigate('/');
      } else {
        message.error(response.data.error || '注册失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名或邮箱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度应在 3-20 个字符之间' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="邮箱地址" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 128, message: '密码长度应在 6-128 个字符之间' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>社区论坛</h1>
          <p>欢迎加入我们的社区</p>
        </div>
        
        <Card className="auth-card">
          <Tabs defaultActiveKey="login" items={tabItems} centered />
        </Card>

        <div className="auth-footer">
          <p>测试账号：</p>
          <p>管理员: admin / admin123</p>
          <p>审核员: auditor / auditor123</p>
          <p>版主: moderator / moderator123</p>
          <p>普通用户: user1 / user123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
