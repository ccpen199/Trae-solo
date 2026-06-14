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
  XCircle,
  Info,
  RotateCcw,
  Terminal,
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
    defaultRoute: '/driver/dashboard',
    desc: '订单大厅 · 接单配送 · 收入统计',
    color: 'cyan',
  },
  {
    key: 'ADMIN',
    label: '运营管理员',
    subLabel: 'ADMIN / OPS',
    icon: UserCog,
    phone: defaultUser.ADMIN.phone,
    defaultRoute: '/admin/overview',
    desc: '智能调度 · 运力监控 · 全局管理',
    color: 'green',
  },
];

const VALID_CODES = ['888888', '666666', '123456'];

type ValidationError = {
  type: 'phone_format' | 'phone_not_match' | 'phone_wrong_role' | 'code_empty' | 'code_length' | 'code_wrong' | 'store_fail' | 'navigate_fail' | 'auto-switch';
  field: 'phone' | 'code' | 'general';
  message: string;
  suggestion?: string;
};

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-]/g, '');
}

function validatePhoneFormat(phone: string): { valid: boolean; message: string } {
  if (!phone.trim()) return { valid: false, message: '请输入账号' };
  const clean = cleanPhone(phone);
  const isMobile = /^1[3-9]\d{9}$/.test(clean);
  const isLandline = /^0\d{10,11}$/.test(clean);
  if (!isMobile && !isLandline) {
    return { valid: false, message: '账号格式不正确' };
  }
  return { valid: true, message: '' };
}

function validateCodeFormat(code: string): { valid: boolean; message: string } {
  if (!code.trim()) return { valid: false, message: '请输入验证码' };
  if (code.length !== 6) return { valid: false, message: '验证码为6位数字' };
  return { valid: true, message: '' };
}

function matchRoleByPhone(phone: string): UserRole | null {
  const clean = cleanPhone(phone);
  for (const tab of roleTabs) {
    if (cleanPhone(tab.phone) === clean) return tab.key;
  }
  return null;
}

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('SHIPPER');
  const [phone, setPhone] = useState<string>(defaultUser.SHIPPER.phone);
  const [code, setCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [loginStep, setLoginStep] = useState<string>('idle');
  const [, forceUpdate] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const currentTab = roleTabs.find((t) => t.key === activeRole)!;
  const authState = useAuthStore.getState();

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
      setErrors([]);
      setSuccessMsg('');
      setLoginStep('idle');
    }
  }, [activeRole]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fieldErrors = (field: 'phone' | 'code') => errors.filter((e) => e.field === field);
  const generalErrors = () => errors.filter((e) => e.field === 'general');

  const performLogin = (targetRole: UserRole) => {
    setLoading(true);
    setErrors([]);
    const tab = roleTabs.find((t) => t.key === targetRole)!;
    const targetPath = tab.defaultRoute;

    console.log(`[Login] Step 1: 开始登录流程，角色=${targetRole}, 目标路径=${targetPath}`);
    setLoginStep('step1');
    setSuccessMsg('① 正在验证账号信息...');
    forceUpdate((n) => n + 1);

    setTimeout(() => {
      console.log('[Login] Step 2: 调用 store.login() 写入认证状态');
      setLoginStep('step2');
      setSuccessMsg('② 认证状态写入中...');
      forceUpdate((n) => n + 1);

      login(targetRole, tab.phone);

      setTimeout(() => {
        const state = useAuthStore.getState();
        console.log('[Login] Step 3: 检查 store 状态', state);
        setLoginStep('step3');
        forceUpdate((n) => n + 1);

        if (!state.isAuthenticated || !state.user) {
          setLoading(false);
          setLoginStep('fail');
          setErrors([{
            type: 'store_fail',
            field: 'general',
            message: '认证状态写入失败',
            suggestion: 'store 未正确更新，请点击下方「重置状态」按钮后重试',
          }]);
          console.error('[Login] Store 状态写入失败', state);
          return;
        }

        if (state.user.role !== targetRole) {
          setLoading(false);
          setLoginStep('fail');
          setErrors([{
            type: 'phone_wrong_role',
            field: 'general',
            message: `角色不匹配：store 中角色为 ${state.user.role}，期望 ${targetRole}`,
            suggestion: '请切换到正确的角色 Tab 后重试',
          }]);
          console.error('[Login] 角色不匹配', state.user.role, targetRole);
          return;
        }

        setSuccessMsg(`③ 认证成功，即将跳转到 ${targetPath} ...`);
        setLoginStep('step4');
        forceUpdate((n) => n + 1);
        console.log(`[Login] Step 4: 准备跳转到 ${targetPath}`);

        setTimeout(() => {
          console.log(`[Login] Step 5: 执行硬跳转 window.location.href = ${targetPath}`);
          setLoginStep('step5');
          setSuccessMsg(`④ 正在跳转... ${targetPath}`);
          forceUpdate((n) => n + 1);

          window.location.href = targetPath;

          setTimeout(() => {
            const stillHere = window.location.pathname !== targetPath;
            if (stillHere) {
              setLoading(false);
              setLoginStep('fail');
              setErrors([{
                type: 'navigate_fail',
                field: 'general',
                message: `跳转失败：浏览器仍停留在 ${window.location.pathname}`,
                suggestion: '请尝试点击下方「强制跳转」按钮，或手动在地址栏输入目标路径',
              }]);
              console.error('[Login] 跳转失败，仍在登录页');
            }
          }, 3000);
        }, 500);
      }, 300);
    }, 400);
  };

  const handleLogin = () => {
    setErrors([]);
    setSuccessMsg('');
    setLoginStep('checking');

    const phoneCheck = validatePhoneFormat(phone);
    const codeCheck = validateCodeFormat(code);

    if (!phoneCheck.valid || !codeCheck.valid) {
      setLoginStep('fail');
      setErrors([
        ...(!phoneCheck.valid ? [{ type: 'phone_format' as const, field: 'phone' as const, message: phoneCheck.message }] : []),
        ...(!codeCheck.valid ? [{ type: 'code_length' as const, field: 'code' as const, message: codeCheck.message }] : []),
      ]);
      return;
    }

    if (!VALID_CODES.includes(code)) {
      setLoginStep('fail');
      setErrors([{
        type: 'code_wrong',
        field: 'code',
        message: '验证码错误',
        suggestion: '演示环境验证码固定为 888888',
      }]);
      return;
    }

    const matchedRole = matchRoleByPhone(phone);
    if (!matchedRole) {
      setLoginStep('fail');
      setErrors([{
        type: 'phone_not_match',
        field: 'phone',
        message: '该账号未在系统中注册',
        suggestion: `请使用演示账号：货主 ${defaultUser.SHIPPER.phone} / 司机 ${defaultUser.DRIVER.phone} / 管理员 ${defaultUser.ADMIN.phone}`,
      }]);
      return;
    }

    if (matchedRole !== activeRole) {
      setLoginStep('auto-switch');
      setSuccessMsg(`检测到该账号属于「${roleTabs.find((t) => t.key === matchedRole)?.label}」，正在自动切换...`);
      setActiveRole(matchedRole);
      forceUpdate((n) => n + 1);

      setTimeout(() => {
        performLogin(matchedRole);
      }, 800);
      return;
    }

    performLogin(activeRole);
  };

  const handleQuickLogin = (role: UserRole) => {
    setActiveRole(role);
    setErrors([]);
    const tab = roleTabs.find((t) => t.key === role)!;
    setSuccessMsg(`正在以「${tab.label}」身份快速登录...`);
    forceUpdate((n) => n + 1);

    setTimeout(() => {
      performLogin(role);
    }, 300);
  };

  const handleSendCode = () => {
    const check = validatePhoneFormat(phone);
    if (!check.valid) {
      setErrors([{ type: 'phone_format', field: 'phone', message: check.message }]);
      return;
    }
    const matched = matchRoleByPhone(phone);
    if (!matched) {
      setErrors([{
        type: 'phone_not_match',
        field: 'phone',
        message: '该账号未注册',
        suggestion: '请使用演示账号',
      }]);
      return;
    }
    if (matched !== activeRole) {
      setErrors([{
        type: 'phone_wrong_role',
        field: 'phone',
        message: `该账号属于「${roleTabs.find((t) => t.key === matched)?.label}」`,
      }]);
      return;
    }

    setErrors([]);
    setCountdown(60);
    setCode('888888');
    setCodeSent(true);
    setSuccessMsg('验证码已发送：888888');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetState = () => {
    localStorage.removeItem('tc_auth_state');
    setErrors([]);
    setSuccessMsg('');
    setLoginStep('idle');
    setLoading(false);
    window.location.reload();
  };

  const handleForceNavigate = () => {
    const tab = roleTabs.find((t) => t.key === activeRole)!;
    window.location.href = tab.defaultRoute;
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

  const getStatusText = () => {
    switch (loginStep) {
      case 'idle': return 'SYSTEM ONLINE · AUTH TERMINAL';
      case 'checking': return 'VALIDATING CREDENTIALS...';
      case 'step1': return 'STEP 1/5 · 验证账号信息';
      case 'step2': return 'STEP 2/5 · 写入认证状态';
      case 'step3': return 'STEP 3/5 · 校验 Store 状态';
      case 'step4': return 'STEP 4/5 · 准备跳转';
      case 'step5': return 'STEP 5/5 · 执行跳转';
      case 'auto-switch': return 'AUTO SWITCHING ROLE...';
      case 'fail': return 'LOGIN FAILED · 点击查看诊断';
      default: return 'PROCESSING...';
    }
  };

  const getStatusIcon = () => {
    if (loginStep === 'fail') return <XCircle size={14} className="text-signal-red" />;
    if (loginStep !== 'idle') return <Loader2 size={14} className="animate-spin text-signal-cyan" />;
    return <span className="status-dot bg-signal-green animate-pulse-fast" />;
  };

  const stepInfo = [
    { step: 'step1', label: '验证账号', desc: '校验手机号格式与角色匹配' },
    { step: 'step2', label: '写入状态', desc: '更新 store 与 localStorage' },
    { step: 'step3', label: '校验状态', desc: '确认 store 写入正确' },
    { step: 'step4', label: '准备跳转', desc: '跳转到目标工作台' },
    { step: 'step5', label: '执行跳转', desc: 'window.location.href 硬跳转' },
  ];

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
      <div className="flex-1 flex items-center justify-center px-6 py-6 relative overflow-y-auto">
        <div className="absolute inset-0 data-grid opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-xl">
          <div className="industrial-card p-6 xl:p-7 backdrop-blur-xl bg-ink-900/70">
            <div className="corner-brackets absolute inset-0 pointer-events-none" />

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="text-[10px] font-mono text-slate-500 tracking-widest">
                  {getStatusText()}
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl text-white tracking-wide mb-1">
                账号登录
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                请选择角色并输入对应账号信息
              </p>
            </div>

            {/* 实时状态监控面板 - 始终可见 */}
            <div className="mb-5 p-3 bg-ink-950/80 border border-ink-700/60 rounded-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <Terminal size={13} className="text-signal-cyan" />
                <span className="text-[10px] font-mono text-signal-cyan tracking-wide">
                  REAL-TIME AUTH MONITOR · 实时状态监控
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mb-3">
                {stepInfo.map((s) => {
                  const currentStepNum = loginStep === 'step1' ? 1 :
                                        loginStep === 'step2' ? 2 :
                                        loginStep === 'step3' ? 3 :
                                        loginStep === 'step4' ? 4 :
                                        loginStep === 'step5' ? 5 : 0;
                  const thisStepNum = parseInt(s.step.replace('step', ''));
                  const isDone = currentStepNum > thisStepNum;
                  const isActive = currentStepNum === thisStepNum;
                  return (
                    <div
                      key={s.step}
                      className={`p-2 rounded-sm text-center ${
                        isActive
                          ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                          : isDone
                            ? 'bg-signal-green/10 border border-signal-green/30 text-signal-green'
                            : 'bg-ink-900/50 border border-ink-700/40 text-slate-500'
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[9px] mt-0.5 opacity-70">{s.desc}</div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Store 认证状态</span>
                  <span className={authState.isAuthenticated ? 'text-signal-green' : 'text-signal-red'}>
                    {authState.isAuthenticated ? '已认证 ✓' : '未认证 ✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Store 当前用户</span>
                  <span className="text-slate-300">{authState.user?.name ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Store 用户角色</span>
                  <span className="text-signal-cyan">{authState.user?.role ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">当前选择角色</span>
                  <span className={getColorClass('text')}>{activeRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">LocalStorage</span>
                  <span className={localStorage.getItem('tc_auth_state') ? 'text-signal-green' : 'text-signal-red'}>
                    {localStorage.getItem('tc_auth_state') ? '存在 ✓' : '不存在 ✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">当前地址</span>
                  <span className="text-slate-400">{window.location.pathname}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-ink-700/40">
                <button
                  onClick={handleResetState}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-slate-400 border border-ink-600 hover:border-ink-500 hover:text-white rounded-sm transition-all"
                >
                  <RotateCcw size={11} />
                  重置认证状态
                </button>
                <button
                  onClick={handleForceNavigate}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-white bg-gradient-to-br from-orange-500 to-orange-600 hover:shadow-[0_0_12px_rgba(249,115,22,0.4)] rounded-sm transition-all"
                >
                  <ArrowRight size={11} />
                  强制跳转 {currentTab.defaultRoute}
                </button>
              </div>
            </div>

            {/* 角色 Tab 切换 */}
            <div className="relative mb-5">
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

            {/* 全局错误 */}
            {generalErrors().map((err, idx) => (
              <div
                key={idx}
                className={`mb-4 flex items-start gap-2 p-3 rounded-sm ${
                  err.type === 'phone_wrong_role' || err.type === 'auto-switch'
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                <AlertTriangle
                  size={14}
                  className={`shrink-0 mt-0.5 ${err.type === 'phone_wrong_role' ? 'text-signal-yellow' : 'text-signal-red'}`}
                />
                <div className="space-y-1">
                  <p className={`text-[11px] leading-relaxed ${err.type === 'phone_wrong_role' ? 'text-yellow-300' : 'text-red-300'}`}>
                    {err.message}
                  </p>
                  {err.suggestion && (
                    <p className="text-[10px] text-slate-400">
                      💡 {err.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {successMsg && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
                <CheckCircle2 size={14} className="text-signal-green shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 leading-relaxed">{successMsg}</p>
              </div>
            )}

            {/* 表单 */}
            <div className="space-y-3.5">
              {/* 手机号 */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">
                  账号 / ACCOUNT
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      fieldErrors('phone').length > 0 ? 'text-signal-red' : 'text-slate-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors('phone').length > 0) {
                        setErrors((prev) => prev.filter((e) => e.field !== 'phone'));
                      }
                    }}
                    className={`input-industrial pl-10 py-2.5 font-mono ${
                      fieldErrors('phone').length > 0
                        ? 'border-signal-red/60 focus:border-signal-red focus:shadow-red-500/10'
                        : codeSent && matchRoleByPhone(phone) === activeRole
                          ? 'border-signal-green/60'
                          : ''
                    }`}
                    placeholder="请输入账号"
                  />
                  {codeSent && matchRoleByPhone(phone) === activeRole && (
                    <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-signal-green" />
                  )}
                </div>
                {fieldErrors('phone').map((err, idx) => (
                  <div key={idx} className="mt-1.5 space-y-0.5">
                    <p className="text-[11px] text-signal-red flex items-center gap-1">
                      <XCircle size={12} />
                      {err.message}
                    </p>
                    {err.suggestion && (
                      <p className="text-[10px] text-slate-500 pl-4">{err.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* 验证码 */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">
                  验证码 / VERIFY CODE
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock
                      size={16}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        fieldErrors('code').length > 0 ? 'text-signal-red' : 'text-slate-500'
                      }`}
                    />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, ''));
                        if (fieldErrors('code').length > 0) {
                          setErrors((prev) => prev.filter((e) => e.field !== 'code'));
                        }
                      }}
                      className={`input-industrial pl-10 py-2.5 font-mono tracking-widest ${
                        fieldErrors('code').length > 0 ? 'border-signal-red/60' : ''
                      }`}
                      placeholder="6位数字"
                      maxLength={6}
                    />
                    {code.length === 6 && VALID_CODES.includes(code) && (
                      <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-signal-green" />
                    )}
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
                {fieldErrors('code').map((err, idx) => (
                  <div key={idx} className="mt-1.5 space-y-0.5">
                    <p className="text-[11px] text-signal-red flex items-center gap-1">
                      <XCircle size={12} />
                      {err.message}
                    </p>
                    {err.suggestion && (
                      <p className="text-[10px] text-slate-500 pl-4">💡 {err.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* 演示提示卡片 */}
              <div className="p-3 bg-ink-950/60 border border-ink-700/50 rounded-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-signal-cyan" />
                  <span className="text-[11px] font-mono text-signal-cyan tracking-wide">
                    DEMO MODE · 演示账号对照表
                  </span>
                </div>
                <div className="space-y-1.5">
                  {roleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeRole === tab.key;
                    return (
                      <div
                        key={tab.key}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${
                          active
                            ? tab.color === 'orange'
                              ? 'bg-orange-500/10'
                              : tab.color === 'cyan'
                                ? 'bg-cyan-500/10'
                                : 'bg-emerald-500/10'
                            : 'bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            size={13}
                            className={
                              tab.color === 'orange'
                                ? 'text-orange-500'
                                : tab.color === 'cyan'
                                  ? 'text-cyan-400'
                                  : 'text-emerald-400'
                            }
                          />
                          <span className="text-[11px] text-slate-300">{tab.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{tab.phone}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-500">
                  验证码统一为：<span className="text-orange-500 font-mono">888888</span>
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
                <span>{loading ? '登录进行中...' : '进入系统'}</span>
              </button>
            </div>

            {/* 分割线 */}
            <div className="flex items-center gap-3 my-5">
              <div className="divider-dashed flex-1" />
              <span className="text-[10px] font-mono text-slate-600 tracking-widest">
                QUICK ACCESS · 一键登录
              </span>
              <div className="divider-dashed flex-1" />
            </div>

            {/* 演示账号一键登录 */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-500 text-center tracking-wide mb-3">
                无需输入，点击下方按钮直接进入对应工作台
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
                          : 'border-ink-700/60 bg-ink-950/40 text-slate-500 hover:border-white/30 hover:text-white hover:bg-white/[0.03]'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon size={18} className="transition-colors" />
                      <span className="text-[11px] font-semibold">
                        {tab.label}
                      </span>
                      <span className="text-[8px] font-mono opacity-70 tracking-wider">
                        {tab.subLabel.split(' ')[0]}
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
          <div className="mt-5 text-center space-y-1">
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
