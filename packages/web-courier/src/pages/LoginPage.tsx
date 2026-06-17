import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  if (token) return <Navigate to="/" replace />;

  const handle = async (v: any) => {
    setLoading(true);
    try { await login(v.phone, v.password); navigate('/'); }
    catch { /* handled */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #165DFF 0%, #f0f2f5 40%)', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', color: '#fff', marginBottom: 28 }}>
        <div style={{ fontSize: 44 }}>🚚</div>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 22 }}>邮政揽收员工作台</h1>
        <p style={{ opacity: 0.9, marginTop: 6 }}>LBS智能调度 · 工单闭环</p>
      </div>
      <Card style={{ borderRadius: 14, boxShadow: '0 8px 32px rgba(22,93,255,0.12)' }}>
        <Form layout="vertical" onFinish={handle} initialValues={{ phone: '138000003011', password: 'Admin@123456' }}>
          <Form.Item name="phone" rules={[{ required: true, pattern: /^1\d{10}$/ }]}>
            <Input prefix={<MobileOutlined />} placeholder="工号/手机号" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 8 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="登录密码" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录工作台</Button>
        </Form>
      </Card>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#999' }}>
        广东省邮政政务 · 揽收专用系统
      </div>
    </div>
  );
};
export default LoginPage;
