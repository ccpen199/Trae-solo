import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

function Login({ setUser }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    try {
      const res = await authAPI.login(values);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      message.success('登录成功');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>🎫 票务中台</h1>
          <p style={{ color: '#666' }}>欢迎回来，请登录您的账户</p>
        </div>
        <Form
          form={form}
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名/邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ height: 44 }}>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#666' }}>
            还没有账户？<Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
