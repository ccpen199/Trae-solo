import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.message || '登录失败';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    }}>
      <Card 
        style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        title={<div style={{ textAlign: 'center', fontSize: 24, color: '#1890ff' }}>🚚 同城协同平台</div>}
      >
        <Tabs
          defaultActiveKey="employer"
          items={[
            { key: 'employer', label: '雇主登录' },
            { key: 'worker', label: '工人登录' },
            { key: 'driver', label: '司机登录' },
            { key: 'admin', label: '管理员登录' },
          ]}
          onChange={(key) => {
            const demoAccounts: Record<string, { username: string; password: string }> = {
              employer: { username: 'employer1', password: '123456' },
              worker: { username: 'worker1', password: '123456' },
              driver: { username: 'driver1', password: '123456' },
              admin: { username: 'admin', password: 'admin123' },
            };
            form.setFieldsValue(demoAccounts[key]);
          }}
        />

        <Form
          name="login"
          form={form}
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ username: 'employer1', password: '123456' }}
          size="large"
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
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
              size="large"
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
            还没有账号？
            <a onClick={() => navigate('/register')} style={{ color: '#1890ff' }}>立即注册</a>
          </div>
        </Form>

        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: '#f5f5f5', 
          borderRadius: 8,
          fontSize: 12,
          color: '#8c8c8c',
        }}>
          <div style={{ marginBottom: 4, fontWeight: 500, color: '#595959' }}>测试账号：</div>
          <div>雇主: employer1 / 123456</div>
          <div>工人: worker1 / 123456</div>
          <div>司机: driver1 / 123456</div>
          <div>管理员: admin / admin123</div>
        </div>
      </Card>
    </div>
  );
}

export default Login;
