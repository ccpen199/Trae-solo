import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Phone,
  Lock,
  MessageSquare,
  ArrowRight,
  Shield,
  Settings,
  Building2,
  Wrench,
  User,
  Home,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  testAccounts,
  mockLogin,
  getRoleRedirectPath,
  getRoleLabel,
} from '@/mock/auth';
import type { TestAccount } from '@/mock/auth';

type LoginTab = 'password' | 'sms';

const roleIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-5 h-5" />,
  settings: <Settings className="w-5 h-5" />,
  building: <Building2 className="w-5 h-5" />,
  wrench: <Wrench className="w-5 h-5" />,
  user: <User className="w-5 h-5" />,
};

const roleColors: Record<string, string> = {
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
};

const roleCardColors: Record<string, string> = {
  purple: 'hover:border-purple-400 hover:bg-purple-50',
  blue: 'hover:border-blue-400 hover:bg-blue-50',
  green: 'hover:border-green-400 hover:bg-green-50',
  orange: 'hover:border-orange-400 hover:bg-orange-50',
  indigo: 'hover:border-indigo-400 hover:bg-indigo-50',
  teal: 'hover:border-teal-400 hover:bg-teal-50',
};

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [useMock, setUseMock] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin } = useAuthStore();

  const from = (location.state as { from?: string })?.from || '';

  useEffect(() => {
    if (phone || password) {
      setError('');
    }
  }, [phone, password]);

  const keywordHints: Record<string, string> = {
    admin: '提示：平台管理员测试账号：13800000000 / admin123',
    platform: '提示：平台管理员测试账号：13800000000 / admin123，点击下方"系统管理员"快捷登录',
    ops: '提示：社区运营测试账号：13800000001 / ops123，点击下方"社区运营"快捷登录',
    运营: '提示：社区运营测试账号：13800000001 / ops123',
    管理员: '提示：平台管理员测试账号：13800000000 / admin123',
    物业: '提示：物业管理员测试账号：13800000002 / property123，或点击下方"物业主管"快捷登录',
    业主: '提示：实名住户测试账号：13900001001 / resident123，点击下方"朝阳业主"快捷登录',
    住户: '提示：实名住户测试账号：13900001001 / resident123',
    designer: '提示：邻里数字基座体系中无设计师角色，请选择"业主/住户"或"物业"身份登录',
    设计师: '提示：邻里数字基座体系中无设计师角色，请选择"业主/住户"或"物业"身份登录',
    property: '提示：物业管理员测试账号：13800000002 / property123',
    staff: '提示：物业员工测试账号：13800000003 / staff123',
  };

  const validatePhone = (p: string): string | null => {
    if (!p) return '请输入手机号';
    const trimmed = p.trim().toLowerCase();
    for (const keyword of Object.keys(keywordHints)) {
      if (trimmed.includes(keyword)) {
        return keywordHints[keyword];
      }
    }
    if (!/^1[3-9]\d{9}$/.test(p)) {
      return '请输入正确的11位手机号（如13800000000），或点击下方测试账号快捷登录';
    }
    return null;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setLoading(true);
    try {
      if (useMock) {
        const { token, user } = mockLogin(phone, password);
        localStorage.setItem(
          'auth-storage',
          JSON.stringify({ state: { token, user } })
        );
        storeLogin(phone, password);
        const redirectPath = from || getRoleRedirectPath(user.role);
        navigate(redirectPath, { replace: true });
      } else {
        await storeLogin(phone, password);
        navigate('/', { replace: true });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || '登录失败，请检查账号密码');
      } else {
        setError('登录失败，请检查账号密码');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (!smsCode || smsCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      await storeLogin(phone, smsCode);
      navigate('/', { replace: true });
    } catch {
      setError('验证码错误或已过期');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account: TestAccount) => {
    setError('');
    setLoading(true);
    setPhone(account.phone);
    setPassword(account.password);

    try {
      const { token, user } = mockLogin(account.phone, account.password);
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user } })
      );
      storeLogin(account.phone, account.password);
      const redirectPath = from || getRoleRedirectPath(account.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone || countdown > 0) return;
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    try {
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
    } catch {
      setError('验证码发送失败，请稍后重试');
    }
  };

  const handleSamlLogin = () => {
    setError('物业SAML单点登录需配置对应IdP服务，请使用测试账号登录体验');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 px-4 py-8">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 lg:mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">邻里数字基座</h1>
              <p className="text-sm text-gray-500">Neighborhood Digital Platform</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            连接邻里，共建美好社区
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            以物理社区为单元，多租户独立子域，提供邻里社交、半径优选、物业服务、小金库激励等全方位数字底座
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: <MessageSquare className="w-5 h-5" />, label: '邻里话题', color: 'text-primary-600 bg-primary-50' },
              { icon: <Sparkles className="w-5 h-5" />, label: '半径优选', color: 'text-emerald-600 bg-emerald-50' },
              { icon: <Building2 className="w-5 h-5" />, label: '物业服务', color: 'text-amber-600 bg-amber-50' },
              { icon: <Shield className="w-5 h-5" />, label: '担保交易', color: 'text-purple-600 bg-purple-50' },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center p-4 rounded-xl ${item.color} bg-opacity-50`}
              >
                {item.icon}
                <span className="mt-2 text-sm font-medium text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>实名住户 + 门禁绑定</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>物业SAML单点登录</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>多租户独立子域</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[480px] flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">账号登录</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">演示模式</span>
                <button
                  onClick={() => setUseMock(!useMock)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    useMock ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useMock ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-200 mb-5">
              <button
                onClick={() => {
                  setTab('password');
                  setError('');
                }}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'password'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                密码登录
              </button>
              <button
                onClick={() => {
                  setTab('sms');
                  setError('');
                }}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'sms'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                验证码登录
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {tab === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    手机号
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                      className="input-field pl-9"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="input-field pl-9"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                >
                  {loading ? '登录中...' : '登 录'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSmsLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    手机号
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                      className="input-field pl-9"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    验证码
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        placeholder="请输入验证码"
                        className="input-field pl-9"
                        maxLength={6}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0}
                      className="btn-secondary whitespace-nowrap text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px]"
                    >
                      {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                >
                  {loading ? '登录中...' : '登 录'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={handleSamlLogin}
                className="btn-secondary w-full text-sm py-2.5"
              >
                <span className="flex items-center justify-center gap-2">
                  <Building2 className="w-4 h-4" />
                  物业 SAML 单点登录
                </span>
              </button>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              还没有账号？{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">
                立即注册
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">测试账号快捷登录</span>
              <span className="text-xs text-gray-400">点击即可登录体验</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {testAccounts.map((account) => (
                <button
                  key={account.phone}
                  onClick={() => handleQuickLogin(account)}
                  disabled={loading}
                  className={`p-3 rounded-xl border-2 border-gray-100 bg-white text-left transition-all ${
                    roleCardColors[account.color]
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                      roleColors[account.color]
                    }`}
                  >
                    {roleIcons[account.icon]}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {account.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {account.roleLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
