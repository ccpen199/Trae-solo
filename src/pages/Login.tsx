import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useI18nStore } from '@/store/i18n';
import { Globe, Eye, EyeOff, Shield, UserCircle, Calculator, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const demoAccounts = [
  {
    alias: 'admin',
    email: 'admin@ausproperty.com',
    password: 'admin123',
    role: 'admin',
    name: '系统管理员',
    nameEn: 'System Administrator',
    icon: Shield,
    description: '拥有所有模块的完全访问权限',
    descriptionEn: 'Full access to all modules',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    aliases: ['admin', 'platform', 'ops', 'sysadmin', 'administrator'],
  },
  {
    alias: 'accountant',
    email: 'accountant@ausproperty.com',
    password: 'acc123',
    role: 'accountant',
    name: '张会计师',
    nameEn: 'Accountant Zhang',
    icon: Calculator,
    description: '可访问财务、税务、报告模块',
    descriptionEn: 'Access to finance, tax and reports',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    aliases: ['accountant', 'acc', 'finance', 'tax'],
  },
  {
    alias: 'owner',
    email: 'owner1@example.com',
    password: 'user123',
    role: 'user',
    name: '李业主',
    nameEn: 'Owner Li',
    icon: Users,
    description: '可查看个人资产和预约服务',
    descriptionEn: 'View personal assets and book services',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    aliases: ['owner', 'user', 'landlord', 'investor', 'test'],
  },
];

const allAliases: Record<string, typeof demoAccounts[0]> = {};
demoAccounts.forEach(acc => {
  acc.aliases.forEach(alias => {
    allAliases[alias] = acc;
  });
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'email' | 'password' | 'general' | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, register, token, user } = useAuthStore();
  const { language, setLanguage, t, loadTranslations } = useI18nStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    loadTranslations(language);
  }, [language, loadTranslations]);

  const validateForm = () => {
    if (!email.trim()) {
      setError(language === 'zh' ? '请输入账号或邮箱地址' : 'Please enter your account or email');
      setErrorType('email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = email.includes('@');
    if ((mode === 'register' || isEmail) && !emailRegex.test(email)) {
      setError(language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email');
      setErrorType('email');
      return false;
    }
    if (mode === 'login' && !isEmail && email.trim().length < 3) {
      setError(language === 'zh' ? '账号长度至少为3位' : 'Account must be at least 3 characters');
      setErrorType('email');
      return false;
    }
    if (mode === 'register' && !fullName.trim()) {
      setError(language === 'zh' ? '请输入姓名' : 'Please enter your full name');
      setErrorType('general');
      return false;
    }
    if (!password) {
      setError(language === 'zh' ? '请输入密码' : 'Please enter your password');
      setErrorType('password');
      return false;
    }
    if (password.length < 6) {
      setError(language === 'zh' ? '密码长度至少为6位' : 'Password must be at least 6 characters');
      setErrorType('password');
      return false;
    }
    return true;
  };

  const getErrorMessage = (status: number, errorMsg: string) => {
    const availableAccounts = demoAccounts.map(a => 
      language === 'zh' 
        ? `• ${a.name} (${a.aliases.join('/')}) - ${a.email}` 
        : `• ${a.nameEn} (${a.aliases.join('/')}) - ${a.email}`
    ).join('\n');

    const availableHint = language === 'zh'
      ? `\n\n可用演示账号：\n${availableAccounts}\n\n密码：admin123 / acc123 / user123`
      : `\n\nAvailable demo accounts:\n${availableAccounts}\n\nPasswords: admin123 / acc123 / user123`;

    if (status === 400) {
      return {
        message: (language === 'zh' ? '请填写邮箱和密码' : 'Please enter email and password') + availableHint,
        type: 'general' as const,
      };
    }
    if (status === 401) {
      if (errorMsg.includes('password')) {
        return {
          message: (language === 'zh' ? '密码错误，请重新输入' : 'Incorrect password, please try again') + availableHint,
          type: 'password' as const,
        };
      }
      if (errorMsg.includes('email') || errorMsg.includes('Invalid')) {
        return {
          message: (language === 'zh' ? '该账号不存在，请检查邮箱或使用下方演示账号' : 'Account not found, please check email or use demo accounts below') + availableHint,
          type: 'email' as const,
        };
      }
      return {
        message: (language === 'zh' ? '邮箱或密码错误' : 'Invalid email or password') + availableHint,
        type: 'general' as const,
      };
    }
    if (status === 403) {
      return {
        message: (language === 'zh' ? '账号已被禁用，请联系管理员' : 'Account disabled, please contact administrator'),
        type: 'general' as const,
      };
    }
    if (status >= 500) {
      return {
        message: (language === 'zh' ? '服务器错误，请稍后重试' : 'Server error, please try again later'),
        type: 'general' as const,
      };
    }
    return {
      message: (errorMsg || (language === 'zh' ? '登录失败，请重试' : 'Login failed, please try again')) + availableHint,
      type: 'general' as const,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);
    setLoginSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let identifier = email.trim().toLowerCase();
      if (!identifier.includes('@')) {
        const matchedAccount = allAliases[identifier];
        if (matchedAccount) {
          identifier = matchedAccount.email;
        }
      }
      console.log('[Login] Submitting:', identifier);
      if (mode === 'register') {
        await register(identifier, password, fullName.trim());
      } else {
        await login(identifier, password);
      }
      console.log('[Login] Success, navigating to:', from);
      setLoginSuccess(true);
      setError('');
      setErrorType(null);
      setTimeout(() => navigate(from, { replace: true }), 50);
    } catch (err: any) {
      console.log('[Login] Error:', err.status, err.message);
      const status = err.status || err.response?.status || 0;
      const errorInfo = getErrorMessage(status, err.message);
      setError(errorInfo.message);
      setErrorType(errorInfo.type);
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccountClick = (account: typeof demoAccounts[0]) => {
    setMode('login');
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    setErrorType(null);
    setLoginSuccess(false);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-blue-100 text-blue-700',
      accountant: 'bg-green-100 text-green-700',
      user: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, { zh: string; en: string }> = {
      admin: { zh: '管理员', en: 'Admin' },
      accountant: { zh: '会计师', en: 'Accountant' },
      user: { zh: '业主', en: 'Owner' },
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {language === 'zh' ? labels[role]?.zh : labels[role]?.en || role}
      </span>
    );
  };

  if (token && user) {
    console.log('[Login] Already logged in, redirecting to:', from);
    setTimeout(() => navigate(from, { replace: true }), 0);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-slate-800 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">AusAsset Pro</h1>
                <p className="text-blue-100 text-sm">
                  {language === 'zh' ? '澳洲资产跨境管理平台' : 'Australian Cross-Border Asset Management'}
                </p>
              </div>
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Globe size={16} className="mr-2" />
                {language === 'zh' ? 'English' : '中文'}
              </button>
            </div>
          </div>

          <div className="p-8">
            {loginSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {language === 'zh' ? '登录成功！' : 'Login Successful!'}
                </h3>
                <p className="text-gray-500">
                  {language === 'zh' ? '正在跳转到工作台...' : 'Redirecting to dashboard...'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setErrorType(null);
                    }}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      mode === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {language === 'zh' ? '账号' : 'Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setEmail('');
                      setPassword('');
                      setError('');
                      setErrorType(null);
                    }}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      mode === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {language === 'zh' ? '新用户' : 'New User'}
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'zh' ? '姓名' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={language === 'zh' ? '请输入姓名' : 'Enter full name'}
                        autoComplete="name"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {mode === 'login'
                        ? (language === 'zh' ? '账号或邮箱' : 'Account or Email')
                        : t('email', 'auth')}
                    </label>
                    <div className="relative">
                      <UserCircle
                        size={18}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          errorType === 'email' ? 'text-red-400' : 'text-gray-400'
                        }`}
                      />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorType === 'email') {
                            setError('');
                            setErrorType(null);
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition-all ${
                          errorType === 'email'
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        }`}
                        placeholder={mode === 'login' ? 'admin or name@example.com' : 'name@example.com'}
                        autoComplete={mode === 'login' ? 'username' : 'email'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('password', 'auth')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorType === 'password') {
                            setError('');
                            setErrorType(null);
                          }
                        }}
                        className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none transition-all ${
                          errorType === 'password'
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        }`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle size={18} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-red-700 text-sm font-medium">
                            {mode === 'login'
                              ? (language === 'zh' ? '登录失败' : 'Login Failed')
                              : (language === 'zh' ? '注册失败' : 'Registration Failed')}
                          </p>
                          <p className="text-red-600 text-sm mt-1 whitespace-pre-wrap">{error}</p>
                          {errorType === 'email' && (
                            <p className="text-red-500 text-xs mt-2">
                              {language === 'zh'
                                ? '提示：请检查邮箱格式，或点击下方演示账号快速填充'
                                : 'Tip: Check email format, or click demo accounts below'}
                            </p>
                          )}
                          {errorType === 'password' && (
                            <p className="text-red-500 text-xs mt-2">
                              {language === 'zh'
                                ? '提示：密码长度至少6位，或点击下方演示账号快速填充'
                                : 'Tip: Password min 6 chars, or click demo accounts below'}
                            </p>
                          )}
                          {errorType === 'general' && (
                            <p className="text-red-500 text-xs mt-2">
                              {language === 'zh'
                                ? '提示：点击下方演示账号可一键填充正确凭据'
                                : 'Tip: Click demo accounts below to autofill credentials'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        {mode === 'login' ? t('logging_in', 'auth') : t('registering', 'auth')}
                      </span>
                    ) : (
                      mode === 'login' ? t('login', 'auth') : t('register', 'auth')
                    )}
                  </button>
                </form>

                {mode === 'login' && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <span className="w-1 h-1 bg-gray-300 rounded-full mr-2" />
                    {language === 'zh' ? '演示账号（点击填充）' : 'Demo Accounts (Click to fill)'}
                    <span className="w-1 h-1 bg-gray-300 rounded-full ml-2" />
                  </p>
                  <div className="space-y-2">
                    {demoAccounts.map((account) => {
                      const Icon = account.icon;
                      const isSelected = email === account.email || account.aliases.includes(email.trim().toLowerCase());
                      return (
                        <button
                          key={account.email}
                          type="button"
                          disabled={loading}
                          onClick={() => handleDemoAccountClick(account)}
                          aria-label={`${language === 'zh' ? '使用演示账号登录' : 'Sign in with demo account'} ${account.email}`}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : account.color
                          } disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                                isSelected ? 'bg-blue-200' : 'bg-white'
                              }`}
                            >
                              <Icon
                                size={20}
                                className={isSelected ? 'text-blue-700' : 'text-gray-600'}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 truncate">
                                  {language === 'zh' ? account.name : account.nameEn}
                                </span>
                                {getRoleBadge(account.role)}
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {account.email}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {language === 'zh' ? account.description : account.descriptionEn}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 size={18} className="text-blue-600 ml-2" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}
              </>
            )}
          </div>

          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {language === 'zh'
                ? '© 2024 AusAsset Pro - 澳洲资产跨境管理平台 | 所有数据已加密保护'
                : '© 2024 AusAsset Pro - Australian Cross-Border Asset Management | All data encrypted'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
