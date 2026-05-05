import React, { useState } from 'react';
import { Modal, Tabs, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const LoginModal = () => {
  const { showLoginModal, setShowLoginModal, login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showReset, setShowReset] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.login, values.password);
      message.success('Login successful!');
      setShowLoginModal(false);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        name: values.name,
      });
      message.success('Registration successful!');
      setShowLoginModal(false);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.resetPassword(values.email);
      message.success(`Temporary password sent: ${response.data.tempPassword}`);
      setShowReset(false);
      setActiveTab('login');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Reset failed';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form
      name="login"
      onFinish={handleLogin}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        name="login"
        rules={[{ required: true, message: 'Please input your Member ID or Email!' }]}
      >
        <Input 
          prefix={<UserOutlined />} 
          placeholder="Member ID or Email" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Login
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center' }}>
        <a onClick={() => setShowReset(true)} style={{ color: '#1890ff' }}>
          Forgot Password?
        </a>
      </div>
    </Form>
  );

  const registerForm = (
    <Form
      name="register"
      onFinish={handleRegister}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: 'Please input your name!' }]}
      >
        <Input 
          prefix={<UserOutlined />} 
          placeholder="Your Name" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined />} 
          placeholder="Email Address" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { min: 6, message: 'Password must be at least 6 characters!' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password (min 6 characters)"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        rules={[
          { required: true, message: 'Please confirm your password!' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Confirm Password"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Register
        </Button>
      </Form.Item>
    </Form>
  );

  const resetForm = (
    <Form
      name="reset"
      onFinish={handleResetPassword}
      autoComplete="off"
      layout="vertical"
    >
      <p style={{ marginBottom: 20, color: '#666' }}>
        Enter your email address and we'll generate a temporary password for you.
      </p>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined />} 
          placeholder="Email Address" 
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Reset Password
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center' }}>
        <a onClick={() => setShowReset(false)} style={{ color: '#1890ff' }}>
          Back to Login
        </a>
      </div>
    </Form>
  );

  const tabItems = [
    {
      key: 'login',
      label: 'Login',
      children: loginForm,
    },
    {
      key: 'register',
      label: 'Register',
      children: registerForm,
    },
  ];

  return (
    <Modal
      title={showReset ? 'Reset Password' : (activeTab === 'login' ? 'Login to My Favorites' : 'Create Account')}
      open={showLoginModal}
      onCancel={() => {
        setShowLoginModal(false);
        setShowReset(false);
        setActiveTab('login');
      }}
      footer={null}
      width={420}
      destroyOnClose
    >
      {showReset ? (
        resetForm
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          centered
        />
      )}
    </Modal>
  );
};

export default LoginModal;
