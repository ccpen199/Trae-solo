import { Form, Input, Button, Card, Tabs, Typography, message, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';
import { useAppStore } from '../store';

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAppStore(s => s.setAuth);
  const [loading, setLoading] = useState(false);
  const { message: msg } = App.useApp();

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', values) as any;
      setAuth(data.token, data.user);
      msg.success('登录成功');
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (e: any) {
      msg.error(e.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', values) as any;
      setAuth(data.token, data.user);
      msg.success('注册成功');
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      msg.error(e.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ width: 440, borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>企业招聘与内训工作台</Title>
          <Text type="secondary">智能匹配 · 职场社区 · 在线学习</Text>
        </div>
        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            {
              key: 'login', label: '登录',
              children: (
                <Form onFinish={onLogin} layout="vertical">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名/邮箱" size="large" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>登录</Button>
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Text type="secondary">测试账号：admin / hr01 / trainer01 / seeker01，密码均为 123456</Text>
                  </div>
                </Form>
              )
            },
            {
              key: 'register', label: '注册',
              children: (
                <Form onFinish={onRegister} layout="vertical">
                  <Form.Item name="username" rules={[{ required: true }]} label="用户名">
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="name" rules={[{ required: true }]} label="姓名">
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email' }]} label="邮箱">
                    <Input prefix={<MailOutlined />} size="large" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6 }]} label="密码">
                    <Input.Password prefix={<LockOutlined />} size="large" />
                  </Form.Item>
                  <Form.Item name="role" label="选择角色" initialValue="jobseeker">
                    <select className="ant-input" style={{ height: 40, width: '100%', borderRadius: 6, border: '1px solid #d9d9d9', padding: '0 11px' }}>
                      <option value="jobseeker">个人求职者</option>
                      <option value="hr">HR招聘专员</option>
                      <option value="trainer">培训管理员</option>
                    </select>
                  </Form.Item>
                  <Form.Item name="tenantName" label="企业名称（企业用户填写）">
                    <Input size="large" placeholder="可选" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>注册</Button>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
