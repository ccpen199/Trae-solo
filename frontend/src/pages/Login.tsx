import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, CarOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      if (res.code === 200) {
        message.success('登录成功');
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (username: string, password: string) => {
    form.setFieldsValue({ username, password });
    handleSubmit({ username, password });
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <CarOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        </div>
        <h1 className="login-title">汽车租赁平台</h1>
        <p className="login-subtitle">Car Rental Management System</p>
        
        <Form form={form} onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>快速登录：</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button size="small" onClick={() => quickLogin('admin', 'admin123')}>运营</Button>
            <Button size="small" onClick={() => quickLogin('risk01', 'risk123')}>风控</Button>
            <Button size="small" onClick={() => quickLogin('service01', 'service123')}>客服</Button>
            <Button size="small" onClick={() => quickLogin('finance01', 'finance123')}>财务</Button>
            <Button size="small" onClick={() => quickLogin('store01', 'store123')}>门店</Button>
            <Button size="small" onClick={() => quickLogin('customer01', 'cust123')}>租客</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
