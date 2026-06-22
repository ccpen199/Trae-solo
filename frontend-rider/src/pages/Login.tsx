import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, WarningOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

const { Text } = Typography;

const ADMIN_KEYWORDS = ['admin', 'platform', 'ops', 'operator', 'superadmin', 'root', 'manager', '运营', '管理'];

const isAdminKeyword = (input: string): boolean => {
  if (!input) return false;
  const lower = input.toLowerCase().trim();
  return ADMIN_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();
  const [form] = Form.useForm();
  const [codeVisible, setCodeVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminHint, setAdminHint] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCodeVisible(value.length === 11 && /^1\d{10}$/.test(value));
    if (isAdminKeyword(value)) {
      setAdminHint('检测到管理后台账号，请使用骑手手机号（11位手机号码）登录');
    } else {
      setAdminHint(null);
    }
  };

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的11位骑手手机号');
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
    } catch (error: any) {
      console.error('Send code error:', error);
      message.error(error?.message || '验证码发送失败');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoginError(null);
    const phone = String(values.phone || '').trim();

    if (isAdminKeyword(phone)) {
      const errMsg = `「${phone}」为管理后台/运营账号，不允许在此处登录骑手端。请使用骑手手机号码登录。`;
      setLoginError(errMsg);
      message.error(errMsg);
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      const errMsg = '骑手账号必须为11位手机号码，管理账号请前往后台登录入口';
      setLoginError(errMsg);
      message.error(errMsg);
      return;
    }

    try {
      await login(phone, values.password, values.code);
      message.success('登录成功，正在进入骑手工作台');
      const redirect = (location.state as any)?.from || '/';
      setTimeout(() => navigate(redirect, { replace: true }), 300);
    } catch (error: any) {
      const msg = error?.message || '账号或密码错误，请重试';
      setLoginError(msg);
      message.error(msg);
      console.error('Login error:', error);
    }
  };

  const handleDemoLogin = () => {
    form.setFieldsValue({
      phone: '13900000001',
      password: 'rider123',
      code: '123456',
    });
    setAdminHint(null);
    setCodeVisible(true);
    setLoginError(null);
    setTimeout(() => form.submit(), 100);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-500 to-blue-600 flex flex-col">
      {loginError && (
        <Alert
          message={<span className="flex items-center gap-2"><WarningOutlined /> 登录失败</span>}
          description={loginError}
          type="error"
          showIcon
          closable
          onClose={() => setLoginError(null)}
          className="fixed top-0 left-0 right-0 z-50 rounded-none"
        />
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">骑手调度平台</h1>
          <p className="text-blue-100">同城跑腿 · 高效配送 · 骑手专用登录</p>
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-center mb-2">骑手登录</h2>
          <p className="text-center text-sm text-gray-400 mb-6">请使用骑手手机号登录，管理账号请前往后台</p>

          {adminHint && (
            <Alert
              message={adminHint}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              className="mb-4 text-sm"
            />
          )}

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="phone"
              label="骑手手机号"
              rules={[{ required: true, message: '请输入11位骑手手机号' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入11位骑手手机号码"
                size="large"
                maxLength={32}
                onChange={handlePhoneChange}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="登录密码"
              rules={[
                { required: true, message: '请输入登录密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入登录密码"
                size="large"
              />
            </Form.Item>

            {codeVisible && (
              <Form.Item
                name="code"
                label="短信验证码"
                extra="本地演示环境下验证码可留空或输入 123456"
              >
                <div className="flex gap-2">
                  <Input
                    prefix={<SafetyCertificateOutlined className="text-gray-400" />}
                    placeholder="短信验证码"
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
                className="h-12 text-base"
              >
                登录骑手工作台
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-green-50 px-4 py-3 border border-blue-100">
            <Text className="block text-sm text-blue-700 font-medium mb-1">
              <ThunderboltOutlined className="mr-1" />本地演示环境
            </Text>
            <Text className="block text-xs text-gray-600 mb-3">
              演示骑手账号：<b>13900000001</b> / rider123
            </Text>
            <Button
              type="primary"
              ghost
              block
              className="h-10"
              onClick={handleDemoLogin}
              disabled={loading}
              icon={<ThunderboltOutlined />}
            >
              一键进入骑手演示工作台
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100">
            还没有骑手账号？
            <Link to="/register" className="text-blue-500 ml-1">立即注册骑手</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
