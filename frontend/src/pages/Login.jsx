import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, InsuranceOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values.username, values.password);
      const { user, token } = response.data;
      
      setAuth(user, token);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败');
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <InsuranceOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>保险投保理赔系统</Title>
          <Text type="secondary">多人协同 · 智能核保 · 全链路追溯</Text>
        </div>
        
        <Form
          name="login"
          initialValues={{ username: 'user1', password: 'user123' }}
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
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            测试账号：
          </Text>
          <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.8 }}>
            <Text type="secondary">投保人: user1 / user123</Text><br/>
            <Text type="secondary">代理人: agent1 / agent123</Text><br/>
            <Text type="secondary">核保员: underwriter1 / under123</Text><br/>
            <Text type="secondary">理赔员: claim1 / claim123</Text><br/>
            <Text type="secondary">管理员: admin / admin123</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
