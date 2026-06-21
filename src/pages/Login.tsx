import { useState, useEffect, useRef } from 'react';
import type { UserRole } from '../../shared/types.js';
import {
  Droplets, GraduationCap, Building2, Shield, Eye, EyeOff,
  AlertCircle, Loader2, CheckCircle2, Terminal, Zap, ArrowRight
} from 'lucide-react';

type StatusType = 'error' | 'warning' | 'info' | 'success';
type LogLevel = 'info' | 'success' | 'error' | 'warn';
interface LogEntry { id: number; level: LogLevel; text: string; time: string }

const ROLES: { value: UserRole; label: string; icon: JSX.Element; testAccount: string; testPwd: string }[] = [
  { value: 'student', label: '学生', icon: <GraduationCap size={22} />, testAccount: '2021001', testPwd: 'student123' },
  { value: 'investor', label: '投资商', icon: <Building2 size={22} />, testAccount: 'investor', testPwd: 'invest123' },
  { value: 'admin', label: '管理员', icon: <Shield size={22} />, testAccount: 'admin', testPwd: 'admin123' },
];

const ROLE_PATH: Record<UserRole, string> = {
  student: '/student',
  investor: '/investor',
  admin: '/admin',
};

async function rawLogin(account: string, password: string, role: UserRole) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, password, role }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [status, setStatus] = useState<{ type: StatusType; title: string; message: string } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const [showDebug, setShowDebug] = useState(true); // 默认显示调试面板，方便排查

  const addLog = (level: LogLevel, text: string) => {
    const id = ++logIdRef.current;
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs((prev) => [...prev.slice(-30), { id, level, text, time }]);
    console.log(`[Login:${level}] ${text}`);
  };

  // ===== 初始化 =====
  useEffect(() => {
    addLog('info', '🟢 登录页组件挂载完成');
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      addLog('info', `检查 localStorage: token=${token ? '存在' : '不存在'}, user=${userStr ? '存在' : '不存在'}`);
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user?.role && ROLE_PATH[user.role]) {
          addLog('success', `检测到已登录：${user.name} (${user.role})，自动跳转`);
          setTimeout(() => {
            window.location.href = ROLE_PATH[user.role as UserRole];
          }, 500);
          return;
        }
      }
    } catch (e) {
      addLog('error', `恢复登录状态异常: ${e}`);
    }
    handleRoleSelect('student');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStatus(null);
    const cfg = ROLES.find((r) => r.value === role);
    if (cfg) {
      setAccount(cfg.testAccount);
      setPassword(cfg.testPwd);
      addLog('info', `切换身份: ${cfg.label}`);
    }
  };

  const processError = (statusCode: number, message: string, acc: string, role: UserRole): { type: StatusType; title: string; message: string } => {
    const msg = message || '未知错误';
    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('network') || lowerMsg.includes('econnrefused')) {
      return {
        type: 'error',
        title: '🔌 网络连接失败',
        message: '无法连接到后端服务器。可能原因：Vite 代理未生效、后端服务未启动（端口 3002）',
      };
    }

    if (statusCode === 401 || lowerMsg.includes('账号或密码错误') || lowerMsg.includes('password') || lowerMsg.includes('invalid')) {
      const roleLabel = role === 'student' ? '学生' : role === 'investor' ? '投资商' : '管理员';
      const cfg = ROLES.find((r) => r.value === role);
      return {
        type: 'error',
        title: '❌ 账号或密码不正确',
        message: `账号 "${acc}" 与当前「${roleLabel}」身份不匹配，或密码错误。\n\n✅ ${roleLabel}正确凭证：${cfg?.testAccount} / ${cfg?.testPwd}`,
      };
    }

    if (statusCode === 400 || lowerMsg.includes('缺少') || lowerMsg.includes('参数') || lowerMsg.includes('required')) {
      return {
        type: 'warning',
        title: '⚠️ 信息不完整',
        message: '账号和密码均为必填项。',
      };
    }

    return {
      type: 'error',
      title: '登录失败',
      message: msg,
    };
  };

  // ===== 核心登录逻辑 =====
  const doLogin = async () => {
    setClickCount((c) => c + 1);
    const acc = account.trim();
    const pwd = password.trim();

    addLog('info', `👆 按钮被点击 (第 ${clickCount + 1} 次) — 账号="${acc}", 角色=${selectedRole}`);
    setStatus(null);

    if (!acc) {
      addLog('warn', '校验失败：账号为空');
      setStatus({ type: 'warning', title: '请输入账号', message: '账号不能为空' });
      return;
    }
    if (!pwd) {
      addLog('warn', '校验失败：密码为空');
      setStatus({ type: 'warning', title: '请输入密码', message: '密码不能为空' });
      return;
    }

    setLoading(true);
    addLog('info', '📤 发起请求: POST /api/auth/login');

    try {
      const result = await rawLogin(acc, pwd, selectedRole);
      addLog('info', `📥 收到响应: HTTP ${result.status}`);
      addLog('info', `响应体: ${JSON.stringify(result.data).slice(0, 200)}`);

      if (result.ok && result.data?.code === 200 && result.data?.data) {
        const { token, user } = result.data.data;
        addLog('success', `✅ 登录成功: ${user.name} (${user.role})`);

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        addLog('info', '💾 已写入 localStorage');

        const roleLabel = user.role === 'student' ? '学生' : user.role === 'investor' ? '投资商' : '管理员';
        setStatus({
          type: 'success',
          title: '🎉 登录成功',
          message: `欢迎，${user.name}！正在跳转到${roleLabel}工作台...`,
        });

        const target = ROLE_PATH[user.role as UserRole] || '/student';
        addLog('info', `🚀 即将跳转到: ${target}`);

        // 多重保险：三种跳转方式一起用，确保一定能跳过去
        setTimeout(() => {
          addLog('info', '执行 window.location.href 跳转');
          window.location.href = target;
        }, 400);

        setTimeout(() => {
          addLog('warn', '备用方案2: window.location.replace');
          window.location.replace(target);
        }, 800);

        setTimeout(() => {
          addLog('error', '前两次跳转都没生效？尝试 window.location.assign');
          window.location.assign(target);
        }, 1200);

      } else {
        const errMsg = result.data?.message || `HTTP ${result.status}`;
        addLog('error', `❌ 登录失败: ${errMsg}`);
        const processed = processError(result.status, errMsg, acc, selectedRole);
        setStatus(processed);
      }
    } catch (err: any) {
      addLog('error', `💥 请求异常: ${err?.message || String(err)}`);
      const processed = processError(0, err?.message || String(err), acc, selectedRole);
      setStatus(processed);
    } finally {
      setLoading(false);
      addLog('info', '⏹️ 请求结束，loading=false');
    }
  };

  // 测试跳转（不调用 API，直接写 localStorage 模拟登录，验证跳转链路
  const testJump = (role: UserRole) => {
    addLog('info', `🧪 测试跳转模式: ${role} (不调用 API)`);
    const mockUser = {
      id: 'test',
      name: `测试${role === 'student' ? '学生' : role === 'investor' ? '投资商' : '管理员'}`,
      role,
      phone: '13800000000',
    };
    localStorage.setItem('token', 'test-token-123');
    localStorage.setItem('user', JSON.stringify(mockUser));
    addLog('success', `已写入测试用户: ${mockUser.name}`);
    addLog('info', `准备跳转到: ${ROLE_PATH[role]}`);
    setTimeout(() => {
      window.location.href = ROLE_PATH[role];
    }, 300);
  };

  const statusStyle = (type: StatusType) => {
    switch (type) {
      case 'error': return 'bg-rose-500/25 border-rose-500/60 text-rose-200';
      case 'warning': return 'bg-amber-500/25 border-amber-500/60 text-amber-200';
      case 'info': return 'bg-sky-500/25 border-sky-500/60 text-sky-200';
      case 'success': return 'bg-emerald-500/25 border-emerald-500/60 text-emerald-200';
    }
  };

  const logColor = (level: LogLevel) => {
    switch (level) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-rose-400';
      case 'warn': return 'text-amber-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-water-texture-dark flex flex-col items-center justify-center p-4 relative">

      {/* ========== 调试面板 — 默认展开，方便排查 */}
      {showDebug && (
        <div className="w-full max-w-5xl mb-4 rounded-xl bg-slate-900/90 border border-slate-700 backdrop-blur p-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-mono text-emerald-400 flex items-center gap-2">
              <Terminal size={16} />
              🔍 登录流程实时调试面板 — 点击登录按钮后看这里
            </div>
            <button
              onClick={() => setShowDebug(false)}
              className="text-xs text-white/50 hover:text-white/80 px-2 py-1 rounded hover:bg-white/10"
            >
              收起
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="text-white/40 mb-1">当前账号</div>
              <div className="text-white font-mono">{account || '(空)'}</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="text-white/40 mb-1">当前角色</div>
              <div className="text-white font-mono">{selectedRole}</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="text-white/40 mb-1">点击次数</div>
              <div className="text-white font-mono">{clickCount}</div>
            </div>
          </div>
          <div className="font-mono text-xs space-y-0.5 max-h-52 overflow-y-auto bg-black/40 p-3 rounded-lg">
            {logs.length === 0 ? (
              <div className="text-white/30 italic">等待操作...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`${logColor(log.level)}`}>
                  <span className="text-white/30">[{log.time}]</span> {log.text}
                </div>
              ))
            )}
          </div>

          {/* 快速测试按钮 */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
            <span className="text-xs text-white/40 mr-2">🧪 快速测试（不调 API）：</span>
            <button
              onClick={() => testJump('student')}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              模拟学生登录跳转
            </button>
            <button
              onClick={() => testJump('investor')}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              模拟投资商跳转
            </button>
            <button
              onClick={() => testJump('admin')}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              模拟管理员跳转
            </button>
            <button
              onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); addLog('info', '已清除 localStorage'); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
            >
              清除登录状态
            </button>
          </div>
        </div>
      )}

      {!showDebug && (
        <button
          onClick={() => setShowDebug(true)}
          className="absolute top-4 right-4 z-50 px-3 py-2 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 hover:text-white/80 transition-all flex items-center gap-2"
        >
          <Terminal size={14} />
          展开调试台
        </button>
      )}

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
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md w-full">
            {ROLES.map((r) => (
              <div key={r.value} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="flex justify-center mb-1.5 text-aqua-300">{r.icon}</div>
                <div className="text-xs text-aqua-200/80">{r.label}</div>
                <div className="text-[10px] text-white/40 mt-1 font-mono">{r.testAccount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="glass-card-dark p-8 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">账号登录</h2>
              <p className="text-sm text-white/50 mt-1">选择身份 → 输入凭证 → 进入工作台</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aqua-400 to-deep-blue-600 flex items-center justify-center lg:hidden">
              <Droplets size={20} className="text-white" />
            </div>
          </div>

          {/* 角色选择 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {ROLES.map((r) => {
              const active = selectedRole === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRoleSelect(r.value)}
                  className={`p-4 rounded-xl text-center transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-br from-aqua-500 to-deep-blue-600 text-white shadow-glow-aqua scale-105 ring-2 ring-aqua-300/40'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="flex justify-center mb-2">{r.icon}</div>
                  <div className="text-sm font-medium">{r.label}</div>
                </button>
              );
            })}
          </div>

          {/* 账号输入 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
              账号
              <span className="text-white/40 ml-2">
                {selectedRole === 'student' ? '（学号）' : selectedRole === 'investor' ? '（投资商）' : '（管理员）'}
              </span>
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => { setAccount(e.target.value); if (status) setStatus(null); }}
              placeholder="请输入账号"
              autoComplete="username"
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border-2 border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-aqua-400 focus:bg-white/15 transition-all text-sm font-mono"
            />
          </div>

          {/* 密码输入 */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (status) setStatus(null); }}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="w-full px-4 py-3.5 pr-14 rounded-xl bg-white/10 border-2 border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-aqua-400 focus:bg-white/15 transition-all text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/90 transition-colors p-1 rounded"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 状态提示 */}
          {status && (
            <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border-2 ${statusStyle(status.type)}`}>
              {status.type === 'success' ? (
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed whitespace-pre-wrap">
                <div className="font-bold text-base mb-1">{status.title}</div>
                <div className="opacity-95">{status.message}</div>
              </div>
            </div>
          )}

          {/* 登录按钮 — 同时绑定 onClick，不依赖 form submit */}
          <button
            type="button"
            onClick={doLogin}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-aqua-500 to-deep-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-glow-aqua hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3 select-none"
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span>正在登录...</span>
              </>
            ) : (
              <>
                <Zap size={20} />
                <span>登 录 工 作 台</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {/* 测试凭证 */}
          <div className="pt-3 border-t border-white/5">
            <div className="text-xs text-white/50 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-white/30 w-14">学生:</span>
                <code className="text-white/60 bg-white/5 px-2 py-0.5 rounded">2021001 / student123</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30 w-14">投资商:</span>
                <code className="text-white/60 bg-white/5 px-2 py-0.5 rounded">investor / invest123</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30 w-14">管理员:</span>
                <code className="text-white/60 bg-white/5 px-2 py-0.5 rounded">admin / admin123</code>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
