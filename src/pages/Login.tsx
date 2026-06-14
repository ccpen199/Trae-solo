import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Car, AlertCircle, Shield, Wifi, KeyRound, XCircle } from 'lucide-react';
import { useAuthStore, getRoleDefaultRoute, ROLE_LABELS } from '@/stores/authStore';

type ErrorType = 'auth' | 'account' | 'permission' | 'network' | 'routing' | '';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; combined?: string }>({});
  const [apiError, setApiError] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>('');
  const [attemptedRole, setAttemptedRole] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setErrorType('');
    setAttemptedRole(null);

    const newErrors: { username?: string; password?: string; combined?: string } = {};
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser && !trimmedPass) {
      newErrors.combined = '请输入用户名和密码';
    } else if (!trimmedUser) {
      newErrors.username = '请输入用户名';
    } else if (!trimmedPass) {
      newErrors.password = '请输入密码';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const res = await login(username, password);
      const targetRoute = getRoleDefaultRoute(res.user.role);
      if (!targetRoute) {
        setApiError(`账号角色"${ROLE_LABELS[res.user.role] || res.user.role}"无可用路由，请联系管理员`);
        setErrorType('routing');
        setAttemptedRole(ROLE_LABELS[res.user.role] || res.user.role);
        return;
      }
      navigate(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败';

      if (msg.includes('用户名或密码错误')) {
        setApiError('用户名或密码错误，请检查输入后重试');
        setErrorType('auth');
      } else if (msg.includes('禁用') || msg.includes('锁定') || msg.includes('未启用')) {
        setApiError(msg);
        setErrorType('account');
      } else if (msg.includes('权限') || msg.includes('无权') || msg.includes('permission')) {
        setApiError(msg);
        setErrorType('permission');
        if (msg.includes('role')) {
          const roleMatch = msg.match(/role[:"\s]+([^"\s,}]+)/i);
          if (roleMatch) {
            setAttemptedRole(ROLE_LABELS[roleMatch[1]] || roleMatch[1]);
          }
        }
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('网络') || msg.includes('timeout')) {
        setApiError('无法连接到服务器，请检查网络连接或联系运维人员');
        setErrorType('network');
      } else if (msg.includes('过期') || msg.includes('Unauthorized')) {
        setApiError('登录会话已过期，请重新登录');
        setErrorType('account');
      } else {
        setApiError(msg);
        setErrorType('auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const errorConfig: Record<ErrorType, { icon: React.ReactNode; className: string; label: string }> = {
    auth: {
      icon: <KeyRound size={16} className="shrink-0" />,
      className: 'bg-danger/10 text-danger border-danger/20',
      label: '认证错误',
    },
    account: {
      icon: <Shield size={16} className="shrink-0" />,
      className: 'bg-info/10 text-info border-info/20',
      label: '账号状态',
    },
    permission: {
      icon: <XCircle size={16} className="shrink-0" />,
      className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      label: '权限不足',
    },
    network: {
      icon: <Wifi size={16} className="shrink-0" />,
      className: 'bg-warning/10 text-warning border-warning/20',
      label: '网络问题',
    },
    routing: {
      icon: <AlertCircle size={16} className="shrink-0" />,
      className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      label: '路由失败',
    },
    '': {
      icon: null,
      className: '',
      label: '',
    },
  };

  const demoAccounts = [
    { user: 'admin', pass: 'admin123', role: 'group_admin' },
    { user: 'platform', pass: 'platform123', role: 'branch_admin' },
    { user: 'ops', pass: 'ops123', role: 'dispatcher' },
  ];

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-surface-dark">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-info/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="dark-card border-primary/20 p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Car size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">车辆监控平台</h1>
            <p className="mt-2 text-sm text-gray-500">Vehicle Monitoring Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.combined && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errors.combined}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs text-gray-400">用户名</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrors((prev) => ({ ...prev, username: undefined, combined: undefined })); setApiError(''); setErrorType(''); setAttemptedRole(null); }}
                  className={`w-full rounded-lg border bg-surface-dark py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 transition-colors ${
                    errors.username || errors.combined ? 'border-danger focus:border-danger focus:ring-danger' : 'border-surface-border focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>
              {errors.username && !errors.combined && (
                <p className="mt-1 text-xs text-danger">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-400">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined, combined: undefined })); setApiError(''); setErrorType(''); setAttemptedRole(null); }}
                  className={`w-full rounded-lg border bg-surface-dark py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 transition-colors ${
                    errors.password || errors.combined ? 'border-danger focus:border-danger focus:ring-danger' : 'border-surface-border focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && !errors.combined && (
                <p className="mt-1 text-xs text-danger">{errors.password}</p>
              )}
            </div>

            {apiError && (
              <div className={`flex flex-col gap-1 rounded-lg border px-4 py-2.5 text-sm ${errorConfig[errorType].className}`}>
                <div className="flex items-center gap-2">
                  {errorConfig[errorType].icon}
                  <span className="font-medium">{errorConfig[errorType].label}：</span>
                  <span>{apiError}</span>
                </div>
                {attemptedRole && (
                  <div className="ml-6 text-xs opacity-80">
                    尝试登录角色：<span className="font-medium">{attemptedRole}</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-surface-dark hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 border-t border-surface-border pt-4">
            <p className="mb-2 text-center text-xs text-gray-500">演示账号</p>
            <div className="space-y-1.5">
              {demoAccounts.map((item) => (
                <button
                  key={item.user}
                  type="button"
                  onClick={() => { setUsername(item.user); setPassword(item.pass); setErrors({}); setApiError(''); setErrorType(''); setAttemptedRole(null); }}
                  className="flex w-full items-center justify-between rounded-lg border border-surface-border bg-surface-dark/50 px-3 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-surface-light/50"
                >
                  <span className="text-gray-400">
                    <span className="text-white font-medium">{item.user}</span> / {item.pass}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-primary font-medium">
                    <Shield size={10} />
                    {ROLE_LABELS[item.role]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
