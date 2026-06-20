import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Button, Card, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import type { UserRole, AuthErrorCode, AuthError } from '@shared/types';
import { User, Lock, Eye, EyeOff, Check, MessageCircle, Smartphone, ArrowRight, Mail, Phone, Shield, Award, Video, Key, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoginMode = 'login' | 'register';
type RoleTab = 'talent' | 'hr' | 'admin';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  verifyCode?: string;
}

interface AuthErrorInfo {
  message: string;
  code: AuthErrorCode;
  suggestion?: string;
}

const testAccounts = [
  { role: 'admin' as const, email: 'admin@platform.com', password: '123456', name: '系统管理员' },
  { role: 'hr' as const, email: 'hr@hotelgroup.com', password: '123456', name: '张经理' },
  { role: 'talent' as const, email: 'talent1@example.com', password: '123456', name: '王小明' },
];

const getErrorSuggestion = (code: AuthErrorCode): string => {
  switch (code) {
    case 'USER_NOT_FOUND':
      return '请检查邮箱/手机号是否正确，或切换到注册模式创建新账号';
    case 'INVALID_PASSWORD':
      return '请确认密码是否正确，默认密码为 123456';
    case 'ROLE_MISMATCH':
      return '请在上方选择与账号匹配的角色标签（求职者/HR/管理员）';
    case 'ACCOUNT_LOCKED':
      return '请联系客服解锁账号';
    default:
      return '请检查网络连接后重试';
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, login, register, loading } = useAuthStore();
  const from = (location.state as any)?.from?.pathname || '/';

  const [mode, setMode] = useState<LoginMode>('login');
  const [role, setRole] = useState<RoleTab>('talent');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    verifyCode: '',
  });

  useEffect(() => {
    setErrors({});
    setAuthError(null);
  }, [mode, role]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (mode === 'register') {
      if (!formData.name.trim()) {
        newErrors.name = '请输入姓名';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = '请输入手机号';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = '请输入正确的手机号';
      }
      if (!formData.email.trim()) {
        newErrors.email = '请输入邮箱';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = '请输入正确的邮箱格式';
      }
      if (!formData.password) {
        newErrors.password = '请输入密码';
      } else if (formData.password.length < 6) {
        newErrors.password = '密码至少6位';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致';
      }
      if (!formData.verifyCode.trim()) {
        newErrors.verifyCode = '请输入验证码';
      }
    } else {
      const loginField = formData.email || formData.phone;
      if (!loginField.trim()) {
        newErrors.email = '请输入邮箱或手机号';
      }
      if (!formData.password) {
        newErrors.password = '请输入密码';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setAuthError(null);

    try {
      if (mode === 'login') {
        const loginId = formData.email || formData.phone;
        await login(loginId, formData.password, role as UserRole);
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: role as UserRole,
        });
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const redirectPath = currentUser.role === 'hr' 
          ? '/' 
          : currentUser.role === 'admin'
          ? '/admin/companies'
          : '/jobs';
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error instanceof Error && 'code' in error) {
        const authError = error as AuthError;
        setAuthError({
          message: authError.message,
          code: authError.code,
          suggestion: getErrorSuggestion(authError.code),
        });
      } else if (error instanceof Error) {
        setAuthError({
          message: error.message,
          code: 'NETWORK_ERROR',
          suggestion: getErrorSuggestion('NETWORK_ERROR'),
        });
      } else {
        setAuthError({
          message: '登录失败，请稍后重试',
          code: 'NETWORK_ERROR',
          suggestion: getErrorSuggestion('NETWORK_ERROR'),
        });
      }
    }
  };

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setFormData({
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      name: '',
      verifyCode: '',
    });
    setAuthError(null);
  };

  const fillTestAccount = (account: typeof testAccounts[0]) => {
    setRole(account.role);
    setFormData(prev => ({
      ...prev,
      email: account.email,
      password: account.password,
    }));
    setShowTestAccounts(false);
    setAuthError(null);
  };

  if (isAuthenticated) {
    const redirectPath = user?.role === 'hr' 
      ? '/' 
      : user?.role === 'admin'
      ? '/admin/companies'
      : '/jobs';
    return <Navigate to={redirectPath} replace />;
  }

  const roleTabs: { key: RoleTab; label: string; icon: string }[] = [
    { key: 'talent', label: '我是求职者', icon: '👤' },
    { key: 'hr', label: '我是HR', icon: '💼' },
    { key: 'admin', label: '我是管理员', icon: '🛡️' },
  ];

  const features = [
    { icon: <Shield className="text-accent-400" size={24} />, title: 'AI智能匹配', desc: '95%+ 匹配准确率' },
    { icon: <Award className="text-mint-400" size={24} />, title: '真实企业认证', desc: '10万+ 靠谱企业' },
    { icon: <Video className="text-primary-400" size={24} />, title: '视频简历', desc: '全方位展示自我' },
    { icon: <Key className="text-accent-400" size={24} />, title: '加密通讯', desc: '保护您的隐私' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-mint-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-8 lg:p-16 text-white">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">智聘云</h1>
              <p className="text-sm text-white/60">Talent Match Platform</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center animate-slide-up">
            <div className="mb-8">
              <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                智能匹配，
                <br />
                <span className="bg-gradient-to-r from-mint-300 via-white to-accent-300 bg-clip-text text-transparent">
                  精准对接
                </span>
                <br />
                开启职业新篇章
              </h2>
              <p className="text-lg text-white/70 max-w-md mt-6">
                基于AI的智能人才匹配系统，连接优秀人才与优质企业，让每一次相遇都恰到好处。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="mb-2">{feature.icon}</div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60 mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-sm text-white/40 animate-fade-in">
            © 2024 智聘云 TalentMatch. All rights reserved.
          </div>
        </div>
      </div>

      <div className="lg:w-1/2 bg-white flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-primary-800 mb-2">
              {mode === 'login' ? '欢迎回来' : '创建账号'}
            </h2>
            <p className="text-neutral-500">
              {mode === 'login' ? '请登录您的账号以继续' : '填写信息完成注册，开启职业新旅程'}
            </p>
          </div>

          <div className="flex bg-neutral-100 rounded-xl p-1 mb-8">
            {roleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRole(tab.key)}
                className={cn(
                  'flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                  role === tab.key
                    ? 'bg-white text-primary-700 shadow-md'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {authError && (
              <div className={cn(
                'p-4 rounded-xl border-2 bg-red-50/50 backdrop-blur-sm',
                authError.code === 'USER_NOT_FOUND' && 'border-orange-200',
                authError.code === 'INVALID_PASSWORD' && 'border-orange-200',
                authError.code === 'ROLE_MISMATCH' && 'border-primary-200',
                authError.code === 'NETWORK_ERROR' && 'border-neutral-200',
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    authError.code === 'ROLE_MISMATCH' ? 'bg-primary-100 text-primary-600' :
                    authError.code === 'NETWORK_ERROR' ? 'bg-neutral-100 text-neutral-600' :
                    'bg-orange-100 text-orange-600'
                  )}>
                    <AlertCircle size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-neutral-800">{authError.message}</h4>
                      <button
                        type="button"
                        onClick={() => setAuthError(null)}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {authError.suggestion && (
                      <p className="text-sm text-neutral-500 mt-1 flex items-start gap-1.5">
                        <Info size={14} className="mt-0.5 flex-shrink-0" />
                        {authError.suggestion}
                      </p>
                    )}
                    <div className="mt-2.5 text-xs">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium',
                        authError.code === 'USER_NOT_FOUND' && 'bg-orange-100 text-orange-700',
                        authError.code === 'INVALID_PASSWORD' && 'bg-orange-100 text-orange-700',
                        authError.code === 'ROLE_MISMATCH' && 'bg-primary-100 text-primary-700',
                        authError.code === 'NETWORK_ERROR' && 'bg-neutral-100 text-neutral-700',
                      )}>
                        错误代码: {authError.code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <User size={14} /> 姓名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all outline-none',
                    errors.name
                      ? 'border-accent-300 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'
                      : 'border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                  )}
                  placeholder="请输入您的姓名"
                />
                {errors.name && <p className="text-sm text-accent-500">{errors.name}</p>}
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Phone size={14} /> 手机号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all outline-none',
                    errors.phone
                      ? 'border-accent-300 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'
                      : 'border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                  )}
                  placeholder="请输入手机号"
                />
                {errors.phone && <p className="text-sm text-accent-500">{errors.phone}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Mail size={14} /> {mode === 'login' ? '邮箱/手机号' : '邮箱'}
              </label>
              <input
                type={mode === 'login' ? 'text' : 'email'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border transition-all outline-none',
                  errors.email
                    ? 'border-accent-300 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'
                    : 'border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                )}
                placeholder={mode === 'login' ? '请输入邮箱或手机号' : '请输入邮箱地址'}
              />
              {errors.email && <p className="text-sm text-accent-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Lock size={14} /> 密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-xl border transition-all outline-none',
                    errors.password
                      ? 'border-accent-300 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'
                      : 'border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                  )}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-accent-500">{errors.password}</p>}
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Lock size={14} /> 确认密码
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={cn(
                        'w-full px-4 py-3 pr-12 rounded-xl border transition-all outline-none',
                        errors.confirmPassword
                          ? 'border-accent-300 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'
                          : 'border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                      )}
                      placeholder="请再次输入密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-accent-500">{errors.confirmPassword}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Shield size={14} /> 验证码
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.verifyCode}
                      onChange={(e) => setFormData({ ...formData, verifyCode: e.target.value })}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-xl border transition-all outline-none',
                        errors.verifyCode
                          ? 'border-accent-300 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'
                          : 'border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
                      )}
                      placeholder="请输入验证码"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      className="px-4 py-3 bg-primary-50 text-primary-600 rounded-xl font-medium text-sm hover:bg-primary-100 transition-colors whitespace-nowrap"
                    >
                      获取验证码
                    </button>
                  </div>
                  {errors.verifyCode && <p className="text-sm text-accent-500">{errors.verifyCode}</p>}
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-sm text-neutral-600">记住我</span>
                </label>
                <button type="button" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  忘记密码？
                </button>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-6">
              {mode === 'login' ? '登录' : '立即注册'}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-sm text-neutral-400">或</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <MessageCircle size={20} className="text-green-500" />
              <span className="text-sm font-medium text-neutral-700">微信登录</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <Smartphone size={20} className="text-mint-500" />
              <span className="text-sm font-medium text-neutral-700">手机快捷登录</span>
            </button>
          </div>

          <div className="mt-6">
            {!showTestAccounts ? (
              <button
                type="button"
                onClick={() => setShowTestAccounts(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-neutral-500 hover:text-primary-600 transition-colors"
              >
                <Key size={14} />
                查看测试账号
              </button>
            ) : (
              <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-primary-800 flex items-center gap-2">
                    <Key size={14} />
                    测试账号（点击一键填充）
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowTestAccounts(false)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {testAccounts.map((account) => (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => fillTestAccount(account)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                        role === account.role
                          ? 'bg-white border-primary-300 shadow-sm'
                          : 'bg-white/50 border-primary-100 hover:border-primary-300 hover:bg-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold',
                          account.role === 'admin' && 'bg-primary-500',
                          account.role === 'hr' && 'bg-mint-500',
                          account.role === 'talent' && 'bg-accent-500',
                        )}>
                          {account.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{account.name}</p>
                          <p className="text-xs text-neutral-500">{account.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          'inline-block px-2 py-0.5 rounded text-xs font-medium',
                          account.role === 'admin' && 'bg-primary-100 text-primary-700',
                          account.role === 'hr' && 'bg-mint-100 text-mint-700',
                          account.role === 'talent' && 'bg-accent-100 text-accent-700',
                        )}>
                          {account.role === 'admin' ? '管理员' : account.role === 'hr' ? 'HR' : '求职者'}
                        </span>
                        <p className="text-xs text-neutral-400 mt-0.5">密码: {account.password}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-neutral-500 flex items-start gap-1.5">
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  所有测试账号的默认密码均为 123456，请务必选择与账号匹配的角色标签
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-500">
              {mode === 'login' ? '还没有账号？' : '已有账号？'}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-primary-500 hover:text-primary-600 font-semibold ml-1 transition-colors"
              >
                {mode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
