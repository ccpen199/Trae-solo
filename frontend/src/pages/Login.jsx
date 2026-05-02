import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LoginOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
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
      padding: '20px',
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <GlobalOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            地图导航系统
          </Title>
          <Text type="secondary">Map Navigation & Route Planning</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          initialValues={{ username: 'admin', password: 'admin123' }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<LoginOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LoginOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary">
            测试账号：
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" code>admin / admin123</Text>
          </div>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" code>user1 / user123</Text>
          </div>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" code>driver1 / driver123</Text>
          </div>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" code>dispatcher1 / dispatcher123</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
