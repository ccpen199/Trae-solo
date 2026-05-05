import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    try {
      const result = await login(values.username, values.password);
      message.success('登录成功');
      
      if (result.data?.user?.user_type === 'admin' || 
          result.data?.user?.Roles?.some(r => r.code === 'super_admin' || r.code === 'admin')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ margin: 0 }}>用户登录</Title>
          <Text type="secondary">欢迎回来，请登录您的账户</Text>
        </div>
        
        <Form
          form={form}
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
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              还没有账户？ <Link to="/register">立即注册</Link>
            </Text>
          </div>
        </Form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <p>测试账号：</p>
            <p>管理员：admin / admin123</p>
            <p>普通用户：test / test123</p>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;