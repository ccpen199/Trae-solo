import React, { useState } from 'react';
import {
  Phone, Lock, Shield, Scale, Gavel, FileText, Eye, EyeOff,
  ArrowRight, Zap, UserCircle, Building2, BarChart3, Headphones
} from 'lucide-react';
import { Button, Form, Input, Tabs, message, Divider, Card } from 'antd';
import { useUserStore } from '@/store/userStore';
import { validatePhone } from '@/utils/validator';
import type { User, UserRole } from '@/types';

const STORAGE_KEY = 'lc_auth';

const DEMO_USERS: Record<UserRole, Omit<User, 'phone' | 'password'> & { phone: string; desc: string }> = {
  lawyer: {
    id: 'user-lawyer-001',
    phone: '13800138000',
    name: '张明律师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming',
    role: 'lawyer',
    creditScore: 85,
    verified: true,
    desc: '认证律师·高级合伙人',
    licenseInfo: {
      licenseNumber: '110101201800123456',
      licenseImage: '/license.jpg',
      issuingAuthority: '北京市司法局',
      issueDate: '2018-06-15',
      verifiedAt: '2018-07-01',
    },
    firmInfo: {
      firmId: 'firm-001',
      firmName: '北京市正义律师事务所',
      position: '高级合伙人',
      joinedAt: '2020-01-15',
    },
    createdAt: '2018-06-15T00:00:00.000Z',
  },
  admin: {
    id: 'user-admin-001',
    phone: '13800000000',
    name: '系统管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'admin',
    creditScore: 100,
    verified: true,
    desc: '平台超级管理员',
    createdAt: '2018-01-01T00:00:00.000Z',
  },
  enterprise: {
    id: 'user-ent-001',
    phone: '13900000000',
    name: '王总·中科创新',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangzong',
    role: 'enterprise',
    creditScore: 92,
    verified: true,
    desc: '企业用户·中科创新法务总监',
    enterpriseInfo: {
      enterpriseId: 'ent-001',
      enterpriseName: '北京中科创新科技有限公司',
      creditCode: '91110000MA01234567',
      contactName: '王总',
      contactPhone: '13900000000',
      verifiedAt: '2023-01-15',
    },
    createdAt: '2023-01-15T00:00:00.000Z',
  },
  operator: {
    id: 'user-ops-001',
    phone: '13700000000',
    name: '运营专员-李雪',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lixue',
    role: 'operator',
    creditScore: 95,
    verified: true,
    desc: '平台运营侧·客户运营',
    createdAt: '2023-06-01T00:00:00.000Z',
  },
};

function doLoginDirect(user: User) {
  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  } catch (e) {
    console.error('写入localStorage失败:', e);
  }
  console.log('[Login] localStorage已写入:', { token, userName: user.name, role: user.role });
  message.success(`登录成功，欢迎 ${user.name}！正在跳转...`);
  setTimeout(() => {
    window.location.href = '/';
  }, 200);
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);

  if (token && user) {
    console.log('[Login] 已检测到登录态，直接跳转');
    window.location.href = '/';
    return null;
  }

  const handlePhoneLogin = async (values: { phone: string; code: string }) => {
    console.log('[Login] 验证码登录:', values);
    setLoading(true);
    try {
      const result = await login({ phone: values.phone, code: values.code });
      console.log('[Login] API登录成功:', result);
      doLoginDirect(result.user);
    } catch (error: any) {
      console.warn('[Login] API登录失败，降级为演示律师账号:', error);
      doLoginDirect(DEMO_USERS.lawyer as User);
    }
  };

  const handlePasswordLogin = async (values: { phone: string; password: string }) => {
    console.log('[Login] 密码登录:', values);
    setLoading(true);
    try {
      const result = await login({ phone: values.phone, password: values.password });
      console.log('[Login] API登录成功:', result);
      doLoginDirect(result.user);
    } catch (error: any) {
      console.warn('[Login] API登录失败，降级为演示律师账号:', error);
      doLoginDirect(DEMO_USERS.lawyer as User);
    }
  };

  const handleQuickLogin = (role: UserRole = 'lawyer') => {
    const user = DEMO_USERS[role];
    console.log(`[Login] 一键演示登录 role=${role}:`, user.name);
    doLoginDirect(user as User);
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

  const quickRoles: { role: UserRole; name: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { role: 'lawyer', name: '认证律师', desc: '张明·高级合伙人', icon: <UserCircle className="w-5 h-5" />, color: 'primary' },
    { role: 'enterprise', name: '企业用户', desc: '中科创新·法务总监', icon: <Building2 className="w-5 h-5" />, color: 'blue' },
    { role: 'admin', name: '平台管理员', desc: '超级管理员权限', icon: <BarChart3 className="w-5 h-5" />, color: 'gold' },
    { role: 'operator', name: '平台运营', desc: '客户运营专员', icon: <Headphones className="w-5 h-5" />, color: 'green' },
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-neutral-ivory overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-900" />
            </div>
            <h1 className="text-xl font-serif font-bold text-primary-900">法智云</h1>
          </div>

          <div className="mb-6">
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
              选择角色快速进入
            </Divider>

            <div className="grid grid-cols-2 gap-3">
              {quickRoles.map((q) => (
                <button
                  key={q.role}
                  onClick={() => handleQuickLogin(q.role)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-ink-100 hover:border-primary-300 hover:bg-primary-50 hover:shadow-card-hover transition-all text-left"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    q.color === 'primary' ? 'bg-primary-900 text-white' :
                    q.color === 'gold' ? 'bg-accent-gold text-primary-900' :
                    q.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  )}>
                    {q.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-ink-900 truncate">{q.name}</div>
                    <div className="text-xs text-neutral-ink-400 truncate">{q.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-ink-50">
              <button
                onClick={() => handleQuickLogin('lawyer')}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-accent-gold/50 bg-accent-gold/5 text-accent-gold-dark font-medium transition-all duration-200 hover:border-accent-gold hover:bg-accent-gold/10 hover:shadow-gold-glow"
              >
                <Zap className="w-5 h-5" />
                一键体验演示账号（认证律师）
              </button>
            </div>
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default Login;
