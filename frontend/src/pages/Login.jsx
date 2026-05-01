import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import { useAuthStore } from '../store';

const { TabPane } = Tabs;

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: '平台管理员' },
    { username: 'streamer1', password: 'streamer123', role: '主播' },
    { username: 'merchant1', password: 'merchant123', role: '商家' },
    { username: 'viewer1', password: 'viewer123', role: '观众' }
  ];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await authApi.login(values.username, values.password);
      
      if (result.success) {
        setAuth(result.data.token, result.data.user);
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(result.error?.message || '登录失败');
      }
    } catch (error) {
      message.error(error.error?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1 className="login-title">直播带货系统</h1>
        
        <Tabs defaultActiveKey="login">
          <TabPane tab="登录" key="login">
            <Form
              name="login"
              initialValues={{ username: '', password: '' }}
              onFinish={onFinish}
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
                  loading={loading}
                  block
                  size="large"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>

        <div className="form-footer">
          还没有账号？ <Link to="/register">立即注册</Link>
        </div>

        <Card size="small" style={{ marginTop: 24, background: '#fafafa' }}>
          <h4 style={{ marginBottom: 12, fontWeight: 'bold' }}>演示账号</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {demoAccounts.map((account, index) => (
              <div 
                key={index}
                style={{ 
                  padding: 8, 
                  background: '#fff', 
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                  border: '1px solid #e8e8e8'
                }}
                onClick={() => {
                  document.querySelector('input[name="username"]').value = account.username;
                  document.querySelector('input[name="password"]').value = account.password;
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{account.role}</div>
                <div style={{ color: '#666' }}>{account.username} / {account.password}</div>
              </div>
            ))}
          </div>
        </Card>
      </Card>
    </div>
  );
}

export default Login;
