import { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { login, register, loading } = useUserStore();

  const handleLogin = async (values: { phone: string; password: string }) => {
    try {
      await login(values.phone, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    }
  };

  const handleRegister = async (values: { phone: string; password: string; nickname: string }) => {
    try {
      await register(values.phone, values.password, values.nickname);
      message.success('注册成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || '注册失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100 p-4">
      <Card className="w-full max-w-md shadow-xl" variant="borderless">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">樊登读书</h1>
          <p className="text-gray-500 mt-2">让阅读成为一种生活方式</p>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <Tabs.TabPane tab="登录" key="login">
            <Form name="login" onFinish={handleLogin} autoComplete="off" size="large">
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="手机号" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block className="bg-orange-500 hover:bg-orange-600">
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          <Tabs.TabPane tab="注册" key="register">
            <Form name="register" onFinish={handleRegister} autoComplete="off" size="large">
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="手机号" />
              </Form.Item>

              <Form.Item
                name="nickname"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="昵称" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block className="bg-orange-500 hover:bg-orange-600">
                  注册
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
