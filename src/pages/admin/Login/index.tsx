import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import { useAdminStore } from '@/store/adminStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const onFinish = async (values: any) => {
    if (values.captcha.toUpperCase() !== captchaCode) {
      message.error('验证码错误');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res: any = await adminApi.login({
        username: values.username,
        password: values.password,
        captcha: values.captcha,
      });
      if (res.code === 0) {
        await login(values.username, values.password);
        message.success('登录成功');
        navigate('/admin/dashboard');
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const renderCaptcha = () => {
    return (
      <div
        onClick={generateCaptcha}
        className="h-10 px-4 bg-gray-100 rounded cursor-pointer flex items-center justify-center select-none hover:bg-gray-200 transition-colors"
        style={{ minWidth: '100px', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold', color: '#165DFF', fontFamily: 'monospace' }}
        title="点击刷新"
      >
        {captchaCode}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      </div>
      
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl backdrop-blur-sm bg-white/90 relative z-10">
        <div className="text-center mb-8 pt-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">爱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">公用事业客户服务平台</h1>
          <p className="text-gray-500">管理后台登录</p>
        </div>

        <Form
          name="admin_login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          className="px-4"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入用户名"
              className="h-12 rounded-xl"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
              className="h-12 rounded-xl"
            />
          </Form.Item>

          <Form.Item
            name="captcha"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="flex gap-3">
              <Input
                prefix={<SafetyOutlined className="text-gray-400" />}
                placeholder="请输入验证码"
                className="h-12 rounded-xl flex-1"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                maxLength={4}
              />
              {renderCaptcha()}
            </div>
          </Form.Item>

          <Form.Item className="mb-6">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-gray-400 text-sm pb-4">
          <p>测试账号：admin / operator / supervisor / service / finance</p>
          <p className="mt-1">密码：任意</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
