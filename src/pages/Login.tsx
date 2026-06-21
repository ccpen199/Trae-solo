import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api.ts';
import type { UserRole } from '../../shared/types.js';
import { Droplets, GraduationCap, Building2, Shield, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

type ErrorCategory = 'error' | 'warning' | 'info' | 'success';

const roles: { value: UserRole; label: string; icon: JSX.Element; description: string; testAccount: string; testPwd: string }[] = [
  { value: 'student', label: '学生用户', icon: <GraduationCap size={24} />, description: '用水、充值、查账单', testAccount: '2021001', testPwd: 'student123' },
  { value: 'investor', label: '投资商', icon: <Building2 size={24} />, description: '设备管理、收益结算', testAccount: 'investor', testPwd: 'invest123' },
  { value: 'admin', label: '管理员', icon: <Shield size={24} />, description: '系统管理、数据监控', testAccount: 'admin', testPwd: 'admin123' },
];

const ROLE_PATH: Record<UserRole, string> = {
  student: '/student',
  investor: '/investor',
  admin: '/admin',
};

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ type: ErrorCategory; title: string; message: string } | null>(null);

  // 页面加载时：如果 localStorage 有登录信息，直接跳转到对应工作台
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user && user.role && ROLE_PATH[user.role as UserRole]) {
          console.log('[Login] 检测到已登录状态，直接跳转:', user.role);
          navigate(ROLE_PATH[user.role as UserRole], { replace: true });
          return;
        }
      }
    } catch (e) {
      console.warn('[Login] 恢复登录状态失败，清除本地缓存');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    // 如果没有已登录信息，根据默认角色填入测试账号方便测试
    handleRoleSelect(selectedRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    const cfg = roles.find((r) => r.value === role);
    if (cfg) {
      setAccount(cfg.testAccount);
      setPassword(cfg.testPwd);
    }
  };

  const processError = (rawMsg: string, acc: string, role: UserRole): { type: ErrorCategory; title: string; message: string } => {
    const msg = rawMsg || '未知错误';
    const lowerMsg = msg.toLowerCase();

    // 网络错误
    if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('network') || lowerMsg.includes('网络') || lowerMsg.includes('econnrefused')) {
      return {
        type: 'error',
        title: '网络连接失败',
        message: '无法连接到后端服务器。请检查后端服务是否启动（端口 3002），或稍后重试。',
      };
    }

    // 账号或密码错误 - 从后端返回的 401 精确判断
    if (lowerMsg.includes('账号或密码错误') || (lowerMsg.includes('password') || lowerMsg.includes('密码') || lowerMsg.includes('invalid credential'))) {
      const validAccounts = {
        student: '学号 2021001-2021005，密码 student123',
        investor: '账号 investor，密码 invest123',
        admin: '账号 admin，密码 admin123',
      }[role];
      return {
        type: 'error',
        title: '账号或密码不正确',
        message: `您输入的账号 "${acc}" 与当前选择的「${role === 'student' ? '学生' : role === 'investor' ? '投资商' : '管理员'}」身份不匹配，或密码错误。${role === 'student' ? '学生' : role === 'investor' ? '投资商' : '管理员'}测试凭证：${validAccounts}`,
      };
    }

    // 缺少参数
    if (lowerMsg.includes('缺少') || lowerMsg.includes('参数') || lowerMsg.includes('required')) {
      return {
        type: 'warning',
        title: '请完整填写信息',
        message: '账号和密码均为必填项，请检查后重新提交。',
      };
    }

    // 角色不匹配
    if (lowerMsg.includes('role') || lowerMsg.includes('角色')) {
      return {
        type: 'warning',
        title: '身份不匹配',
        message: `账号 "${acc}" 不属于「${role === 'student' ? '学生' : role === 'investor' ? '投资商' : '管理员'}」角色。请切换到正确的身份后再登录。`,
      };
    }

    // 未知错误
    return {
      type: 'error',
      title: '登录失败',
      message: msg,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Step 1: 本地校验
    const trimmedAccount = account.trim();
    const trimmedPassword = password.trim();

    if (!trimmedAccount) {
      setError({ type: 'warning', title: '缺少账号', message: '请输入登录账号，学生请输入学号，投资商请输入投资商账号。' });
      return;
    }
    if (!trimmedPassword) {
      setError({ type: 'warning', title: '缺少密码', message: '请输入账号对应的密码。测试密码：学生 student123 / 投资商 invest123 / 管理员 admin123' });
      return;
    }
    if (trimmedPassword.length < 6) {
      setError({ type: 'warning', title: '密码长度不足', message: '密码长度至少 6 位，请检查。默认测试密码长度均为 8 位以上。' });
      return;
    }

    // Step 2: 调用 API
    setLoading(true);
    console.log(`[Login] 尝试登录: 账号=${trimmedAccount}, 角色=${selectedRole}`);

    try {
      const result = await authApi.login({
        account: trimmedAccount,
        password: trimmedPassword,
        role: selectedRole,
      });

      console.log(`[Login] 登录成功: 用户=${result.user.name}, 角色=${result.user.role}`);

      // Step 3: 保存登录状态 - 直接写 localStorage，不依赖 Zustand 的 action 时序
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Step 4: 显示成功提示并跳转
      const targetPath = ROLE_PATH[result.user.role as UserRole] || '/student';
      setError({
        type: 'success',
        title: '登录成功',
        message: `欢迎回来，${result.user.name}！正在进入${result.user.role === 'student' ? '学生' : result.user.role === 'investor' ? '投资商' : '管理员'}工作台...`,
      });

      // 短暂延迟让用户看到成功提示，然后跳转
      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 500);

    } catch (err: any) {
      console.error('[Login] 登录异常:', err);
      const processed = processError(err?.message || String(err), trimmedAccount, selectedRole);
      setError(processed);
    } finally {
      setLoading(false);
    }
  };

  const getErrorStyle = (type: ErrorCategory) => {
    switch (type) {
      case 'error':
        return 'bg-vibrant-orange-500/20 border-vibrant-orange-500/40 text-vibrant-orange-200';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200';
      case 'info':
        return 'bg-aqua-500/20 border-aqua-500/40 text-aqua-200';
      case 'success':
        return 'bg-green-500/20 border-green-500/40 text-green-200';
    }
  };

  const getIcon = (type: ErrorCategory) => {
    if (type === 'success') return <CheckCircle2 size={18} className="shrink-0 mt-0.5" />;
    return <AlertCircle size={18} className="shrink-0 mt-0.5" />;
  };

  return (
    <div className="min-h-screen bg-water-texture-dark flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* 左侧品牌区 */}
        <div className="hidden lg:flex flex-col items-center justify-center text-white">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-aqua-400 to-deep-blue-600 flex items-center justify-center shadow-2xl animate-float">
              <Droplets size={56} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="absolute inset-0 rounded-full bg-aqua-400/30 animate-ripple" />
            <div className="absolute inset-0 rounded-full bg-aqua-400/20 animate-ripple" style={{ animationDelay: '0.7s' }} />
          </div>
          <h1 className="text-4xl font-display font-bold mb-3 text-center bg-gradient-to-r from-aqua-300 to-white bg-clip-text text-transparent">
            无感用水物联网平台
          </h1>
          <p className="text-aqua-100/80 text-center max-w-md leading-relaxed">
            NFC · 蓝牙 · 二维码 三模识别接入
            <br />
            支付宝/微信支付深度打通 · 校园一卡通实时同步
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md w-full">
            {roles.map((r) => (
              <div key={r.value} className="p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10 text-center">
                <div className="flex justify-center mb-2 text-aqua-300">{r.icon}</div>
                <div className="text-xs text-aqua-200/80">{r.label}</div>
                <div className="text-[10px] text-white/40 mt-1 font-mono">{r.testAccount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="glass-card-dark p-8 backdrop-blur-2xl">
          <h2 className="text-2xl font-display font-bold text-white mb-2">账号登录</h2>
          <p className="text-sm text-white/50 mb-6">请选择身份后输入凭证</p>

          {/* 角色选择 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((r) => {
              const active = selectedRole === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRoleSelect(r.value)}
                  className={`p-4 rounded-xl text-center transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-br from-aqua-500 to-deep-blue-600 text-white shadow-glow-aqua scale-105 ring-2 ring-aqua-300/40'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-center mb-2">{r.icon}</div>
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className={`text-[10px] mt-1 ${active ? 'text-white/80' : 'text-white/40'}`}>
                    {r.testAccount}
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* 账号输入 */}
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                账号
                <span className="text-white/40 ml-2">
                  {selectedRole === 'student' ? '（学号）' : selectedRole === 'investor' ? '（投资商标识）' : '（管理员标识）'}
                </span>
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => { setAccount(e.target.value); if (error) setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                placeholder={selectedRole === 'student' ? '请输入学号，如 2021001' : '请输入账号'}
                autoComplete="username"
                className="w-full px-4 py-3.5 rounded-xl bg-white/10 border-2 border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-aqua-400 focus:bg-white/15 transition-all text-sm"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm text-white/70 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 pr-14 rounded-xl bg-white/10 border-2 border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-aqua-400 focus:bg-white/15 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/90 transition-colors p-1 rounded"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 错误 / 成功提示 */}
            {error && (
              <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${getErrorStyle(error.type)}`}>
                {getIcon(error.type)}
                <div className="leading-relaxed">
                  <div className="font-semibold text-base mb-1">{error.title}</div>
                  <div className="opacity-90">{error.message}</div>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-aqua-500 to-deep-blue-600 text-white font-semibold text-base shadow-lg hover:shadow-glow-aqua hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>正在登录，请稍候...</span>
                </>
              ) : (
                <span>登 录 工 作 台</span>
              )}
            </button>

            {/* 快捷提示 */}
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">
                  测试账号：<span className="text-white/60 font-mono">{roles.find((r) => r.value === selectedRole)?.testAccount}</span>
                </span>
                <span className="text-white/40">
                  测试密码：<span className="text-white/60 font-mono">{roles.find((r) => r.value === selectedRole)?.testPwd}</span>
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
