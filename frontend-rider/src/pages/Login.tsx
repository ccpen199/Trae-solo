import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form] = Form.useForm();
  const [codeVisible, setCodeVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的手机号');
      return;
    }

    try {
      await authService.sendCode(phone);
      message.success('验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Send code error:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      await login(values.phone, values.password, values.code);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-500 to-blue-600 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">骑手调度平台</h1>
          <p className="text-blue-100">同城跑腿 · 高效配送</p>
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-center mb-6">骑手登录</h2>

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入手机号"
                size="large"
                onChange={(e) => {
                  const value = e.target.value;
                  setCodeVisible(value.length === 11);
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入密码"
                size="large"
              />
            </Form.Item>

            {codeVisible && (
              <Form.Item
                name="code"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <div className="flex gap-2">
                  <Input
                    prefix={<SafetyCertificateOutlined className="text-gray-400" />}
                    placeholder="验证码"
                    size="large"
                    maxLength={6}
                  />
                  <Button
                    type="default"
                    size="large"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    style={{ minWidth: 120 }}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Button>
                </div>
              </Form.Item>
            )}

            <Form.Item>
              <div className="flex justify-between items-center">
                <Checkbox>记住我</Checkbox>
                <a href="#" className="text-blue-500 text-sm">忘记密码？</a>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center text-sm text-gray-500">
            还没有账号？
            <Link to="/register" className="text-blue-500 ml-1">立即注册</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
