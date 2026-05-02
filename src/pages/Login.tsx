import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authAPI } from '../services/api';
import { setCredentials } from '../store/slices/authSlice';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authAPI.login(values.username, values.password);
      dispatch(setCredentials({
        user: response.data.user,
        token: response.data.token
      }));
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: '运营', username: 'operation', password: 'password123' },
    { role: '采购', username: 'purchase', password: 'password123' },
    { role: '仓库', username: 'warehouse', password: 'password123' },
    { role: '客服', username: 'customer_service', password: 'password123' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{ width: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8, color: '#333' }}>跨境电商店铺管理系统</h1>
          <p style={{ color: '#666' }}>Cross-Border E-commerce Platform</p>
        </div>

        <Form
          name="login"
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
              style={{ width: '100%' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Tabs
          defaultActiveKey="demo"
          items={[{
            key: 'demo',
            label: '体验账号',
            children: (
              <div>
                {demoAccounts.map(account => (
                  <div
                    key={account.username}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      marginBottom: 8,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      onFinish({ username: account.username, password: account.password });
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{account.role}</span>
                    <span style={{ color: '#999', fontSize: 12 }}>{account.username}</span>
                  </div>
                ))}
                <p style={{ color: '#999', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                  点击即可快速登录体验
                </p>
              </div>
            )
          }]}
        />
      </Card>
    </div>
  );
};

export default Login;