import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>数据库备份恢复平台</h1>
          <p style={{ color: '#8c8c8c' }}>统一管理数据库备份与恢复任务</p>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
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
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <p style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>测试账号：</p>
          <p style={{ fontSize: 12, margin: 4 }}>平台工程师: admin / admin123</p>
          <p style={{ fontSize: 12, margin: 4 }}>运维: ops_user / ops123</p>
          <p style={{ fontSize: 12, margin: 4 }}>开发: dev_user / dev123</p>
          <p style={{ fontSize: 12, margin: 4 }}>应用负责人: owner_user / owner123</p>
          <p style={{ fontSize: 12, margin: 4 }}>安全管理员: sec_user / sec123</p>
        </div>
      </Card>
    </div>
  );
}

export default Login;
