import React from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { LockOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loc = useLocation();
  const { token, login, register } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  if (token) return <Navigate to="/" replace />;

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      await login(values.phone, values.password);
      message.success('登录成功');
      navigate((loc.state as any)?.from || '/');
    } catch { /* handled */ }
    finally { setLoading(false); }
  };
  const handleRegister = async (values: any) => {
    if (values.password !== values.confirmPassword) { message.error('两次密码不一致'); return; }
    setLoading(true);
    try {
      await register(values.phone, values.password);
      message.success('注册成功，请完成实名认证');
      navigate('/');
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #00B42A 0%, #f5f7fa 40%)', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', color: '#fff', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📮</div>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 24 }}>邮政政务便民服务平台</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>广东省 · 21地市服务</p>
      </div>
      <Card style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,180,42,0.12)' }}>
        <Tabs
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form layout="vertical" onFinish={handleLogin} initialValues={{ phone: '13912345678', password: 'Admin@123456' }}>
                  <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号', pattern: /^1\d{10}$/ }]}>
                    <Input prefix={<MobileOutlined />} placeholder="手机号" size="large" maxLength={11} />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码', min: 8 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>登 录</Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form layout="vertical" onFinish={handleRegister}>
                  <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号', pattern: /^1\d{10}$/ }]}>
                    <Input prefix={<MobileOutlined />} placeholder="手机号" size="large" maxLength={11} />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '密码长度8-32位', min: 8, max: 32 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="设置密码" size="large" />
                  </Form.Item>
                  <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
                    <Input.Password prefix={<SafetyOutlined />} placeholder="确认密码" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>注 册</Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#999' }}>
        登录即表示同意《用户协议》和《隐私政策》
      </div>
    </div>
  );
};

export default LoginPage;
