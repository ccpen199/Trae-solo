import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
      message.success('登录成功');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>🔐 企业密码保险库</h1>
          <p style={{ color: '#666' }}>团队密钥和账号凭据托管系统</p>
        </div>
        <Form onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名 / 邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8, fontSize: 12 }}>
          <p style={{ fontWeight: 'bold', marginBottom: 8 }}>测试账号：</p>
          <p>管理员: admin / Admin@123</p>
          <p>普通用户: devops / User@123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
