import React, { useState } from 'react';
import { Button, Form, Input, Toast, Dialog } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, School } from 'lucide-react';
import { post } from '../api/client';
import type { LoginRequest, LoginResponse } from '@shared/types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const result = await post<LoginResponse>('/auth/login', values);
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      Toast.show({
        icon: 'success',
        content: '登录成功',
      });

      navigate(from, { replace: true });
    } catch (error: any) {
      Dialog.show({
        title: '登录失败',
        content: error.message || '用户名或密码错误',
        closeOnAction: true,
        actions: [{ key: 'confirm', text: '确定' }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <School className="w-12 h-12 text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">河南省中职学生资助监管服务平台</h1>
          <p className="text-blue-200 text-sm">请登录您的账号</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            initialValues={{ username: 'admin', password: '123456' }}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" clearable />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <div className="flex items-center gap-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  clearable
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="submit"
                block
                color="primary"
                size="large"
                loading={loading}
                className="mt-4 bg-gradient-to-r from-blue-700 to-blue-500"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-4 text-center text-xs text-gray-400">
            <p>测试账号：admin / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
