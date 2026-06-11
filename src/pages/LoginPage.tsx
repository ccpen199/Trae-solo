import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Crown, Building2, Landmark, Factory, PenTool,
  GraduationCap, User, AlertCircle, CheckCircle2,
  WifiOff, ServerCrash, Lock, ArrowRight, RefreshCw
} from 'lucide-react';

const roleConfig: Record<string, {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultRoute: string;
}> = {
  super_admin: {
    label: '超级管理员',
    desc: '系统全局管理、权限配置',
    icon: <Crown size={18} />,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    defaultRoute: '/admin/dashboard',
  },
  government: {
    label: '文旅主管部门',
    desc: '行业监管、数据监测、政策发布',
    icon: <Building2 size={18} />,
    color: 'text-porcelain-600',
    bgColor: 'bg-porcelain-50',
    borderColor: 'border-porcelain-200',
    defaultRoute: '/admin/dashboard',
  },
  scenic_admin: {
    label: '景区运营方',
    desc: '景区管理、客流监测、活动运营',
    icon: <Landmark size={18} />,
    color: 'text-landscape-600',
    bgColor: 'bg-landscape-50',
    borderColor: 'border-landscape-200',
    defaultRoute: '/admin/dashboard',
  },
  enterprise: {
    label: '文旅企业',
    desc: '招商对接、产品发布、营销推广',
    icon: <Factory size={18} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    defaultRoute: '/admin/service/investment',
  },
  editor: {
    label: '专业编辑',
    desc: '内容创作、审核协作、传播分析',
    icon: <PenTool size={18} />,
    color: 'text-ink-600',
    bgColor: 'bg-ink-50',
    borderColor: 'border-ink-200',
    defaultRoute: '/admin/content',
  },
  professional: {
    label: '专业读者',
    desc: '行业资讯、数据研究、政策解读',
    icon: <GraduationCap size={18} />,
    color: 'text-porcelain-600',
    bgColor: 'bg-porcelain-50',
    borderColor: 'border-porcelain-200',
    defaultRoute: '/h5',
  },
  tourist: {
    label: '普通游客',
    desc: '浏览内容、景区查询、消费券领取',
    icon: <User size={18} />,
    color: 'text-landscape-600',
    bgColor: 'bg-landscape-50',
    borderColor: 'border-landscape-200',
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

type BackendStatus = 'checking' | 'online' | 'offline';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [submitCount, setSubmitCount] = useState(0);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [loginStep, setLoginStep] = useState<string>('');
  const navigateRef = useRef(false);
  const { login, loading, error, errorType, clearError, user, token, resetState } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname;

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const resp = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
          setBackendStatus('online');
          console.log('[LoginPage] backend online');
        } else {
          setBackendStatus('offline');
          console.log('[LoginPage] backend returned:', resp.status);
        }
      } catch (e) {
        setBackendStatus('offline');
        console.log('[LoginPage] backend offline:', (e as Error).message);
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    if (username || password) {
      clearError();
      setLoginStep('');
    }
  }, [username, password, clearError]);

  const getDefaultRoute = useCallback((role: string): string => {
    return roleConfig[role]?.defaultRoute || '/admin/dashboard';
  }, []);

  const doNavigate = useCallback((target: string) => {
    if (navigateRef.current) return;
    navigateRef.current = true;
    console.log('[LoginPage] navigating to:', target);
    navigate(target, { replace: true });
  }, [navigate]);

  const handleLogin = useCallback(async (uname: string, pass: string, roleHint?: string) => {
    if (!uname.trim() || !pass.trim()) {
      setLoginStep('请输入账号和密码');
      return false;
    }

    if (roleHint) setSelectedRole(roleHint);
    setLoginStep('正在验证账号密码...');
    console.log('[LoginPage] handleLogin:', uname, roleHint || 'manual');

    const success = await login({ username: uname.trim(), password: pass.trim() });

    if (success) {
      setLoginStep('登录成功！正在跳转工作台...');
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const target = from || getDefaultRoute(currentUser.role);
        console.log('[LoginPage] login success, user:', currentUser.realName, 'target:', target);
        setTimeout(() => doNavigate(target), 200);
      } else {
        setLoginStep('登录成功但未获取到用户信息，请刷新重试');
      }
    } else {
      const err = useAuthStore.getState().error;
      setLoginStep('登录失败: ' + (err || '未知错误'));
      setSubmitCount(c => c + 1);
      console.log('[LoginPage] login failed:', err);
    }
    return success;
  }, [login, from, getDefaultRoute, doNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(username, password);
  };

  const handleQuickLogin = (account: typeof quickAccounts[0]) => {
    if (loading) return;
    setUsername(account.username);
    setPassword(account.password);
    handleLogin(account.username, account.password, account.role);
  };

  const handleResetState = () => {
    resetState();
    setUsername('');
    setPassword('');
    setSelectedRole(null);
    setLoginStep('');
    setSubmitCount(0);
  };

  if (token && user && !loading) {
    const target = from || getDefaultRoute(user.role);
    return <Navigate to={target} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink-50 via-primary-50 to-porcelain-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-primary-400 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-porcelain-400 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-landscape-400 blur-3xl"></div>
      </div>

      <div className="absolute top-10 left-10 text-6xl opacity-20 font-serif select-none">山</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 font-serif select-none">水</div>

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
              {[
                '内容+数据+服务三位一体',
                '三级审核与版权水印保护',
                '智能分发与舆情情绪分析',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm">✓</span>
                  <span className="text-ink-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 text-ink-500 text-sm space-y-1">
            <p>© 2024 文旅中台 · 权威发布</p>
            <p>中央媒体内容安全网关接入</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 lg:p-10 max-h-screen overflow-y-auto">
          <div className="lg:hidden mb-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white font-serif">文</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-800 font-serif">文旅中台</h1>
            <p className="text-ink-500 text-sm mt-1">内容生产与产业服务平台</p>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-ink-800">欢迎登录</h2>
            <p className="text-ink-500 text-sm mt-1">选择您的身份或输入账号密码进入工作台</p>
          </div>

          <div className={`mb-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
            backendStatus === 'online' ? 'bg-green-50 text-green-700 border border-green-200' :
            backendStatus === 'offline' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-ink-50 text-ink-500 border border-ink-200'
          }`}>
            {backendStatus === 'online' && <><span className="w-2 h-2 rounded-full bg-green-500"></span>后端服务已连接</>}
            {backendStatus === 'offline' && <><span className="w-2 h-2 rounded-full bg-red-500"></span>后端服务不可用 — 请检查服务器是否已启动</>}
            {backendStatus === 'checking' && <><span className="w-2 h-2 rounded-full bg-ink-400 animate-pulse"></span>正在检测后端服务...</>}
          </div>

          {backendStatus === 'offline' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <WifiOff size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium text-sm">无法连接后端服务</p>
                  <ul className="mt-2 space-y-1 text-xs text-red-600">
                    <li>• 请确认后端服务（端口 59171）已正常启动</li>
                    <li>• 可尝试刷新页面重试</li>
                    <li>• 如持续出现，请检查网络代理配置</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={`mb-4 p-4 rounded-xl border ${
              errorType === 'invalid_credentials' ? 'bg-red-50 border-red-200' :
              errorType === 'account_disabled' ? 'bg-amber-50 border-amber-200' :
              errorType === 'network_error' ? 'bg-orange-50 border-orange-200' :
              errorType === 'server_error' ? 'bg-purple-50 border-purple-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {errorType === 'invalid_credentials' && <Lock size={20} className="text-red-500" />}
                  {errorType === 'account_disabled' && <AlertCircle size={20} className="text-amber-500" />}
                  {errorType === 'network_error' && <WifiOff size={20} className="text-orange-500" />}
                  {errorType === 'server_error' && <ServerCrash size={20} className="text-purple-500" />}
                  {!errorType && <AlertCircle size={20} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink-800">{error}</p>
                  {errorType === 'invalid_credentials' && (
                    <ul className="mt-2 space-y-1 text-xs text-ink-500">
                      <li>• 请检查账号是否输入正确（区分大小写）</li>
                      <li>• 演示账号密码统一为：<code className="bg-ink-100 px-1 rounded">admin123</code></li>
                      <li>• 可直接点击下方角色卡片一键登录</li>
                    </ul>
                  )}
                  {errorType === 'network_error' && (
                    <ul className="mt-2 space-y-1 text-xs text-ink-500">
                      <li>• 后端服务可能未启动或不可达</li>
                      <li>• 请刷新页面后重试</li>
                    </ul>
                  )}
                  {errorType === 'server_error' && (
                    <ul className="mt-2 space-y-1 text-xs text-ink-500">
                      <li>• 服务器内部错误，请稍后重试</li>
                      <li>• 如持续出现请联系技术支持</li>
                    </ul>
                  )}
                  {submitCount > 2 && (
                    <p className="mt-2 text-xs text-amber-600">
                      已失败 {submitCount} 次，可尝试 <button onClick={handleResetState} className="underline font-medium">重置登录状态</button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {loginStep && !error && (
            <div className={`mb-4 p-3 rounded-xl border text-sm flex items-center gap-2 ${
              loginStep.includes('成功') ? 'bg-green-50 border-green-200 text-green-700' :
              loginStep.includes('失败') ? 'bg-red-50 border-red-200 text-red-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {loginStep.includes('成功') ? <CheckCircle2 size={16} /> :
               loginStep.includes('失败') ? <AlertCircle size={16} /> :
               <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              }
              <span>{loginStep}</span>
            </div>
          )}

          {selectedRole && roleConfig[selectedRole] && !error && !loginStep?.includes('成功') && (
            <div className={`mb-4 p-3 rounded-xl border ${roleConfig[selectedRole].bgColor} ${roleConfig[selectedRole].borderColor}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${roleConfig[selectedRole].color} border ${roleConfig[selectedRole].borderColor}`}>
                  {roleConfig[selectedRole].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${roleConfig[selectedRole].color}`}>
                    {roleConfig[selectedRole].label}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5 truncate">
                    {roleConfig[selectedRole].desc} → {roleConfig[selectedRole].defaultRoute}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setSelectedRole(null); }}
                className="input h-11"
                placeholder="请输入用户名"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setSelectedRole(null); }}
                className="input h-11"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 text-primary-500 rounded" />
                <span className="text-sm text-ink-600">记住登录状态</span>
              </label>
              <button type="button" onClick={handleResetState} className="text-xs text-ink-400 hover:text-ink-600 flex items-center gap-1">
                <RefreshCw size={12} /> 重置状态
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="btn-primary w-full justify-center h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </span>
              ) : (
                <span className="flex items-center gap-2">登 录 <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-ink-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-ink-600">快捷身份登录（点击即登录）</p>
              <span className="text-xs text-ink-400">密码：admin123</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickAccounts.map((acc) => {
                const config = roleConfig[acc.role];
                const isSelected = selectedRole === acc.role && !error;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    disabled={loading}
                    className={`p-2.5 text-left rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${config.bgColor} ${config.borderColor} ${config.color} shadow-md`
                        : 'bg-white border-ink-200 hover:border-ink-300 hover:bg-ink-50 text-ink-700'
                    } ${loading && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={isSelected ? config.color : 'text-ink-400'}>{config.icon}</span>
                      <span className="text-xs font-medium truncate">{config.label}</span>
                    </div>
                    <div className="text-[11px] text-ink-400 truncate">
                      {loading && isSelected ? '登录中...' : acc.username}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700 leading-relaxed">
              💡 <strong>使用提示：</strong>点击角色卡片即可一键登录进入对应工作台。
              admin → 运行总览 | editor → 内容管理 | enterprise → 招商对接 | pro → H5端
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
