import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (err) {
      message.error('登录失败，请检查用户名和密码');
    }
  };

  const handleDemoFill = () => {
    const form = {
      username: 'admin',
      password: 'admin123',
    };
    void onFinish(form);
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="运营管理后台">
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
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
          <Form.Item>
            <Button onClick={handleDemoFill} block disabled={loading}>
              一键进入演示后台
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
