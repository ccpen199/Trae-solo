import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Crown, Building2, Landmark, Factory, PenTool, GraduationCap, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const roleConfig: Record<string, {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  defaultRoute: string;
}> = {
  super_admin: {
    label: '超级管理员',
    desc: '系统最高权限，全局管理',
    icon: <Crown size={20} />,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50 border-primary-200',
    defaultRoute: '/admin/dashboard',
  },
  government: {
    label: '文旅主管部门',
    desc: '行业监管、数据监测、政策发布',
    icon: <Building2 size={20} />,
    color: 'text-porcelain-600',
    bgColor: 'bg-porcelain-50 border-porcelain-200',
    defaultRoute: '/admin/dashboard',
  },
  scenic_admin: {
    label: '景区运营方',
    desc: '景区管理、客流监测、活动发布',
    icon: <Landmark size={20} />,
    color: 'text-landscape-600',
    bgColor: 'bg-landscape-50 border-landscape-200',
    defaultRoute: '/admin/dashboard',
  },
  enterprise: {
    label: '文旅企业',
    desc: '招商对接、产品发布、营销推广',
    icon: <Factory size={20} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    defaultRoute: '/admin/service/investment',
  },
  editor: {
    label: '专业编辑',
    desc: '内容创作、审核协作、传播分析',
    icon: <PenTool size={20} />,
    color: 'text-ink-600',
    bgColor: 'bg-ink-50 border-ink-200',
    defaultRoute: '/admin/content',
  },
  professional: {
    label: '专业读者',
    desc: '行业资讯、数据研究、政策解读',
    icon: <GraduationCap size={20} />,
    color: 'text-porcelain-600',
    bgColor: 'bg-porcelain-50 border-porcelain-200',
    defaultRoute: '/h5',
  },
  tourist: {
    label: '普通游客',
    desc: '浏览内容、景区查询、消费券领取',
    icon: <User size={20} />,
    color: 'text-landscape-600',
    bgColor: 'bg-landscape-50 border-landscape-200',
    defaultRoute: '/h5',
  },
};

const quickAccounts = [
  { username: 'admin', password: 'admin123', role: 'super_admin' as const },
  { username: 'gov', password: 'admin123', role: 'government' as const },
  { username: 'scenic', password: 'admin123', role: 'scenic_admin' as const },
  { username: 'enterprise', password: 'admin123', role: 'enterprise' as const },
  { username: 'editor', password: 'admin123', role: 'editor' as const },
  { username: 'pro', password: 'admin123', role: 'professional' as const },
];

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, loading, error, clearError, user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname;

  useEffect(() => {
    clearError();
  }, [clearError, username, password]);

  const getDefaultRoute = (role: string): string => {
    return roleConfig[role]?.defaultRoute || '/admin/dashboard';
  };

  const handleLogin = async (user: string, pass: string) => {
    try {
      clearError();
      await login({ username: user, password: pass });
      setLoginSuccess(true);
    } catch (err) {
      setLoginSuccess(false);
      console.error('登录失败:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    await handleLogin(username, password);
  };

  const handleQuickLogin = (account: typeof quickAccounts[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setSelectedRole(account.role);
    handleLogin(account.username, account.password);
  };

  if (token && user && loginSuccess) {
    const target = from || getDefaultRoute(user.role);
    return <Navigate to={target} replace />;
  }

  const getErrorDetail = () => {
    if (!error) return null;
    if (error.includes('用户名或密码')) {
      return {
        title: '账号或密码不正确',
        tips: ['请检查账号是否输入正确', '演示账号密码统一为：admin123', '可点击下方快捷登录直接体验'],
      };
    }
    if (error.includes('禁用')) {
      return {
        title: '账号已被禁用',
        tips: ['请联系系统管理员解锁账号', '如需申请新账号，请通过政务系统提交'],
      };
    }
    return {
      title: error,
      tips: ['请稍后重试，或联系技术支持'],
    };
  };

  const errorDetail = getErrorDetail();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink-50 via-primary-50 to-porcelain-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-primary-400 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-porcelain-400 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-landscape-400 blur-3xl"></div>
      </div>

      <div className="absolute top-10 left-10 text-6xl opacity-20 font-serif">山</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 font-serif">水</div>
      <div className="absolute top-1/3 right-1/4 text-4xl opacity-15 font-serif">文</div>
      <div className="absolute bottom-1/3 left-1/4 text-4xl opacity-15 font-serif">旅</div>

      <div className="relative w-full max-w-6xl flex bg-white rounded-2xl shadow-2xl overflow-hidden chinese-border">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 border-2 border-primary-500/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 border-2 border-porcelain-500/20 rounded-full translate-y-1/2 -translate-x-1/3"></div>
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-xl bg-primary-500 flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-white font-serif">文</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-wider font-serif">文旅中台</h1>
            <p className="text-ink-300 text-lg mb-2">权威文旅垂直领域</p>
            <p className="text-ink-400 mb-8">内容生产与产业服务平台</p>
            <div className="space-y-3">
              {['内容+数据+服务三位一体', '多级审核与版权保护', '智能分发与舆情分析'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm">
                    ✓
                  </span>
                  <span className="text-ink-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 text-ink-500 text-sm">
            <p>© 2024 文旅中台 · 权威发布</p>
            <p className="mt-1">Content Security Gateway</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 lg:p-12 max-h-screen overflow-y-auto">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white font-serif">文</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-800 font-serif">文旅中台</h1>
            <p className="text-ink-500 text-sm mt-1">内容生产与产业服务平台</p>
          </div>

          <h2 className="text-2xl font-bold text-ink-800 mb-2">欢迎登录</h2>
          <p className="text-ink-500 mb-6">请输入您的账号密码，或选择快捷身份登录</p>

          {error && errorDetail && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium text-sm">{errorDetail.title}</p>
                  {errorDetail.tips && errorDetail.tips.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {errorDetail.tips.map((tip, i) => (
                        <li key={i} className="text-red-600 text-xs flex items-start gap-1.5">
                          <span className="text-red-400">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {loginSuccess && user && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-500" />
                <div>
                  <p className="text-green-700 font-medium text-sm">登录成功</p>
                  <p className="text-green-600 text-xs mt-0.5">
                    欢迎回来，{user.realName} · {roleConfig[user.role]?.label || user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedRole && roleConfig[selectedRole] && !loginSuccess && (
            <div className={`mb-6 p-4 rounded-xl border ${roleConfig[selectedRole].bgColor}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center ${roleConfig[selectedRole].color}`}>
                  {roleConfig[selectedRole].icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${roleConfig[selectedRole].color}`}>
                    已选择：{roleConfig[selectedRole].label}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {roleConfig[selectedRole].desc}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-xs text-ink-400 hover:text-ink-600"
                >
                  切换
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setSelectedRole(null);
                }}
                className="input"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedRole(null);
                }}
                className="input"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500 border-ink-300"
                />
                <span className="text-sm text-ink-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">忘记密码？</a>
            </div>
            <button
              type="submit"
              disabled={loading || loginSuccess}
              className="btn-primary w-full justify-center"
            >
              {loading ? '登录中...' : loginSuccess ? '登录成功，正在跳转...' : '登 录'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ink-100">
            <p className="text-xs text-ink-500 mb-3">
              快捷身份登录（演示账号，密码统一为 <code className="bg-ink-100 px-1.5 py-0.5 rounded text-ink-700">admin123</code>）：
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickAccounts.map((acc) => {
                const config = roleConfig[acc.role];
                const isSelected = selectedRole === acc.role;
                return (
                  <button
                    key={acc.username}
                    onClick={() => handleQuickLogin(acc)}
                    disabled={loading}
                    className={`p-3 text-left rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${config.bgColor} border-current ${config.color} shadow-md scale-[1.02]`
                        : 'bg-white border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`text-sm font-medium ${isSelected ? config.color : 'text-ink-700'}`}>
                      {config.label}
                    </div>
                    <div className="text-xs text-ink-400 mt-1 truncate">
                      {acc.username}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              💡 <strong>提示：</strong>点击上方身份卡片即可直接登录体验对应角色工作台
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
