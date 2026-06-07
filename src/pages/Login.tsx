import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Building2, Eye, EyeOff, Lock, Phone, AlertCircle, CheckCircle, Loader2, User, ArrowRight, ShieldCheck } from 'lucide-react';

const ROLE_NAMES: Record<string, string> = {
  admin: '系统管理员',
  agent_self: '自营经纪人',
  agent_franchise: '加盟经纪人',
  owner: '业主',
  tenant: '租客',
  buyer: '买家',
};

const USERNAME_TO_PHONE: Record<string, string> = {
  'admin': '13800000001',
  'platform': '13800000001',
  'ops': '13800000001',
  'root': '13800000001',
  'super': '13800000001',
  'agent': '13800000002',
  'agent1': '13800000002',
  'agent2': '13800000003',
  'owner': '13800000004',
  'landlord': '13800000004',
  'tenant': '13800000005',
  'renter': '13800000005',
  'buyer': '13800000006',
  'customer': '13800000006',
};

const testAccounts = [
  { phone: '13800000001', name: '系统管理员', role: 'admin', icon: '👤', username: 'admin', desc: '房源管理、交易过户、佣金结算、供应链、系统配置' },
  { phone: '13800000002', name: '李明', role: 'agent_self', icon: '🏠', username: 'agent', desc: '房源发布、VR带看、合同签约、交易跟进' },
  { phone: '13800000003', name: '王芳', role: 'agent_franchise', icon: '🏢', username: 'agent2', desc: '房源上架、客户带看、业绩查询、佣金提现' },
  { phone: '13800000004', name: '张伟', role: 'owner', icon: '🔑', username: 'owner', desc: '房源委托、租约管理、租金查看、维修申请' },
  { phone: '13800000005', name: '刘洋', role: 'tenant', icon: '🧑‍💼', username: 'tenant', desc: '房源搜索、VR看房、租金支付、报修工单' },
  { phone: '13800000006', name: '陈浩', role: 'buyer', icon: '💼', username: 'buyer', desc: '房源查找、意向收藏、交易进度、过户节点' },
];

interface LoginError {
  type: 'validation' | 'credentials' | 'permission' | 'network' | 'server' | 'unknown';
  message: string;
  suggestion: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginStore = useAuthStore(s => s.login);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [autoLoginAccount, setAutoLoginAccount] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<{ name: string; role: string } | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleName = ROLE_NAMES[user.role] || user.role;
      console.log(`[Login] 已检测到登录状态: ${user.name} (${roleName}), 跳转到: ${from}`);
      setLoginSuccess({ name: user.name, role: user.role });
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate, from]);

  const resolveAccount = useCallback((input: string): string => {
    const trimmed = input.trim().toLowerCase();
    if (USERNAME_TO_PHONE[trimmed]) {
      console.log(`[Login] 用户名别名映射: ${input} -> ${USERNAME_TO_PHONE[trimmed]}`);
      return USERNAME_TO_PHONE[trimmed];
    }
    return input.trim();
  }, []);

  const validateInput = useCallback((inputUser: string, inputPass: string): LoginError | null => {
    if (!inputUser.trim()) {
      return {
        type: 'validation',
        message: '请输入账号',
        suggestion: '可输入手机号或用户名别名（如 admin、agent、tenant 等）'
      };
    }
    if (!inputPass) {
      return {
        type: 'validation',
        message: '请输入密码',
        suggestion: '测试账号默认密码为 123456'
      };
    }
    if (inputPass.length < 6) {
      return {
        type: 'validation',
        message: '密码长度不足',
        suggestion: '密码长度不能少于6位字符'
      };
    }
    return null;
  }, []);

  const classifyError = useCallback((err: any): LoginError => {
    const msg = err?.message || String(err) || '登录失败';

    if (msg.includes('账号不存在')) {
      return {
        type: 'credentials',
        message: '账号不存在',
        suggestion: '请检查输入的手机号或用户名是否正确，可使用下方测试账号一键登录'
      };
    }
    if (msg.includes('密码错误')) {
      return {
        type: 'credentials',
        message: '密码错误',
        suggestion: '请重新输入密码，测试账号默认密码为 123456'
      };
    }
    if (msg.includes('手机号或密码错误') || msg.includes('credentials') || msg.includes('401') || msg.includes('400')) {
      return {
        type: 'credentials',
        message: '账号或密码错误',
        suggestion: '请检查账号密码是否正确，或使用下方测试账号一键登录'
      };
    }
    if (msg.includes('权限') || msg.includes('forbidden') || msg.includes('403')) {
      return {
        type: 'permission',
        message: '账号权限不足',
        suggestion: '该账号已被禁用或权限已变更，请联系管理员'
      };
    }
    if (msg.includes('Failed to fetch') || msg.includes('网络') || msg.includes('timeout') || msg.includes('CORS')) {
      return {
        type: 'network',
        message: '后端服务连接失败',
        suggestion: '请确认后端服务已启动在端口 59051，或检查网络连接'
      };
    }
    if (msg.includes('500') || msg.includes('server') || msg.includes('数据库')) {
      return {
        type: 'server',
        message: '服务器内部错误',
        suggestion: '后端服务异常，请稍后重试或联系技术支持'
      };
    }
    if (msg.includes('格式') || msg.includes('参数') || msg.includes('不能为空')) {
      return {
        type: 'validation',
        message: msg,
        suggestion: '请检查输入格式是否正确'
      };
    }

    return {
      type: 'unknown',
      message: msg,
      suggestion: '请稍后重试，如问题持续请联系技术支持'
    };
  }, []);

  const doLogin = useCallback(async (phoneNum: string, pwd: string, autoLogin = false) => {
    console.log(`[Login] 开始登录: ${phoneNum}${autoLogin ? ' (一键登录)' : ''}`);

    const validationError = autoLogin ? null : validateInput(phoneNum, pwd);
    if (validationError) {
      setLoginError(validationError);
      return;
    }

    const resolvedPhone = resolveAccount(phoneNum);
    setLoginError(null);
    setLoading(true);
    if (autoLogin) {
      setAutoLoginAccount(phoneNum);
    }

    try {
      console.log(`[Login] 调用API: /api/auth/login, phone=${resolvedPhone}`);
      const result = await authApi.login(resolvedPhone, pwd);
      console.log(`[Login] API返回:`, result);

      if (!result) {
        throw new Error('登录响应为空');
      }
      if (result.success === false) {
        throw new Error(result.error || result.message || '登录失败');
      }
      if (!result.token || !result.user) {
        console.warn(`[Login] 响应格式异常:`, result);
        throw new Error('登录响应格式异常，请稍后重试');
      }

      console.log(`[Login] 登录成功，更新Store: ${result.user.name} (${result.user.role})`);
      loginStore(result.token, result.user);

      const roleName = ROLE_NAMES[result.user.role] || result.user.role;
      setLoginSuccess({ name: result.user.name, role: result.user.role });

      console.log(`[Login] 准备跳转到: ${from}`);

    } catch (e: any) {
      console.error(`[Login] 登录失败:`, e);
      const classified = classifyError(e);
      setLoginError(classified);
      setLoginSuccess(null);
    } finally {
      setLoading(false);
      setAutoLoginAccount(null);
    }
  }, [loginStore, resolveAccount, validateInput, classifyError, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(username, password);
  };

  const handleQuickLogin = async (account: typeof testAccounts[0]) => {
    setUsername(account.username);
    setPassword('123456');
    await doLogin(account.phone, '123456', true);
  };

  const getErrorIcon = (type: LoginError['type']) => {
    switch (type) {
      case 'validation': return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case 'credentials': return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case 'permission': return <ShieldCheck className="w-5 h-5 flex-shrink-0" />;
      case 'network': return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case 'server': return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      default: return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
    }
  };

  const getErrorColor = (type: LoginError['type']) => {
    switch (type) {
      case 'validation': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'credentials': return 'bg-red-50 text-red-700 border-red-200';
      case 'permission': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'network': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'server': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loginSuccess) {
    const roleName = ROLE_NAMES[loginSuccess.role] || loginSuccess.role;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">登录成功</h2>
          <p className="text-gray-600 mb-4">欢迎回来，{loginSuccess.name}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>{roleName}</span>
          </div>
          <div className="text-sm text-gray-500 mb-6">正在进入{roleName}工作台...</div>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-2xl">
        {/* Left brand */}
        <div className="hidden md:flex md:w-1/2 bg-primary-600 p-12 flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-7 h-7 text-accent-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">居住服务平台</div>
                <div className="text-sm text-primary-200">租售装服一体化</div>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight">
              一站式居住服务
              <br />
              <span className="text-accent-400">数字赋能新居住</span>
            </h1>
            <p className="text-primary-200 text-lg mb-8">
              覆盖分散式合租/整租、集中式公寓、二手房全场景，
              连接房源、客户、经纪人与服务商，打造完整业务闭环。
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-accent-400">5+</div>
                <div className="text-sm text-primary-200">业务场景覆盖</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-accent-400">6</div>
                <div className="text-sm text-primary-200">用户角色体系</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-accent-400">4</div>
                <div className="text-sm text-primary-200">服务工单类型</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-accent-400">100%</div>
                <div className="text-sm text-primary-200">业务线上化</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
            <div className="text-sm font-medium mb-2">💡 快捷登录提示</div>
            <div className="text-xs text-primary-200 space-y-1">
              <div>• 输入 <code className="bg-white/20 px-1.5 py-0.5 rounded">admin</code> 登录管理员</div>
              <div>• 输入 <code className="bg-white/20 px-1.5 py-0.5 rounded">agent</code> 登录经纪人</div>
              <div>• 输入 <code className="bg-white/20 px-1.5 py-0.5 rounded">tenant</code> 登录租客</div>
              <div>• 默认密码均为 <code className="bg-white/20 px-1.5 py-0.5 rounded">123456</code></div>
            </div>
          </div>
        </div>

        {/* Right login form */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">居住服务平台</div>
              <div className="text-xs text-gray-500">租售装服一体化</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎登录</h2>
          <p className="text-gray-500 mb-6">请输入账号或选择角色快速进入工作台</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">账号</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setLoginError(null); }}
                  placeholder="手机号或用户名（如 admin、agent）"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                    loginError?.type === 'validation' ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(null); }}
                  placeholder="请输入密码（默认123456）"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                    loginError?.type === 'validation' ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  autoComplete="current-password"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${getErrorColor(loginError.type)}`}>
                {getErrorIcon(loginError.type)}
                <div className="flex-1">
                  <div className="font-medium">{loginError.message}</div>
                  <div className="text-xs mt-1 opacity-80">{loginError.suggestion}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span>进入工作台</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              选择角色一键登录（自动填充账号密码）
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {testAccounts.map(acc => (
                <button
                  key={acc.phone}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group ${
                    autoLoginAccount === acc.phone
                      ? 'bg-primary-100 border-2 border-primary-400 shadow-md'
                      : 'bg-gray-50 hover:bg-primary-50 hover:shadow-sm border-2 border-transparent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-2xl">{acc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                      <span>{acc.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-600 rounded-full">
                        {ROLE_NAMES[acc.role]}
                      </span>
                      <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {acc.username}
                      </code>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{acc.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {autoLoginAccount === acc.phone ? (
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 text-center">
              登录即表示同意《用户协议》和《隐私政策》
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
