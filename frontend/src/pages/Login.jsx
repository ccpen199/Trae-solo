import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Tabs, Alert } from 'antd';
import { UserOutlined, LockOutlined, FileDoneOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const onLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authApi.register({
        username: values.username,
        password: values.password,
        realName: values.realName
      });
      
      if (response.data.success) {
        message.success('注册成功，请登录');
        setActiveTab('login');
      } else {
        message.error(response.data.message || '注册失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loginFormItems = [
    {
      name: 'username',
      rules: [{ required: true, message: '请输入用户名' }],
      children: <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
    },
    {
      name: 'password',
      rules: [{ required: true, message: '请输入密码' }],
      children: (
        <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
      )
    }
  ];

  const registerFormItems = [
    {
      name: 'username',
      rules: [
        { required: true, message: '请输入用户名' },
        { min: 3, message: '用户名至少3个字符' }
      ],
      children: <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
    },
    {
      name: 'realName',
      rules: [{ required: true, message: '请输入真实姓名' }],
      children: <Input placeholder="真实姓名" size="large" />
    },
    {
      name: 'password',
      rules: [
        { required: true, message: '请输入密码' },
        { min: 6, message: '密码至少6个字符' }
      ],
      children: (
        <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
      )
    },
    {
      name: 'confirmPassword',
      rules: [{ required: true, message: '请确认密码' }],
      children: (
        <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
      )
    }
  ];

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form onFinish={onLogin} layout="vertical">
          {loginFormItems.map((item, index) => (
            <Form.Item key={index} {...item}>
              {item.children}
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form onFinish={onRegister} layout="vertical">
          {registerFormItems.map((item, index) => (
            <Form.Item key={index} {...item}>
              {item.children}
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <FileDoneOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <h1>电子签约系统</h1>
          <p>E-Signature System</p>
        </div>
        
        <Alert
          message="测试账号"
          description={
            <div>
              <p>法务管理员: admin / admin123</p>
              <p>发起方用户: initiator / admin123</p>
              <p>签署方用户: signer / admin123</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} centered />
      </Card>
    </div>
  );
};

export default Login;
