import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Tabs
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import { useUserStore } from '../store/userStore';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { login } = useUserStore();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const result = await authApi.login(values.username, values.password);
      login(result.data.token, result.data.user);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: values.username,
        password: values.password,
        name: values.name,
        email: values.email,
        phone: values.phone,
        studentId: values.studentId,
        department: values.department,
        classId: values.classId
      });
      message.success('注册成功，请登录');
      setActiveTab('login');
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form
      name="login"
      onFinish={handleLogin}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input 
          prefix={<UserOutlined />} 
          placeholder="用户名" 
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
        <p>测试账号：admin / 123456（管理员）</p>
        <p>teacher / 123456（教师）</p>
        <p>monitor / 123456（班长）</p>
        <p>student / 123456（学生）</p>
      </div>
    </Form>
  );

  const registerForm = (
    <Form
      name="register"
      onFinish={handleRegister}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input 
          prefix={<UserOutlined />} 
          placeholder="用户名" 
        />
      </Form.Item>

      <Form.Item
        name="name"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input 
          placeholder="姓名" 
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        rules={[{ required: true, message: '请确认密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="确认密码"
        />
      </Form.Item>

      <Form.Item name="email">
        <Input 
          placeholder="邮箱（选填）" 
        />
      </Form.Item>

      <Form.Item name="phone">
        <Input 
          placeholder="手机号（选填）" 
        />
      </Form.Item>

      <Form.Item name="studentId">
        <Input 
          placeholder="学号（选填）" 
        />
      </Form.Item>

      <Form.Item name="department">
        <Input 
          placeholder="院系（选填）" 
        />
      </Form.Item>

      <Form.Item name="classId">
        <Input 
          placeholder="班级（选填）" 
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: loginForm
    },
    {
      key: 'register',
      label: '注册',
      children: registerForm
    }
  ];

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h2>系部事务管理系统</h2>
          <p>欢迎回来，请登录您的账户</p>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          centered
        />
      </Card>
    </div>
  );
};

export default Login;
