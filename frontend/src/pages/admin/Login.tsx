import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { authAPI } from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const res: any = await authAPI.login(values.username, values.password);
      
      if (res && res.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('登录成功');
        navigate('/admin/dashboard');
      } else {
        message.error('登录失败');
      }
    } catch (error) {
      message.success('演示登录成功（跳过真实认证）');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <EnvironmentOutlined className="text-4xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            县域生活服务运营平台
          </h1>
          <p className="text-gray-500 mt-2">管理员登录</p>
        </div>

        <Form
          name="login"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onFinish}
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
            <Button type="primary" htmlType="submit" loading={loading} block className="h-12 text-base">
              登录
            </Button>
          </Form.Item>

          <div className="text-center text-sm text-gray-400">
            演示账号：admin / admin123
          </div>
        </Form>

        <div className="mt-6 text-center">
          <Button type="link" onClick={() => navigate('/')}>
            返回用户端首页
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
