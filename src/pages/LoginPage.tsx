import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Phone, Shield, Truck, UserCog, ArrowRight, Route, Boxes, Navigation, Zap, Activity, Lock } from 'lucide-react';
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
  },
];

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('SHIPPER');
  const [phone, setPhone] = useState<string>(defaultUser.SHIPPER.phone);
  const [code, setCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const currentTab = roleTabs.find((t) => t.key === activeRole)!;

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
    }
  }, [activeRole]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendCode = () => {
    if (countdown > 0) return;
    setCode('888888');
    setCountdown(60);
  };

  const handleQuickLogin = (role: UserRole) => {
    setLoading(true);
    const tab = roleTabs.find((t) => t.key === role)!;
    setTimeout(() => {
      login(role, tab.phone);
      navigate(tab.defaultRoute, { replace: true });
    }, 600);
  };

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      login(activeRole, phone);
      navigate(currentTab.defaultRoute, { replace: true });
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex bg-ink-950 overflow-hidden">
      {/* HERO 区域 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[58%] relative overflow-hidden border-r border-ink-700/40">
        {/* 背景层：数据网格 */}
        <div className="absolute inset-0 data-grid opacity-60" />

        {/* 渐变底色 */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-900/95 to-ink-950" />

        {/* 扫描线动画 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent animate-scan" />
          <div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-signal-cyan/30 to-transparent animate-scan"
            style={{ animationDelay: '1s', animationDuration: '2.8s' }}
          />
        </div>

        {/* 浮动车辆图标 */}
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

        {/* 光晕装饰 */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-25%] right-[-10%] w-[600px] h-[600px] rounded-full bg-signal-cyan/8 blur-[140px]" />

        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-between px-14 xl:px-20 py-16 w-full">
          {/* Logo */}
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

          {/* Slogan */}
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

            {/* 特性标签 */}
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

          {/* 底部数据条 */}
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
          {/* 玻璃拟态卡片 */}
          <div className="industrial-card p-8 xl:p-9 backdrop-blur-xl bg-ink-900/70">
            <div className="corner-brackets absolute inset-0 pointer-events-none" />

            {/* 标题 */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <span className="status-dot bg-signal-green animate-pulse-fast" />
                <span className="text-[10px] font-mono text-slate-500 tracking-widest">SYSTEM ONLINE</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-white tracking-wide mb-1">
                账号登录
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                AUTHENTICATION TERMINAL · NODE #{String(Math.floor(Math.random() * 9000) + 1000)}
              </p>
            </div>

            {/* 角色 Tab 切换 */}
            <div className="relative mb-7">
              <div className="flex bg-ink-950/50 rounded-sm border border-ink-700/50 p-1 relative">
                {/* 滑动下划线 */}
                <div
                  className="absolute top-1 bottom-1 rounded-sm bg-gradient-to-r from-orange-500/20 to-orange-550/10 border border-orange-500/40 transition-all duration-300 ease-out"
                  style={{
                    left: indicatorStyle.left + 4,
                    width: indicatorStyle.width - 8,
                  }}
                />
                {roleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeRole === tab.key;
                  return (
                    <button
                      key={tab.key}
                      ref={(el) => { tabRefs.current[tab.key] = el; }}
                      onClick={() => setActiveRole(tab.key)}
                      className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-sm z-10 transition-all duration-200 ${
                        active ? 'text-orange-500' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon size={18} className={active ? 'opacity-100' : 'opacity-70'} />
                      <span className="text-xs font-semibold">{tab.label}</span>
                      <span className="text-[9px] font-mono opacity-60 tracking-wider">{tab.subLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* 当前角色描述 */}
              <div className="mt-3 px-3 py-2 bg-ink-950/40 border-l-2 border-orange-500/60 rounded-r-sm">
                <p className="text-[11px] text-slate-400 font-medium">{currentTab.desc}</p>
              </div>
            </div>

            {/* 表单 */}
            <div className="space-y-4">
              {/* 手机号 */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">
                  手机号 / PHONE NUMBER
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-industrial pl-10 py-2.5 font-mono"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>

              {/* 验证码 */}
              <div>
                <label className="text-[11px] font-mono text-slate-500 mb-1.5 block tracking-wide">
                  验证码 / VERIFY CODE
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="input-industrial pl-10 py-2.5 font-mono tracking-widest"
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
                        : 'bg-orange-500/10 border-orange-500/40 text-orange-500 hover:bg-orange-500/20 hover:border-orange-500/60'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              {/* 演示预设提示 */}
              <div className="flex items-start gap-2 p-3 bg-signal-cyan/5 border border-signal-cyan/20 rounded-sm">
                <Shield size={14} className="text-signal-cyan shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  演示模式：预设账号 <span className="text-signal-cyan font-mono">{currentTab.phone}</span>，
                  验证码已自动填充为 <span className="text-orange-500 font-mono">888888</span>
                </div>
              </div>

              {/* 登录按钮 */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="btn-primary w-full py-3 text-sm gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                <span>进入系统</span>
              </button>
            </div>

            {/* 分割线 */}
            <div className="flex items-center gap-3 my-6">
              <div className="divider-dashed flex-1" />
              <span className="text-[10px] font-mono text-slate-600 tracking-widest">QUICK ACCESS</span>
              <div className="divider-dashed flex-1" />
            </div>

            {/* 演示账号一键登录 */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-500 text-center tracking-wide mb-3">
                演示账号一键登录 · DEMO LOGIN
              </div>
              <div className="grid grid-cols-3 gap-2">
                {roleTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleQuickLogin(tab.key)}
                      className="group relative flex flex-col items-center gap-1.5 p-3 rounded-sm border border-ink-700/60 bg-ink-950/40 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-200"
                    >
                      <Icon
                        size={18}
                        className="text-slate-500 group-hover:text-orange-500 transition-colors"
                      />
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white">
                        {tab.label}
                      </span>
                      <span className="text-[8px] font-mono text-slate-600 tracking-wider">
                        {tab.subLabel}
                      </span>
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
