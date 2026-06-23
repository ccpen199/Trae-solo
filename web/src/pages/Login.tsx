import { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: any, role: string) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { ...values, role });
      setAuth(res.data.token, res.data.user);
      message.success('登录成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = ({ role }: { role: string }) => (
    <Form onFinish={(v) => handleLogin(v, role)} size="large">
      <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
        <Input prefix={<UserOutlined />} placeholder="手机号" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const items = [
    { key: 'owner', label: '业主登录', children: <LoginForm role="owner" /> },
    { key: 'merchant', label: '商户登录', children: <LoginForm role="merchant" /> },
    { key: 'property', label: '物业登录', children: <LoginForm role="property" /> },
    { key: 'worker', label: '维修工登录', children: <LoginForm role="worker" /> },
    { key: 'admin', label: '管理员登录', children: <LoginForm role="admin" /> },
  ];

  return (
    <div className="login-container">
      <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ marginBottom: 8, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            智慧社区 SaaS 平台
          </h1>
          <p style={{ color: '#888' }}>社区物业与本地生活融合运营平台</p>
        </div>
        <Tabs items={items} defaultActiveKey="owner" centered />
        <div style={{ textAlign: 'center', marginTop: 16, color: '#999', fontSize: 12 }}>
          测试账号：13800000003（业主）/ 13800000005（商户）/ 13800000000（管理员），密码：123456
        </div>
      </Card>
    </div>
  );
}
