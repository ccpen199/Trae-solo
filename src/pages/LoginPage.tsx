import { useState, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Phone,
  Shield,
  Truck,
  UserCog,
  ArrowRight,
  Route,
  Boxes,
  Navigation,
  Zap,
  Activity,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
  Info,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface RoleTab {
  key: UserRole;
  label: string;
  subLabel: string;
  icon: LucideIcon;
  phone: string;
  defaultRoute: string;
  desc: string;
  color: string;
}

const DEMO_PHONES: Record<UserRole, string> = {
  SHIPPER: '13800000001',
  DRIVER: '13800000002',
  ADMIN: '021-88880000',
};

const DEMO_ROLE_ALIASES: Record<string, UserRole> = {
  shipper: 'SHIPPER',
  user: 'SHIPPER',
  cargo: 'SHIPPER',
  driver: 'DRIVER',
  admin: 'ADMIN',
  ops: 'ADMIN',
  platform: 'ADMIN',
  test: 'ADMIN',
};

const roleTabs: RoleTab[] = [
  {
    key: 'SHIPPER',
    label: '货主',
    subLabel: 'SHIPPER',
    icon: Boxes,
    phone: DEMO_PHONES.SHIPPER,
    defaultRoute: '/shipper/dashboard',
    desc: '发布货源 · 追踪订单 · 保险服务',
    color: 'orange',
  },
  {
    key: 'DRIVER',
    label: '司机',
    subLabel: 'DRIVER',
    icon: Truck,
    phone: DEMO_PHONES.DRIVER,
    defaultRoute: '/driver/dashboard',
    desc: '订单大厅 · 接单配送 · 收入统计',
    color: 'cyan',
  },
  {
    key: 'ADMIN',
    label: '运营管理员',
    subLabel: 'ADMIN / OPS',
    icon: UserCog,
    phone: DEMO_PHONES.ADMIN,
    defaultRoute: '/admin/overview',
    desc: '智能调度 · 运力监控 · 全局管理',
    color: 'green',
  },
];

const VALID_CODES = ['888888', '666666', '123456'];

function cleanPhone(p: string): string {
  return p.replace(/[\s\-]/g, '');
}

function matchRoleByPhone(phone: string): UserRole | null {
  const c = cleanPhone(phone);
  if (c === cleanPhone(DEMO_PHONES.SHIPPER)) return 'SHIPPER';
  if (c === cleanPhone(DEMO_PHONES.DRIVER)) return 'DRIVER';
  if (c === cleanPhone(DEMO_PHONES.ADMIN)) return 'ADMIN';
  const alias = c.toLowerCase();
  if (DEMO_ROLE_ALIASES[alias]) return DEMO_ROLE_ALIASES[alias];
  return null;
}

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('SHIPPER');
  const [phone, setPhone] = useState<string>(DEMO_PHONES.SHIPPER);
  const [code, setCode] = useState<string>('888888');
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const loginFn = useAuthStore((s) => s.login);
  const storeUser = useAuthStore((s) => s.user);
  const storeAuth = useAuthStore((s) => s.isAuthenticated);
  const storeRole = useAuthStore((s) => s.currentRole);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const currentTab = roleTabs.find((t) => t.key === activeRole)!;

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setDebugLog((prev) => [...prev.slice(-20), `[${ts}] ${msg}`]);
    console.log(`[LoginPage] ${msg}`);
  };

  useEffect(() => {
    const el = tabRefs.current[activeRole];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeRole]);

  useEffect(() => {
    const tab = roleTabs.find((t) => t.key === activeRole);
    if (tab) {
      setPhone(tab.phone);
      setCode('888888');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [activeRole]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const doLogin = (targetRole: UserRole) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    addLog(`开始登录: role=${targetRole}, phone=${DEMO_PHONES[targetRole]}`);

    try {
      addLog('调用 loginFn()...');
      const result = loginFn(targetRole, DEMO_PHONES[targetRole]);
      addLog(`loginFn() 返回: success=${result.success}, error=${result.error || 'none'}`);

      if (!result.success) {
        setLoading(false);
        setErrorMsg(`认证写入失败: ${result.error || '未知错误'}`);
        addLog(`失败: ${result.error}`);
        return;
      }

      addLog('认证成功，检查 store 状态...');
      const state = useAuthStore.getState();
      addLog(`store: auth=${state.isAuthenticated}, user=${state.user?.name}, role=${state.user?.role}`);

      if (!state.isAuthenticated || !state.user) {
        setLoading(false);
        setErrorMsg('Store 状态异常: isAuthenticated 为 false 或 user 为 null');
        addLog('Store 状态异常!');
        return;
      }

      const targetPath = roleTabs.find((t) => t.key === targetRole)!.defaultRoute;
      setSuccessMsg(`登录成功! 角色=${state.user.role}, 即将跳转到 ${targetPath}`);
      addLog(`准备跳转: ${targetPath}`);

      setTimeout(() => {
        addLog(`执行 window.location.href = ${targetPath}`);
        window.location.href = targetPath;
      }, 500);

    } catch (e: any) {
      setLoading(false);
      const msg = e?.message || String(e);
      setErrorMsg(`登录异常: ${msg}`);
      addLog(`异常: ${msg}`);
      console.error('[LoginPage] doLogin exception:', e);
    }
  };

  const handleLogin = () => {
    setErrorMsg('');
    setSuccessMsg('');
    addLog('--- 点击进入系统 ---');

    const cleanP = cleanPhone(phone);
    const matchedRole = matchRoleByPhone(phone);

    if (!cleanP) {
      setErrorMsg('请输入账号');
      return;
    }

    const isMobile = /^1[3-9]\d{9}$/.test(cleanP);
    const isLandline = /^0\d{10,11}$/.test(cleanP);
    if (!isMobile && !isLandline && !matchedRole) {
      setErrorMsg('账号格式不正确（支持手机号、固定电话或演示别名 admin/shipper/driver）');
      return;
    }
    addLog(`账号格式校验通过: ${cleanP}`);

    if (!code.trim()) {
      setErrorMsg('请输入验证码');
      return;
    }
    if (code.trim().length < 3) {
      setErrorMsg('验证码至少3位');
      return;
    }
    if (!VALID_CODES.includes(code) && !/^[A-Za-z0-9@#$%^&*().!~-]{3,60}$/.test(code)) {
      setErrorMsg('验证码错误，演示验证码: 888888');
      return;
    }
    addLog('验证码校验通过');

    if (!matchedRole) {
      setErrorMsg(`该账号未注册。演示账号: 货主 ${DEMO_PHONES.SHIPPER} / 司机 ${DEMO_PHONES.DRIVER} / 管理员 ${DEMO_PHONES.ADMIN}`);
      addLog(`账号未匹配: ${cleanP}`);
      return;
    }
    addLog(`账号匹配角色: ${matchedRole}`);

    if (matchedRole !== activeRole) {
      addLog(`角色不匹配: 选中=${activeRole}, 实际=${matchedRole}, 自动切换`);
      setSuccessMsg(`该账号属于「${roleTabs.find((t) => t.key === matchedRole)?.label}」，已自动切换`);
      setActiveRole(matchedRole);
      setTimeout(() => doLogin(matchedRole), 300);
      return;
    }

    doLogin(activeRole);
  };

  const handleQuickLogin = (role: UserRole) => {
    setActiveRole(role);
    setErrorMsg('');
    setSuccessMsg('');
    addLog(`--- 一键登录: ${role} ---`);
    setTimeout(() => doLogin(role), 200);
  };

  const handleSendCode = () => {
    const cleanP = cleanPhone(phone);
    const isMobile = /^1[3-9]\d{9}$/.test(cleanP);
    const isLandline = /^0\d{10,11}$/.test(cleanP);
    if (!isMobile && !isLandline) {
      setErrorMsg('账号格式不正确');
      return;
    }
    const matched = matchRoleByPhone(phone);
    if (!matched) {
      setErrorMsg('该账号未注册');
      return;
    }
    if (matched !== activeRole) {
      setErrorMsg(`该账号属于「${roleTabs.find((t) => t.key === matched)?.label}」，请切换Tab或直接登录`);
      return;
    }
    setErrors([]);
    setCountdown(60);
    setCode('888888');
    setSuccessMsg('验证码已发送: 888888');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const [errors, setErrors] = useState<string[]>([]);

  const handleResetState = () => {
    localStorage.removeItem('tc_auth_state');
    window.location.reload();
  };

  const handleForceNavigate = () => {
    window.location.href = currentTab.defaultRoute;
  };

  const getColorClass = (type: 'bg' | 'text' | 'border') => {
    if (type === 'bg') {
      return currentTab.color === 'orange' ? 'bg-orange-500' :
             currentTab.color === 'cyan' ? 'bg-cyan-500' : 'bg-emerald-500';
    }
    if (type === 'text') {
      return currentTab.color === 'orange' ? 'text-orange-500' :
             currentTab.color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400';
    }
    if (type === 'border') {
      return currentTab.color === 'orange' ? 'border-orange-500' :
             currentTab.color === 'cyan' ? 'border-cyan-500' : 'border-emerald-500';
    }
    return '';
  };

  return (
    <div className="min-h-screen w-full flex bg-ink-950 overflow-hidden">
      {/* HERO */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[58%] relative overflow-hidden border-r border-ink-700/40">
        <div className="absolute inset-0 data-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-900/95 to-ink-950" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent animate-scan" />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          {[
            { x: '8%', y: '18%', delay: '0s', dur: '22s', icon: Truck, size: 28, color: 'text-orange-500/70' },
            { x: '72%', y: '12%', delay: '3s', dur: '28s', icon: Route, size: 24, color: 'text-signal-cyan/60' },
            { x: '15%', y: '68%', delay: '5s', dur: '25s', icon: Navigation, size: 22, color: 'text-signal-green/60' },
            { x: '82%', y: '58%', delay: '2s', dur: '30s', icon: Boxes, size: 26, color: 'text-signal-blue/60' },
            { x: '48%', y: '82%', delay: '7s', dur: '26s', icon: Zap, size: 20, color: 'text-signal-yellow/60' },
            { x: '60%', y: '38%', delay: '1s', dur: '24s', icon: Activity, size: 22, color: 'text-orange-500/50' },
          ].map((item, i) => (
            <div
              key={i}
              className={`absolute ${item.color} floating-vehicles`}
              style={{ left: item.x, top: item.y, animationDelay: item.delay, animationDuration: item.dur }}
            >
              <item.icon size={item.size} />
            </div>
          ))}
        </div>
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-25%] right-[-10%] w-[600px] h-[600px] rounded-full bg-signal-cyan/8 blur-[140px]" />
        <div className="relative z-10 flex flex-col justify-between px-14 xl:px-20 py-16 w-full">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center rounded-sm bg-gradient-to-br from-orange-500 to-orange-550 shadow-glow-orange-sm">
              <Truck size={26} className="text-white" />
              <div className="absolute -right-1 -bottom-1 w-3.5 h-3.5 bg-signal-green rounded-full border-2 border-ink-950 animate-pulse-slow" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-white tracking-wider">运联·智调</div>
              <div className="text-[10px] font-mono text-slate-500 tracking-[0.3em]">TRANSPORT INTELLIGENCE</div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="hex-tag !text-[11px] !px-3 !py-1.5">v2.6.0 · AI-POWERED DISPATCH ENGINE</span>
              <h1 className="font-display font-black text-5xl xl:text-6xl leading-[1.1] text-white tracking-tight">
                同城货运<br />
                <span className="bg-gradient-to-r from-orange-450 via-orange-500 to-orange-550 bg-clip-text text-transparent">智能调度</span> SaaS平台
              </h1>
              <p className="text-slate-400 text-base max-w-lg leading-relaxed">
                基于 AI 算法实时匹配货主与司机，支持冷链温控、多站点配送、履约全链路核验，为同城货运提供端到端的数字化解决方案。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-xl">
              {[
                { label: 'AI 智能匹配', sub: '≤ 60s 派单', icon: Zap, color: 'orange' },
                { label: '冷链监控', sub: '全链路温控', icon: Activity, color: 'cyan' },
                { label: '履约核验', sub: '四重质检', icon: Shield, color: 'green' },
              ].map((f) => (
                <div key={f.label} className="p-4 bg-ink-900/60 backdrop-blur-sm rounded-sm border border-ink-700/50 space-y-1.5">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-sm ${f.color === 'orange' ? 'bg-orange-500/15 text-orange-500' : f.color === 'cyan' ? 'bg-signal-cyan/15 text-signal-cyan' : 'bg-signal-green/15 text-signal-green'}`}>
                    <f.icon size={16} />
                  </div>
                  <div className="text-sm font-semibold text-white">{f.label}</div>
                  <div className="text-[10px] font-mono text-slate-500">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-8 pt-8 border-t border-ink-700/30">
            {[
              { value: '12,860', label: '日均订单' },
              { value: '2,400+', label: '在网司机' },
              { value: '99.6%', label: '履约率' },
              { value: '≤ 48s', label: '平均派单' },
            ].map((s) => (
              <div key={s.label} className="space-y-0.5">
                <div className="font-display font-bold text-lg text-white">{s.value}</div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes floating-vehicles {
            0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
            25% { transform: translate(20px, -15px) rotate(2deg); opacity: 1; }
            50% { transform: translate(40px, 10px) rotate(-1deg); opacity: 0.8; }
            75% { transform: translate(15px, 20px) rotate(1deg); opacity: 0.9; }
          }
          .floating-vehicles { animation-name: floating-vehicles; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        `}</style>
      </div>

      {/* 登录卡片 */}
      <div className="flex-1 flex items-center justify-center px-6 py-6 relative overflow-y-auto">
        <div className="absolute inset-0 data-grid opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative w-full max-w-xl">
          <div className="industrial-card p-6 xl:p-7 backdrop-blur-xl bg-ink-900/70">
            <div className="corner-brackets absolute inset-0 pointer-events-none" />

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                {loading ? <Loader2 size={14} className="animate-spin text-signal-cyan" /> :
                 errorMsg ? <XCircle size={14} className="text-signal-red" /> :
                 successMsg ? <CheckCircle2 size={14} className="text-signal-green" /> :
                 <span className="status-dot bg-signal-green animate-pulse-fast" />}
                <span className="text-[10px] font-mono text-slate-500 tracking-widest">
                  {loading ? 'AUTHENTICATING...' :
                   errorMsg ? 'LOGIN FAILED' :
                   successMsg ? 'VERIFICATION PASSED' :
                   'SYSTEM ONLINE · AUTH TERMINAL'}
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl text-white tracking-wide mb-1">账号登录</h2>
              <p className="text-xs text-slate-400 font-mono">请选择角色并输入对应账号信息</p>
            </div>

            {/* 实时状态监控 */}
            <div className="mb-5 p-3 bg-ink-950/80 border border-ink-700/60 rounded-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <Terminal size={13} className="text-signal-cyan" />
                <span className="text-[10px] font-mono text-signal-cyan tracking-wide">REAL-TIME AUTH MONITOR</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">认证状态</span>
                  <span className={storeAuth ? 'text-signal-green' : 'text-signal-red'}>
                    {storeAuth ? `已认证 ✓ (${storeRole})` : '未认证 ✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">当前用户</span>
                  <span className="text-slate-300">{storeUser?.name ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">选择角色</span>
                  <span className={getColorClass('text')}>{activeRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">LocalStorage</span>
                  <span className={typeof window !== 'undefined' && localStorage.getItem('tc_auth_state') ? 'text-signal-green' : 'text-signal-red'}>
                    {typeof window !== 'undefined' && localStorage.getItem('tc_auth_state') ? '存在 ✓' : '不存在 ✗'}
                  </span>
                </div>
              </div>
              {/* 调试日志 */}
              <div className="p-2 bg-ink-950/60 border border-ink-700/40 rounded-sm max-h-32 overflow-y-auto">
                <div className="text-[9px] font-mono text-slate-600 mb-1">DEBUG LOG (最近{debugLog.length}条):</div>
                {debugLog.length === 0 && <div className="text-[9px] font-mono text-slate-600">暂无日志</div>}
                {debugLog.map((log, i) => (
                  <div key={i} className={`text-[9px] font-mono leading-tight ${
                    log.includes('失败') || log.includes('异常') || log.includes('FAIL') ? 'text-signal-red' :
                    log.includes('成功') || log.includes('SUCCESS') ? 'text-signal-green' :
                    'text-slate-500'
                  }`}>{log}</div>
                ))}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-ink-700/40">
                <button onClick={handleResetState} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-slate-400 border border-ink-600 hover:border-ink-500 hover:text-white rounded-sm transition-all">
                  <RotateCcw size={11} /> 重置状态
                </button>
                <button onClick={handleForceNavigate} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-white bg-gradient-to-br from-orange-500 to-orange-600 hover:shadow-[0_0_12px_rgba(249,115,22,0.4)] rounded-sm transition-all">
                  <ArrowRight size={11} /> 强制跳转 {currentTab.defaultRoute}
                </button>
              </div>
            </div>

            {/* 角色 Tab */}
            <div className="relative mb-5">
              <div className="flex bg-ink-950/50 rounded-sm border border-ink-700/50 p-1 relative">
                <div
                  className="absolute top-1 bottom-1 rounded-sm transition-all duration-300 ease-out"
                  style={{
                    left: indicatorStyle.left + 4,
                    width: indicatorStyle.width - 8,
                    background: currentTab.color === 'orange' ? 'linear-gradient(to right, rgba(249,115,22,0.2), rgba(234,88,12,0.1))'
                      : currentTab.color === 'cyan' ? 'linear-gradient(to right, rgba(6,182,212,0.2), rgba(6,182,212,0.1))'
                      : 'linear-gradient(to right, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                    borderWidth: '1px',
                    borderColor: currentTab.color === 'orange' ? 'rgba(249,115,22,0.4)'
                      : currentTab.color === 'cyan' ? 'rgba(6,182,212,0.4)'
                      : 'rgba(16,185,129,0.4)',
                  }}
                />
                {roleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeRole === tab.key;
                  const activeColor = tab.color === 'orange' ? 'text-orange-500' : tab.color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400';
                  return (
                    <button
                      key={tab.key}
                      ref={(el) => { tabRefs.current[tab.key] = el; }}
                      onClick={() => setActiveRole(tab.key)}
                      className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-sm z-10 transition-all duration-200 ${active ? activeColor : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Icon size={18} className={active ? 'opacity-100' : 'opacity-70'} />
                      <span className="text-xs font-semibold">{tab.label}</span>
                      <span className="text-[9px] font-mono opacity-60 tracking-wider">{tab.subLabel}</span>
                    </button>
                  );
                })}
              </div>
              <div className={`mt-3 px-3 py-2 bg-ink-950/40 border-l-2 rounded-r-sm ${getColorClass('border')}`}>
                <div className="flex items-start gap-2">
                  <Info size={13} className={`mt-0.5 shrink-0 ${getColorClass('text')}`} />
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">{currentTab.desc}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      演示账号：<span className={getColorClass('text')}>{currentTab.phone}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 错误/成功消息 */}
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
                <XCircle size={14} className="text-signal-red shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300 leading-relaxed">{errorMsg}</p>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
                <CheckCircle2 size={14} className="text-signal-green shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 leading-relaxed">{successMsg}</p>
              </div>
            )}

            {/* 表单 */}
            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">账号 / ACCOUNT</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="account"
                    aria-label="账号"
                    autoComplete="username"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrorMsg(''); }}
                    className="input-industrial pl-10 py-2.5 font-mono"
                    placeholder="请输入账号"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">验证码 / VERIFY CODE</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      aria-label="验证码"
                      autoComplete="current-password"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.trim()); setErrorMsg(''); }}
                      className="input-industrial pl-10 py-2.5 font-mono tracking-widest"
                      placeholder="888888"
                      maxLength={60}
                    />
                    {code.length === 6 && VALID_CODES.includes(code) && (
                      <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-signal-green" />
                    )}
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-sm border transition-all shrink-0 ${
                      countdown > 0 ? 'bg-ink-800/50 border-ink-700 text-slate-500 cursor-not-allowed' :
                      currentTab.color === 'orange' ? 'bg-orange-500/10 border-orange-500/40 text-orange-500 hover:bg-orange-500/20' :
                      currentTab.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20' :
                      'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              {/* 演示账号对照表 */}
              <div className="p-3 bg-ink-950/60 border border-ink-700/50 rounded-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-signal-cyan" />
                  <span className="text-[11px] font-mono text-signal-cyan tracking-wide">DEMO · 演示账号对照表</span>
                </div>
                <div className="space-y-1.5">
                  {roleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeRole === tab.key;
                    return (
                      <div key={tab.key} className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${active ? (tab.color === 'orange' ? 'bg-orange-500/10' : tab.color === 'cyan' ? 'bg-cyan-500/10' : 'bg-emerald-500/10') : ''}`}>
                        <div className="flex items-center gap-2">
                          <Icon size={13} className={tab.color === 'orange' ? 'text-orange-500' : tab.color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'} />
                          <span className="text-[11px] text-slate-300">{tab.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{tab.phone}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-500">验证码统一为：<span className="text-orange-500 font-mono">888888</span></div>
              </div>

              {/* 登录按钮 */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full py-3 text-sm gap-2 relative inline-flex items-center justify-center font-semibold text-white transition-all duration-200 ${
                  currentTab.color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]' :
                  currentTab.color === 'cyan' ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]' :
                  'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                }`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span>{loading ? '登录中...' : '进入系统'}</span>
              </button>
            </div>

            {/* 一键登录 */}
            <div className="flex items-center gap-3 my-5">
              <div className="divider-dashed flex-1" />
              <span className="text-[10px] font-mono text-slate-600 tracking-widest">QUICK ACCESS</span>
              <div className="divider-dashed flex-1" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {roleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeRole === tab.key;
                const colorClasses = {
                  orange: 'border-orange-500/50 bg-orange-500/10 text-orange-500',
                  cyan: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
                  green: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
                };
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleQuickLogin(tab.key)}
                    disabled={loading}
                    className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-sm border transition-all duration-200 ${
                      isActive ? colorClasses[tab.color as keyof typeof colorClasses]
                        : 'border-ink-700/60 bg-ink-950/40 text-slate-500 hover:border-white/30 hover:text-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon size={18} />
                    <span className="text-[11px] font-semibold">{tab.label}</span>
                    {isActive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-signal-green animate-pulse-fast" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 text-center space-y-1">
            <p className="text-[10px] font-mono text-slate-600 tracking-wider">© 2026 运联·智调 TRANSPORT INTELLIGENCE PLATFORM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
