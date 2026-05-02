import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
        realName: values.realName,
        phone: values.phone
      });
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={22} sm={16} md={12} lg={8}>
        <Card title="注册" style={{ borderRadius: '8px' }}>
          <Form
            name="register"
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
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="手机号" />
            </Form.Item>

            <Form.Item
              name="realName"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input placeholder="真实姓名" />
            </Form.Item>

            <Form.Item
              name="role"
              rules={[{ required: true, message: '请选择用户类型' }]}
            >
              <Select placeholder="选择用户类型">
                <Option value="client">普通用户（咨询者）</Option>
                <Option value="lawyer">律师（需要认证）</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  }
                })
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              已有账号？<Link to="/login">立即登录</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;
