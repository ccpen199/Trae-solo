import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, adminLogin } from '../api/auth';

const DEMO_USER = { phone: '13800000000', password: '123456' };
const DEMO_ADMIN = { username: 'admin', password: 'admin123' };

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user');

  const handleUserLogin = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);
      localStorage.setItem('tft_token', res.token);
      localStorage.setItem('tft_user', JSON.stringify(res.user));
      message.success('登录成功');
      navigate('/home');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (values) => {
    setLoading(true);
    try {
      const res = await adminLogin(values);
      localStorage.setItem('tft_token', res.token);
      localStorage.setItem('tft_admin_token', res.token);
      localStorage.setItem('tft_admin', JSON.stringify(res.admin));
      message.success('管理员登录成功');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const userForm = (
    <Form
      name="user_login"
      onFinish={handleUserLogin}
      initialValues={DEMO_USER}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="phone"
        rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="请输入手机号" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          用户登录
        </Button>
      </Form.Item>
      <Form.Item>
        <Button block onClick={() => handleUserLogin(DEMO_USER)} loading={loading}>
          一键体验用户首页
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center' }}>
        还没有账号？<a onClick={() => navigate('/register')}>立即注册</a>
      </div>
      <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 8 }}>
        默认用户账号：13800000000 / 123456
      </div>
    </Form>
  );

  const adminForm = (
    <Form
      name="admin_login"
      onFinish={handleAdminLogin}
      initialValues={DEMO_ADMIN}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input prefix={<SafetyOutlined />} placeholder="请输入管理员用户名" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          管理员登录
        </Button>
      </Form.Item>
      <Form.Item>
        <Button block onClick={() => handleAdminLogin(DEMO_ADMIN)} loading={loading}>
          一键进入管理后台
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
        默认管理员账号：admin / admin123
      </div>
    </Form>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚌</div>
          <h1 style={{ fontSize: 24, margin: 0, color: '#1890ff' }}>天府通</h1>
          <p style={{ color: '#999', margin: '8px 0 0' }}>成都市域一体化交通生活服务中台</p>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            { key: 'user', label: '用户登录' },
            { key: 'admin', label: '管理员登录' }
          ]}
        />
        {activeTab === 'user' ? userForm : adminForm}
      </Card>
    </div>
  );
};

export default Login;
