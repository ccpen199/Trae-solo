import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = await login(values.username, values.password);
      message.success('登录成功！');
      
      if (user.roles?.some(r => ['admin', 'operator', 'finance', 'tech_lead'].includes(r.name))) {
        navigate('/dashboard');
      } else {
        navigate('/plans');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <h1 className="login-title">订阅计费系统</h1>
        <Form
          name="login"
          onFinish={onFinish}
          initialValues={{ username: 'user1', password: '123456' }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名 / 邮箱" 
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
        
        <div style={{ marginTop: 24, textAlign: 'center', color: '#666', fontSize: 12 }}>
          <p>测试账号：</p>
          <p>订阅用户: user1 / 123456</p>
          <p>运营经理: operator1 / 123456</p>
          <p>财务专员: finance1 / 123456</p>
          <p>技术负责人: tech1 / 123456</p>
          <p>管理员: admin / 123456</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
