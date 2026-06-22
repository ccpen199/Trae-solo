import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Phone, Lock, Shield, Scale, Gavel, FileText, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import { Button, Form, Input, Tabs, message, Divider } from 'antd';
import { useUserStore } from '@/store/userStore';
import { validatePhone } from '@/utils/validator';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, quickLogin, token, user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  const redirectTo = (location.state as any)?.from || '/';

  const handlePhoneLogin = async (values: { phone: string; code: string }) => {
    setLoading(true);
    try {
      await login({ phone: values.phone, code: values.code });
      message.success('登录成功');
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      await login({ phone: values.phone, password: values.password });
      message.success('登录成功');
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    quickLogin();
    message.success('演示登录成功');
    navigate(redirectTo, { replace: true });
  };

  const handleSendCode = (phone: string) => {
    if (!validatePhone(phone)) {
      message.error('请输入正确的手机号');
      return;
    }
    setCodeSent(true);
    setCountdown(60);
    message.success('验证码已发送（测试验证码：123456）');
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCodeSent(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const tabItems = [
    {
      key: 'phone',
      label: '验证码登录',
      children: (
        <Form
          name="phone_login"
          layout="vertical"
          onFinish={handlePhoneLogin}
          className="pt-4"
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { validator: (_, value) => validatePhone(value) ? Promise.resolve() : Promise.reject(new Error('请输入正确的手机号')) }
            ]}
          >
            <Input
              size="large"
              prefix={<Phone className="w-4 h-4 text-neutral-ink-400" />}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="验证码"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="flex gap-3">
              <Input
                size="large"
                prefix={<Shield className="w-4 h-4 text-neutral-ink-400" />}
                placeholder="请输入验证码"
                maxLength={6}
                style={{ flex: 1 }}
              />
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) => (
                  <Button
                    size="large"
                    disabled={codeSent}
                    onClick={() => handleSendCode(getFieldValue('phone'))}
                    style={{ minWidth: 120 }}
                  >
                    {codeSent ? `${countdown}s` : '获取验证码'}
                  </Button>
                )}
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="h-11 font-medium"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'password',
      label: '密码登录',
      children: (
        <Form
          name="password_login"
          layout="vertical"
          onFinish={handlePasswordLogin}
          className="pt-4"
          initialValues={{ phone: '13800138000', password: '123456' }}
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { validator: (_, value) => validatePhone(value) ? Promise.resolve() : Promise.reject(new Error('请输入正确的手机号')) }
            ]}
          >
            <Input
              size="large"
              prefix={<Phone className="w-4 h-4 text-neutral-ink-400" />}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              size="large"
              prefix={<Lock className="w-4 h-4 text-neutral-ink-400" />}
              placeholder="请输入密码"
              iconRender={(visible) => (visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />)}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="h-11 font-medium"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 primary-gradient" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-accent-gold blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-500 blur-3xl" />
        </div>
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
              <Scale className="w-7 h-7 text-primary-900" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-gold-gradient">法智云</h1>
              <p className="text-xs text-neutral-ink-400">LegalCloud SaaS Platform</p>
            </div>
          </div>

          <div className="text-white space-y-6">
            <h2 className="text-4xl font-serif font-bold leading-tight">
              赋能法律从业者<br />
              <span className="text-gold-gradient">一站式数字化解决方案</span>
            </h2>
            <p className="text-neutral-ink-300 text-lg leading-relaxed max-w-md">
              整合100+结构化数据源，连接律师与案源，提供智能办案协作与专业法律工具
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <Scale className="w-6 h-6 text-accent-gold mb-2" />
                <div className="text-2xl font-serif font-bold text-white mb-1">100+</div>
                <div className="text-xs text-neutral-ink-400">结构化数据源</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <Gavel className="w-6 h-6 text-accent-gold mb-2" />
                <div className="text-2xl font-serif font-bold text-white mb-1">50K+</div>
                <div className="text-xs text-neutral-ink-400">认证律师</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <FileText className="w-6 h-6 text-accent-gold mb-2" />
                <div className="text-2xl font-serif font-bold text-white mb-1">98%</div>
                <div className="text-xs text-neutral-ink-400">用户满意度</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-ink-500">
            <span>© 2024 法智云 LegalCloud</span>
            <span>京ICP备XXXXXXXX号</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-neutral-ivory">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-900" />
            </div>
            <h1 className="text-xl font-serif font-bold text-primary-900">法智云</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-primary-900 mb-2">欢迎回来</h2>
            <p className="text-neutral-ink-500">登录您的账户，开启智能法律服务</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-neutral-ink-100 p-6 relative">
            <div className="absolute top-0 right-8 w-20 h-1 gold-gradient rounded-b-lg" />
            <Tabs
              defaultActiveKey="phone"
              items={tabItems}
              size="large"
              className="login-tabs"
            />

            <Divider style={{ margin: '12px 0 16px', color: '#ADB5BD', fontSize: 12 }}>
              或
            </Divider>

            <button
              onClick={handleQuickLogin}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-accent-gold/50 bg-accent-gold/5 text-accent-gold-dark font-medium transition-all duration-200 hover:border-accent-gold hover:bg-accent-gold/10 hover:shadow-gold-glow"
            >
              <Zap className="w-5 h-5" />
              一键体验演示账号
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-ink-500 mb-3">
              还没有账号？
              <span className="text-primary-500 font-medium cursor-pointer hover:underline ml-1">
                立即注册成为认证律师
                <ArrowRight className="w-4 h-4 inline ml-1" />
              </span>
            </p>
            <p className="text-xs text-neutral-ink-400">
              登录即表示您同意《服务协议》和《隐私政策》
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
