import React, { useState } from 'react';
import { Form, Input, Button, Card, Radio, message, Layout, Typography } from 'antd';
import { UserOutlined, LockOutlined, HeartOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/index.js';
import { setToken, setUser } from '../utils/auth.js';

const { Title, Text } = Typography;
const { Content } = Layout;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('couple');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ ...values, role });
      setToken(response.data.token);
      setUser(response.data.user);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card
          style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', borderRadius: 16 }}
          bodyStyle={{ padding: 40 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <HeartOutlined style={{ fontSize: 48, color: '#ff4d6d', marginBottom: 16 }} />
            <Title level={2} style={{ margin: 0, color: '#ff4d6d' }}>婚嫁优选</Title>
            <Text type="secondary">欢迎回来，请登录您的账号</Text>
          </div>

          <Form
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            initialValues={{ role: 'couple' }}
          >
            <Form.Item style={{ marginBottom: 24 }}>
              <Radio.Group value={role} onChange={(e) => setRole(e.target.value)} block>
                <Radio.Button value="couple">我是新人</Radio.Button>
                <Radio.Button value="merchant">我是商家</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
              style={{ marginBottom: 16 }}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 44,
                  fontSize: 16,
                  background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
                  border: 'none',
                  borderRadius: 8
                }}
              >
                登录
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                还没有账号？ <Link to="/register" style={{ color: '#ff4d6d' }}>立即注册</Link>
              </Text>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default Login;
