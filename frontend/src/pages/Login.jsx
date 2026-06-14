import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Typography } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const res = await register(values);
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('注册成功');
        navigate('/');
      } else {
        message.error(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { username: 'admin', password: '123456', role: '系统管理员' },
    { username: 'owner1', password: '123456', role: '业主' },
    { username: 'designer1', password: '123456', role: '设计师' },
    { username: 'manager1', password: '123456', role: '装修管家' },
    { username: 'company1', password: '123456', role: '装修公司' }
  ];

  return (
    <div className="login-container">
      <Card className="login-form" bordered={false}>
        <div className="login-title">
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            装修产业互联网设计协同平台
          </Title>
          <p style={{ color: '#888', marginTop: 8 }}>
            案例驱动 · AI赋能 · 全链路协同
          </p>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <Tabs.TabPane tab="登录" key="login">
            <Form onFinish={handleLogin} layout="vertical">
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="注册" key="register">
            <Form onFinish={handleRegister} layout="vertical">
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
              </Form.Item>
              <Form.Item
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="真实姓名" size="large" />
              </Form.Item>
              <Form.Item
                name="phone"
              >
                <Input prefix={<PhoneOutlined />} placeholder="手机号" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  注册
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <p style={{ marginBottom: 8, fontWeight: 500 }}>演示账号：</p>
          {demoAccounts.map((acc, idx) => (
            <span key={idx} style={{ marginRight: 16, fontSize: 13, color: '#666' }}>
              {acc.username} / {acc.password} ({acc.role})
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Login;
