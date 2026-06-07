import React, { useState } from 'react';
import { Form, Input, Button, Card, Radio, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user';
import api from '../utils/api';

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const { login } = useUserStore();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', values);
      login(data.token, data.user);
      message.success('登录成功');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', values);
      login(data.token, data.user);
      message.success('注册成功');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form
      name="login"
      onFinish={handleLogin}
      size="large"
      style={{ maxWidth: 360, margin: '0 auto' }}
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
      <div style={{ textAlign: 'center', color: '#999', fontSize: '12px' }}>
        测试账号: admin / user1 / company1，密码均为 123456
      </div>
    </Form>
  );

  const registerForm = (
    <Form
      name="register"
      onFinish={handleRegister}
      size="large"
      style={{ maxWidth: 360, margin: '0 auto' }}
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
      <Form.Item
        name="name"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="真实姓名" />
      </Form.Item>
      <Form.Item
        name="idCard"
        rules={[{ required: true, message: '请输入身份证号' }]}
      >
        <Input prefix={<IdcardOutlined />} placeholder="身份证号" />
      </Form.Item>
      <Form.Item
        name="phone"
        rules={[{ required: true, message: '请输入手机号' }]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="手机号" />
      </Form.Item>
      <Form.Item name="type" initialValue="personal">
        <Radio.Group>
          <Radio value="personal">个人用户</Radio>
          <Radio value="legal">法人用户</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注册
        </Button>
      </Form.Item>
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
      <Card
        style={{ width: 450, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', color: '#1890ff' }}>
            省级一体化移动政务服务平台
          </div>
        }
      >
        <Tabs
          activeKey={mode}
          onChange={setMode}
          centered
          items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' }
          ]}
        />
        {mode === 'login' ? loginForm : registerForm}
      </Card>
    </div>
  );
}

export default Login;
