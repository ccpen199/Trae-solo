import { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, TabsProps } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useUserStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const items: TabsProps['items'] = [
    {
      key: 'login',
      label: '用户登录',
      children: (
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
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            还没有账号？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)',
      }}
    >
      <Card
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
            金种子酒业
          </div>
        }
      >
        <Tabs defaultActiveKey="login" items={items} centered />
      </Card>
    </div>
  );
};

export default LoginPage;
