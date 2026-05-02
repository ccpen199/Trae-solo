import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={22} sm={16} md={12} lg={8}>
        <Card title="登录" style={{ borderRadius: '8px' }}>
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
              <Input prefix={<UserOutlined />} placeholder="用户名/邮箱" />
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

            <div style={{ textAlign: 'center' }}>
              还没有账号？<Link to="/register">立即注册</Link>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>测试账号：</div>
              <div>普通用户: client1 / 123456</div>
              <div>认证律师: lawyer1 / 123456</div>
              <div>平台客服: cs1 / 123456</div>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;
