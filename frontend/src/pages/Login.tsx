import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Tabs, Select, message, Alert, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '@/utils/api';
import { setToken, setUser } from '@/utils/auth';

type LoginForm = {
  username: string;
  password: string;
};

type RegisterForm = {
  username: string;
  password: string;
  name: string;
  role: string;
  phone: string;
  email: string;
};

const roleOptions = [
  { value: 'owner', label: '业主' },
  { value: 'designer', label: '设计师' },
  { value: 'company', label: '装修公司' },
  { value: 'supplier', label: '供应商' }
];

const roleRouteMap: Record<string, string> = {
  admin: '/dashboard',
  owner: '/dashboard',
  designer: '/designs',
  company: '/quotations',
  supplier: '/materials'
};

const demoAccounts = [
  { label: '管理员', username: 'admin', password: 'Admin@123', role: 'admin', color: '#722ed1' },
  { label: '业主', username: 'owner1', password: '123456', role: 'owner', color: '#1677ff' },
  { label: '设计师', username: 'designer1', password: '123456', role: 'designer', color: '#13c2c2' },
  { label: '装修公司', username: 'company1', password: '123456', role: 'company', color: '#eb2f96' },
  { label: '供应商', username: 'supplier1', password: '123456', role: 'supplier', color: '#fa8c16' },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginForm] = Form.useForm<LoginForm>();
  const [registerForm] = Form.useForm<RegisterForm>();
  const navigate = useNavigate();

  async function handleLogin(values: LoginForm) {
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      const { token, user } = res.data.data;
      if (!token || !user) {
        setLoginError('服务器响应异常，请稍后重试');
        return;
      }
      setToken(token);
      setUser(user);
      message.success(`欢迎回来，${user.name || user.username}！`);
      const targetRoute = roleRouteMap[user.role] || '/dashboard';
      navigate(targetRoute);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;
      let errMsg = '登录失败，请检查用户名和密码';
      if (status === 401) {
        errMsg = serverMsg || '用户名或密码错误，请核实后重试';
      } else if (status === 400) {
        errMsg = serverMsg || '请输入用户名和密码';
      } else if (status === 500) {
        errMsg = '服务器异常，请稍后重试';
      } else if (!err?.response) {
        errMsg = '网络连接失败，请检查网络后重试';
      }
      setLoginError(errMsg);
      message.error(errMsg);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleQuickLogin(username: string, password: string) {
    loginForm.setFieldsValue({ username, password });
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data.data;
      setToken(token);
      setUser(user);
      message.success(`欢迎回来，${user.name || user.username}！`);
      const targetRoute = roleRouteMap[user.role] || '/dashboard';
      navigate(targetRoute);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error;
      const errMsg = serverMsg || '快速登录失败';
      setLoginError(errMsg);
      message.error(errMsg);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(values: RegisterForm) {
    setRegisterLoading(true);
    try {
      await api.post('/auth/register', values);
      message.success('注册成功，请使用新账号登录');
      setActiveTab('login');
      loginForm.setFieldsValue({ username: values.username, password: '' });
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error;
      message.error(serverMsg || '注册失败，请稍后重试');
    } finally {
      setRegisterLoading(false);
    }
  }

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <div>
          {loginError && (
            <Alert
              message={loginError}
              type="error"
              showIcon
              closable
              onClose={() => setLoginError('')}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form form={loginForm} onFinish={handleLogin} size="large" style={{ marginTop: 8 }}>
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loginLoading} block size="large">
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '20px 0 16px', color: '#999', fontSize: 13 }}>
            <SafetyCertificateOutlined style={{ marginRight: 4 }} />演示账号快速登录
          </Divider>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {demoAccounts.map((acc) => (
              <Button
                key={acc.username}
                size="small"
                style={{ borderColor: acc.color, color: acc.color }}
                loading={loginLoading}
                onClick={() => handleQuickLogin(acc.username, acc.password)}
              >
                {acc.label}
              </Button>
            ))}
          </div>
          <div style={{ marginTop: 12, color: '#8c8c8c', fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>
            admin:Admin@123 / platform:Platform@123 / ops:Ops@123 / owner1:123456 / designer1:123456
          </div>
        </div>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form form={registerForm} onFinish={handleRegister} size="large" style={{ marginTop: 8 }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="姓名" />
          </Form.Item>
          <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="选择角色" options={roleOptions} />
          </Form.Item>
          <Form.Item name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item name="email">
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={registerLoading} block>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Card
        style={{
          width: 440,
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
        }}
        styles={{ body: { padding: '32px 32px 24px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1f2937' }}>家装协同平台</h1>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>
            设计 · 报价 · 材料 · 验收 一体化管理
          </p>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setLoginError(''); }}
          items={tabItems}
          centered
          size="large"
        />
      </Card>
    </div>
  );
}
