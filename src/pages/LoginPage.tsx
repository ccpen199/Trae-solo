import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import { defaultUser } from '@/utils/mockData';

interface RoleTab {
  key: UserRole;
  label: string;
  subLabel: string;
  icon: LucideIcon;
  phone: string;
  code: string;
  defaultRoute: string;
  desc: string;
  color: string;
}

const roleTabs: RoleTab[] = [
  {
    key: 'SHIPPER',
    label: '货主',
    subLabel: 'SHIPPER',
    icon: Boxes,
    phone: defaultUser.SHIPPER.phone,
    code: '888888',
    defaultRoute: '/shipper/dashboard',
    desc: '发布货源 · 追踪订单 · 保险服务',
    color: 'orange',
  },
  {
    key: 'DRIVER',
    label: '司机',
    subLabel: 'DRIVER',
    icon: Truck,
    phone: defaultUser.DRIVER.phone,
    code: '888888',
    defaultRoute: '/driver/dashboard',
    desc: '订单大厅 · 接单配送 · 收入统计',
    color: 'cyan',
  },
  {
    key: 'ADMIN',
    label: '运营管理员',
    subLabel: 'ADMIN',
    icon: UserCog,
    phone: defaultUser.ADMIN.phone,
    code: '888888',
    defaultRoute: '/admin/overview',
    desc: '智能调度 · 运力监控 · 全局管理',
    color: 'green',
  },
];

const VALID_CODES = ['888888', '666666', '123456'];

function validatePhone(phone: string): { valid: boolean; message: string } {
  if (!phone.trim()) return { valid: false, message: '请输入手机号' };
  const clean = phone.replace(/\s/g, '');
  if (!/^1[3-9]\d{9}$/.test(clean) && !/^0\d{2,3}-?\d{7,8}$/.test(clean)) {
    return { valid: false, message: '手机号格式不正确' };
  }
  return { valid: true, message: '' };
}

function validateCode(code: string): { valid: boolean; message: string } {
  if (!code.trim()) return { valid: false, message: '请输入验证码' };
  if (code.length !== 6) return { valid: false, message: '验证码为6位数字' };
  if (!VALID_CODES.includes(code)) return { valid: false, message: '验证码错误，演示验证码：888888' };
  return { valid: true, message: '' };
}

function matchRoleByPhone(phone: string): UserRole | null {
  const clean = phone.replace(/\s/g, '');
  for (const tab of roleTabs) {
    if (tab.phone.replace(/\s/g, '') === clean) return tab.key;
  }
  return null;
}

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('SHIPPER');
  const [phone, setPhone] = useState<string>(defaultUser.SHIPPER.phone);
  const [code, setCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ phone?: string; code?: string; general?: string }>({});
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [codeSent, setCodeSent] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const currentTab = roleTabs.find((t) => t.key === activeRole)!;
  const from = (location.state as any)?.from || { pathname: currentTab.defaultRoute };

  useEffect(() => {
    const el = tabRefs.current[activeRole];
    if (el) {
      const parent = el.parentElement!;
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeRole]);

  useEffect(() => {
    const tab = roleTabs.find((t) => t.key === activeRole);
    if (tab) {
      setPhone(tab.phone);
      setErrors({});
      setSuccessMsg('');
    }
  }, [activeRole]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendCode = () => {
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      setErrors({ phone: phoneCheck.message });
      return;
    }
    setErrors({});
    setCountdown(60);
    setCode('888888');
    setCodeSent(true);
    setSuccessMsg('验证码已发送，演示验证码：888888');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogin = () => {
    setErrors({});
    setSuccessMsg('');

    const phoneCheck = validatePhone(phone);
    const codeCheck = validateCode(code);

    if (!phoneCheck.valid || !codeCheck.valid) {
      setErrors({
        phone: phoneCheck.valid ? undefined : phoneCheck.message,
        code: codeCheck.valid ? undefined : codeCheck.message,
      });
      return;
    }

    const matchedRole = matchRoleByPhone(phone);
    if (matchedRole && matchedRole !== activeRole) {
      setErrors({
        general: `该手机号为${roleTabs.find(t => t.key === matchedRole)?.label}账号，正在切换...`,
      });
      setActiveRole(matchedRole);
      setTimeout(() => {
        doLogin(matchedRole);
      }, 800);
      return;
    }

    doLogin(activeRole);
  };

  const doLogin = (role: UserRole) => {
    setLoading(true);
    setErrors({});
    setSuccessMsg('身份验证通过，正在进入系统...');

    const tab = roleTabs.find((t) => t.key === role)!;
    setTimeout(() => {
      login(role, tab.phone);
      setLoading(false);
      navigate(from.pathname || tab.defaultRoute, { replace: true });
    }, 900);
  };

  const handleQuickLogin = (role: UserRole) => {
    setActiveRole(role);
    setErrors({});
    setSuccessMsg(`正在以${roleTabs.find(t => t.key === role)?.label}身份快速登录...`);
    setLoading(true);

    const tab = roleTabs.find((t) => t.key === role)!;
    setTimeout(() => {
      login(role, tab.phone);
      setLoading(false);
      navigate(tab.defaultRoute, { replace: true });
    }, 700);
  };

  const getColorClass = (type: 'bg' | 'text' | 'border', shade: string = '500') => {
    const colorMap: Record<string, string> = {
      orange: `bg-orange-${shade}`,
      cyan: `bg-signal-cyan`,
      green: `bg-signal-green`,
    };
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
      {/* HERO 区域 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[58%] relative overflow-hidden border-r border-ink-700/40">
        <div className="absolute inset-0 data-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-900/95 to-ink-950" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent animate-scan" />
          <div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-signal-cyan/30 to-transparent animate-scan"
            style={{ animationDelay: '1s', animationDuration: '2.8s' }}
          />
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
              style={{
                left: item.x,
                top: item.y,
                animationDelay: item.delay,
                animationDuration: item.dur,
              }}
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
              <span className="hex-tag !text-[11px] !px-3 !py-1.5">
                v2.6.0 · AI-POWERED DISPATCH ENGINE
              </span>
              <h1 className="font-display font-black text-5xl xl:text-6xl leading-[1.1] text-white tracking-tight">
                同城货运
                <br />
                <span className="bg-gradient-to-r from-orange-450 via-orange-500 to-orange-550 bg-clip-text text-transparent">
                  智能调度
                </span>{' '}
                SaaS平台
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
                <div
                  key={f.label}
                  className="p-4 bg-ink-900/60 backdrop-blur-sm rounded-sm border border-ink-700/50 space-y-1.5 hover:border-ink-600 transition-colors"
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-sm ${
                      f.color === 'orange'
                        ? 'bg-orange-500/15 text-orange-500'
                        : f.color === 'cyan'
                          ? 'bg-signal-cyan/15 text-signal-cyan'
                          : 'bg-signal-green/15 text-signal-green'
                    }`}
                  >
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
          .floating-vehicles {
            animation-name: floating-vehicles;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
        `}</style>
      </div>

      {/* 登录卡片区域 */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div className="absolute inset-0 data-grid opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-md">
          <div className="industrial-card p-8 xl:p-9 backdrop-blur-xl bg-ink-900/70">
            <div className="corner-brackets absolute inset-0 pointer-events-none" />

            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <span className="status-dot bg-signal-green animate-pulse-fast" />
                <span className="text-[10px] font-mono text-slate-500 tracking-widest">SYSTEM ONLINE · NODE-07</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-white tracking-wide mb-1">
                账号登录
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                AUTHENTICATION TERMINAL · 身份验证终端
              </p>
            </div>

            {/* 角色 Tab 切换 */}
            <div className="relative mb-6">
              <div className="flex bg-ink-950/50 rounded-sm border border-ink-700/50 p-1 relative">
                <div
                  className="absolute top-1 bottom-1 rounded-sm transition-all duration-300 ease-out"
                  style={{
                    left: indicatorStyle.left + 4,
                    width: indicatorStyle.width - 8,
                    background: currentTab.color === 'orange'
                      ? 'linear-gradient(to right, rgba(249,115,22,0.2), rgba(234,88,12,0.1))'
                      : currentTab.color === 'cyan'
                        ? 'linear-gradient(to right, rgba(6,182,212,0.2), rgba(6,182,212,0.1))'
                        : 'linear-gradient(to right, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                    borderColor: currentTab.color === 'orange'
                      ? 'rgba(249,115,22,0.4)'
                      : currentTab.color === 'cyan'
                        ? 'rgba(6,182,212,0.4)'
                        : 'rgba(16,185,129,0.4)',
                    borderWidth: '1px',
                  }}
                />
                {roleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeRole === tab.key;
                  const activeColor = tab.color === 'orange'
                    ? 'text-orange-500'
                    : tab.color === 'cyan'
                      ? 'text-cyan-400'
                      : 'text-emerald-400';
                  return (
                    <button
                      key={tab.key}
                      ref={(el) => { tabRefs.current[tab.key] = el; }}
                      onClick={() => setActiveRole(tab.key)}
                      className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-sm z-10 transition-all duration-200 ${
                        active ? activeColor : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon size={18} className={active ? 'opacity-100' : 'opacity-70'} />
                      <span className="text-xs font-semibold">{tab.label}</span>
                      <span className="text-[9px] font-mono opacity-60 tracking-wider">{tab.subLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className={`mt-3 px-3 py-2 bg-ink-950/40 border-l-2 rounded-r-sm ${getColorClass('border')}`}>
                <p className="text-[11px] text-slate-400 font-medium">{currentTab.desc}</p>
              </div>
            </div>

            {/* 全局提示 */}
            {errors.general && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-sm">
                <AlertTriangle size={14} className="text-signal-yellow shrink-0 mt-0.5" />
                <p className="text-[11px] text-yellow-300 leading-relaxed">{errors.general}</p>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
                <CheckCircle2 size={14} className="text-signal-green shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 leading-relaxed">{successMsg}</p>
              </div>
            )}

            {/* 表单 */}
            <div className="space-y-4">
              {/* 手机号 */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">
                  手机号 / PHONE NUMBER
                </label>
                <div className="relative">
                  <Phone size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-signal-red' : 'text-slate-500'}`} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    onBlur={() => {
                      const check = validatePhone(phone);
                      if (!check.valid) setErrors({ ...errors, phone: check.message });
                    }}
                    className={`input-industrial pl-10 py-2.5 font-mono ${
                      errors.phone ? 'border-signal-red/60 focus:border-signal-red focus:shadow-red-500/10' : ''
                    }`}
                    placeholder="请输入手机号"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-[11px] text-signal-red flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.phone}
                  </p>
                )}
                {!errors.phone && codeSent && (
                  <p className="mt-1.5 text-[11px] text-signal-green flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    账号匹配成功：{currentTab.label}账号
                  </p>
                )}
              </div>

              {/* 验证码 */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">
                  验证码 / VERIFY CODE
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.code ? 'text-signal-red' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, ''));
                        if (errors.code) setErrors({ ...errors, code: undefined });
                      }}
                      className={`input-industrial pl-10 py-2.5 font-mono tracking-widest ${
                        errors.code ? 'border-signal-red/60' : ''
                      }`}
                      placeholder="6位验证码"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-sm border transition-all shrink-0 ${
                      countdown > 0
                        ? 'bg-ink-800/50 border-ink-700 text-slate-500 cursor-not-allowed'
                        : currentTab.color === 'orange'
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-500 hover:bg-orange-500/20 hover:border-orange-500/60'
                          : currentTab.color === 'cyan'
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/60'
                            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/60'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s 重发` : '获取验证码'}
                  </button>
                </div>
                {errors.code && (
                  <p className="mt-1.5 text-[11px] text-signal-red flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.code}
                  </p>
                )}
              </div>

              {/* 演示提示 */}
              <div className="flex items-start gap-2 p-3 bg-signal-cyan/5 border border-signal-cyan/20 rounded-sm">
                <Shield size={14} className="text-signal-cyan shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
                  <div>
                    <span className="text-signal-cyan font-mono">演示模式</span>
                    {' · '}
                    当前角色预设账号：
                    <span className={`font-mono ${getColorClass('text')}`}> {currentTab.phone}</span>
                  </div>
                  <div>
                    演示验证码：
                    <span className="text-orange-500 font-mono"> 888888</span>
                    {' · '}
                    点击「获取验证码」自动填充
                  </div>
                </div>
              </div>

              {/* 登录按钮 */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full py-3 text-sm gap-2 relative inline-flex items-center justify-center font-semibold text-white transition-all duration-200 ${
                  currentTab.color === 'orange'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                    : currentTab.color === 'cyan'
                      ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                }`}
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                <span>{loading ? '正在验证身份...' : '进入系统'}</span>
              </button>
            </div>

            {/* 分割线 */}
            <div className="flex items-center gap-3 my-6">
              <div className="divider-dashed flex-1" />
              <span className="text-[10px] font-mono text-slate-600 tracking-widest">QUICK ACCESS · 演示一键登录</span>
              <div className="divider-dashed flex-1" />
            </div>

            {/* 演示账号一键登录 */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-500 text-center tracking-wide mb-3">
                无需输入，点击直达对应工作台
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
                        isActive
                          ? colorClasses[tab.color as keyof typeof colorClasses]
                          : 'border-ink-700/60 bg-ink-950/40 text-slate-500 hover:border-white/30 hover:text-white'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon size={18} className="transition-colors" />
                      <span className="text-[11px] font-semibold">
                        {tab.label}
                      </span>
                      <span className="text-[8px] font-mono opacity-70 tracking-wider">
                        {tab.subLabel}
                      </span>
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-signal-green animate-pulse-fast" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 底部版权 */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-[10px] font-mono text-slate-600 tracking-wider">
              © 2026 运联·智调 TRANSPORT INTELLIGENCE PLATFORM
            </p>
            <p className="text-[10px] font-mono text-slate-700">
              沪ICP备 · 数据加密传输 · 信息安全等级保护三级
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
