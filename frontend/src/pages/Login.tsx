import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const response = await login(values);
      authLogin(response.user, response.token);
      message.success('登录成功！');
      navigate('/');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card title="企业资质办理系统" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
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
        </Form>

        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          <p>默认账号：</p>
          <p>管理员: admin / admin123</p>
          <p>代办专员: agent / admin123</p>
          <p>审核专员: auditor / admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
