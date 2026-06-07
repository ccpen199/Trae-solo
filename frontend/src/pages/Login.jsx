import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';

function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.login(values);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.error || '登录失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      setNotice({ type: 'error', text: '两次密码不一致' });
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(values);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.error || '注册失败' });
    } finally {
      setLoading(false);
    }
  };

  const loginItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>测试账号：</p>
            <p>管理员：admin / 123456</p>
            <p>企业用户：enterprise1 / 123456</p>
            <p>个人用户：citizen1 / 123456</p>
          </div>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form onFinish={handleRegister} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="realName" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="真实姓名" size="large" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="idCard" rules={[{ required: true, message: '请输入身份证号' }]}>
            <Input placeholder="身份证号" size="large" />
          </Form.Item>
          <Form.Item name="userType" initialValue="citizen">
            <select style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}>
              <option value="citizen">个人用户</option>
              <option value="enterprise">企业用户</option>
            </select>
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ marginBottom: 8 }}>浙江省一网通办平台</h1>
          <p style={{ color: '#999' }}>让政务服务更便捷</p>
        </div>
        {notice && (
          <div style={{ color: notice.type === 'error' ? '#ff4d4f' : '#52c41a', textAlign: 'center', marginBottom: 12 }}>
            {notice.text}
          </div>
        )}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={loginItems} centered />
      </Card>
    </div>
  );
}

export default Login;
