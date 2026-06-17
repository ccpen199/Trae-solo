import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, PawPrint, MessageCircle, MapPin, ShoppingBag, Users, Calendar, Bell,
  User, LogOut, Menu, X, Stethoscope, Building2, Store, ShieldCheck, BarChart3, Cpu,
  Heart, ClipboardList, Settings, ShieldAlert, FileCheck2, ChevronRight,
  Globe, Search, Clock, ListChecks, Shield, History, XCircle, CheckCircle, PlayCircle,
  Filter, Trash2, Eye,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { UserRole } from '@shared/types';
import type { ImpersonationSession, ImpersonationOperation } from '@/store/useAuthStore';

const ROLE_LABEL: Record<UserRole, { name: string; accent: string }> = {
  owner: { name: '宠物主人', accent: 'from-forest-500 to-emerald-600' },
  doctor: { name: '执业兽医', accent: 'from-blue-500 to-sky-600' },
  hospital: { name: '医院管理员', accent: 'from-orange-500 to-amber-600' },
  merchant: { name: '商家运营', accent: 'from-rose-500 to-pink-600' },
  admin: { name: '超级管理员', accent: 'from-purple-500 to-indigo-600' },
  platform: { name: '平台运营', accent: 'from-sky-500 to-cyan-600' },
  ops: { name: '运维工程师', accent: 'from-slate-600 to-zinc-800' },
};

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  badge?: string;
  group?: string;
}

const OWNER_NAV: NavItem[] = [
  { path: '/', icon: Home, label: '首页', group: '宠主首页' },
  { path: '/pets', icon: PawPrint, label: '宠物档案', hint: '多宠绑定', group: '核心业务' },
  { path: '/consultations', icon: MessageCircle, label: '在线问诊', hint: '图文/音视频', group: '核心业务' },
  { path: '/hospitals', icon: MapPin, label: '附近医院', hint: '就医导航', group: '线下服务' },
  { path: '/shop', icon: ShoppingBag, label: '宠物商城', hint: '类目专属搜索', group: '电商服务' },
  { path: '/community', icon: Users, label: '宠物社区', hint: '疫苗/驱虫标签', group: '社区公益' },
  { path: '/lost-pet', icon: Heart, label: '寻宠公益', hint: 'LBS扩散任务链', group: '社区公益' },
  { path: '/calendar', icon: Calendar, label: '健康日历', hint: '疫苗/驱虫/体检', group: '健康管理' },
];

const DOCTOR_NAV: NavItem[] = [
  { path: '/doctor/dashboard', icon: Stethoscope, label: '医生工作台', group: '诊疗中心' },
  { path: '/consultations', icon: MessageCircle, label: '问诊记录', hint: '加密存储', group: '诊疗中心' },
  { path: '/pets', icon: PawPrint, label: '宠物档案', group: '辅助参考' },
  { path: '/hospitals', icon: MapPin, label: '合作医院', group: '辅助参考' },
  { path: '/calendar', icon: Calendar, label: '排班日历', group: '个人管理' },
];

const HOSPITAL_NAV: NavItem[] = [
  { path: '/hospital/dashboard', icon: Building2, label: '医院后台', group: '医院管理' },
  { path: '/calendar', icon: Calendar, label: '排期管理', group: '业务数据' },
  { path: '/pets', icon: PawPrint, label: '到店档案', group: '业务数据' },
  { path: '/consultations', icon: MessageCircle, label: '线上问诊', group: '线上业务' },
  { path: '/community', icon: Users, label: '品牌动态', group: '运营推广' },
];

const MERCHANT_NAV: NavItem[] = [
  { path: '/merchant/dashboard', icon: Store, label: '商家工作台', group: '经营管理' },
  { path: '/shop', icon: ShoppingBag, label: '商城前台', group: '运营推广' },
  { path: '/calendar', icon: Calendar, label: '发货排期', group: '经营管理' },
];

const ADMIN_NAV: NavItem[] = [
  { path: '/admin/dashboard', icon: ShieldCheck, label: '管理后台', hint: '管理控制台', group: '全局权限' },
  { path: '/', icon: Home, label: '平台预览', group: '业务入口', hint: '模拟宠主' },
  { path: '/consultations', icon: MessageCircle, label: '问诊审计', hint: '处方流转', group: '全链路审计' },
  { path: '/shop', icon: ShoppingBag, label: '商城复核', hint: '处方药双签', group: '全链路审计' },
  { path: '/hospitals', icon: Building2, label: '医院监管', group: '平台监管' },
];

const PLATFORM_NAV: NavItem[] = [
  { path: '/platform/dashboard', icon: BarChart3, label: '运营工作台', group: '运营中心' },
  { path: '/community', icon: Users, label: '内容审核', group: '运营中心' },
  { path: '/shop', icon: ShoppingBag, label: '商家运营', group: '运营中心' },
  { path: '/hospitals', icon: Building2, label: '医院运营', group: '运营中心' },
  { path: '/lost-pet', icon: Heart, label: '公益运营', group: '公益运营' },
  { path: '/pets', icon: PawPrint, label: '用户分析', group: '数据分析' },
];

const OPS_NAV: NavItem[] = [
  { path: '/ops/dashboard', icon: Cpu, label: '运维控制台', group: '基础设施' },
  { path: '/', icon: Globe, label: '服务联调', hint: '联调入口', group: '服务监控' },
];

function getNavForRole(role?: UserRole): NavItem[] {
  switch (role) {
    case 'doctor': return DOCTOR_NAV;
    case 'hospital': return HOSPITAL_NAV;
    case 'merchant': return MERCHANT_NAV;
    case 'admin': return ADMIN_NAV;
    case 'platform': return PLATFORM_NAV;
    case 'ops': return OPS_NAV;
    case 'owner': return OWNER_NAV;
    default: return OWNER_NAV;
  }
}

function groupNavItems(items: NavItem[]) {
  const groups: Record<string, NavItem[]> = {};
  for (const item of items) {
    const g = item.group || '其他';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  }
  return groups;
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user, logout, login, impersonateRole, originalCredentials,
    impersonationSession, impersonationHistory,
    startImpersonation, exitImpersonation, recordImpersonationOperation,
    clearImpersonationHistory
  } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exitingPreview, setExitingPreview] = useState(false);
  const [permissionPanelOpen, setPermissionPanelOpen] = useState(false);
  const [operationLogPanelOpen, setOperationLogPanelOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<ImpersonationSession | null>(null);
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [showBlockedToast, setShowBlockedToast] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');

  const formatDuration = (start: string, end: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diff = endTime - startTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    if (minutes > 0) return `${minutes}分钟${seconds}秒`;
    return `${seconds}秒`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const checkPermission = (action: string, target: string, session: ImpersonationSession | null): boolean => {
    if (!session) return true;
    const boundary = session.permissionBoundary;
    for (const rule of boundary) {
      const [ruleAction, ruleTarget] = rule.split(':');
      if (ruleAction === action || ruleAction === '*') {
        if (ruleTarget === '*' || target.startsWith(ruleTarget.replace('/*', ''))) {
          return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (showBlockedToast) {
      const timer = setTimeout(() => setShowBlockedToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showBlockedToast]);

  useEffect(() => {
    if (impersonationSession && location.pathname) {
      const isAllowed = checkPermission('页面访问', location.pathname, impersonationSession);
      recordImpersonationOperation(
        '页面访问',
        location.pathname,
        `访问页面: ${location.pathname}`,
        false,
        impersonationSession.writeAllowed,
        isAllowed ? 'completed' : 'blocked'
      );
      if (!isAllowed) {
        setBlockedMessage(`访问被权限边界拦截：${location.pathname}`);
        setShowBlockedToast(true);
        navigate('/');
      }
    }
  }, [location.pathname, impersonationSession, navigate, recordImpersonationOperation]);

  const filteredOperations = useMemo(() => {
    const ops = selectedHistorySession
      ? selectedHistorySession.operationLog
      : impersonationSession?.operationLog || [];
    if (operationFilter === 'all') return ops;
    return ops.filter(op => op.action === operationFilter);
  }, [impersonationSession, selectedHistorySession, operationFilter]);

  const operationTypes = useMemo((): string[] => {
    const ops = selectedHistorySession
      ? selectedHistorySession.operationLog
      : impersonationSession?.operationLog || [];
    const types = new Set<string>(ops.map(op => op.action));
    return ['all', ...Array.from(types)];
  }, [impersonationSession, selectedHistorySession]);

  const getResultBadge = (result: ImpersonationOperation['result']) => {
    switch (result) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" />真实执行</span>;
      case 'blocked':
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1"><XCircle className="w-3 h-3" />被权限边界拦截</span>;
      case 'simulated':
        return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center gap-1"><PlayCircle className="w-3 h-3" />模拟执行</span>;
    }
  };

  const parsePermissionItem = (item: string): { action: string; target: string; allowed: boolean; desc: string } => {
    const [action, target] = item.split(':');
    const allowed = !item.startsWith('!');
    const descMap: Record<string, string> = {
      '页面访问': '可查看',
      '数据查询': '可查询',
      '表单提交': '可提交',
      '按钮点击': '可操作',
    };
    const targetMap: Record<string, string> = {
      '/': '首页',
      '/pets': '宠物档案',
      '/consultations': '在线问诊',
      '/hospitals': '附近医院',
      '/shop': '宠物商城',
      '/community': '宠物社区',
      '/lost-pet': '寻宠公益',
      '/calendar': '健康日历',
      '*': '全部',
    };
    const desc = allowed ? descMap[action] || action : `不可${descMap[action] || action}`;
    const targetDesc = targetMap[target] || targetMap[target.replace('/*', '')] || target;
    return { action, target, allowed, desc: `${desc}${targetDesc}` };
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleExitImpersonation = async () => {
    if (!originalCredentials) return;
    setExitingPreview(true);
    try {
      const { user: origUser, token: origToken } = await api.auth.login(originalCredentials.phone, originalCredentials.password);
      exitImpersonation();
      login(origUser, origToken);
      const homePath = `/${originalCredentials.role}/dashboard`;
      navigate(homePath, { replace: true });
    } catch (error) {
      console.error('退出模拟失败:', error);
    } finally {
      setExitingPreview(false);
    }
  };

  const handleNavClick = async (path: string) => {
    if (path === '/' && user && ['admin', 'platform', 'ops'].includes(user.role) && !impersonateRole) {
      try {
        const { user: ownerUser, token: ownerToken } = await api.auth.login('13800000001', '123456');
        const permissionBoundary = [
          '页面访问:/',
          '页面访问:/pets',
          '页面访问:/pets/*',
          '页面访问:/consultations',
          '页面访问:/consultations/*',
          '页面访问:/hospitals',
          '页面访问:/hospitals/*',
          '页面访问:/shop',
          '页面访问:/shop/*',
          '页面访问:/community',
          '页面访问:/lost-pet',
          '页面访问:/lost-pet/*',
          '页面访问:/calendar',
          '页面访问:/account',
          '页面访问:/account/*',
          '数据查询:*',
          '表单提交:/pets/*',
          '表单提交:/consultations/*',
          '表单提交:/shop/*',
          '表单提交:/account/*',
          '按钮点击:*',
        ];
        startImpersonation(
          'owner',
          { phone: user.phone === '13800000001' ? 'admin' : user.phone, password: '123456', role: user.role },
          true,
          permissionBoundary
        );
        login(ownerUser, ownerToken);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('启动模拟失败:', error);
      }
      return;
    }
    navigate(path);
    setSidebarOpen(false);
  };

  const role = user?.role;
  const effectiveRole = impersonateRole ? impersonateRole : role;
  const navItems = getNavForRole(effectiveRole);
  const groupedNav = groupNavItems(navItems);
  const roleInfo = effectiveRole ? ROLE_LABEL[effectiveRole] : ROLE_LABEL.owner;

  const currentNav = navItems.find(item => location.pathname === item.path
    || (item.path !== '/' && location.pathname.startsWith(item.path)));
  const pageTitle = currentNav?.label || navItems[0]?.label || '首页';

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-forest-100 flex flex-col transform transition-transform duration-300 shadow-xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-5 border-b border-forest-50">
          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-3"
              onClick={() => navigate(effectiveRole ? (effectiveRole === 'owner' ? '/' : `/${effectiveRole}/dashboard`) : '/')}
            >
              <div className={cn('w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md', roleInfo.accent)}>
                <PawPrint className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="text-left">
                <h1 className="font-display font-bold text-base text-gray-900">宠生园 PetLife</h1>
                <p className={cn('text-[10px] font-semibold bg-gradient-to-r bg-clip-text text-transparent', roleInfo.accent)}>
                  {roleInfo.name} · 工作区
                </p>
              </div>
            </button>
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-forest-50 shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {effectiveRole === 'owner' ? null : (
            <div className="mt-4 p-2.5 rounded-xl bg-gradient-to-r bg-clip-padding border-forest-50 border flex items-center justify-between">
              <span className="text-[11px] font-semibold text-forest-800">权限：{roleInfo.name}</span>
              <ShieldAlert className="w-3.5 h-3.5 text-forest-600" />
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} className="space-y-1">
              <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <span className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
                <span>{group}</span>
                <span className="h-px flex-1 bg-gradient-to-l from-gray-100 to-transparent" />
              </div>
              {items.map((item) => {
                const isActive = location.pathname === item.path
                  || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative',
                      isActive
                        ? 'bg-gradient-to-r from-forest-500 to-emerald-600 text-white shadow-lg shadow-forest-500/20'
                        : 'text-gray-600 hover:bg-forest-50 hover:text-forest-700'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all',
                      isActive
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-forest-50 group-hover:bg-white'
                    )}>
                      <item.icon className={cn('w-4.5 h-4.5', isActive ? 'text-white' : 'text-forest-600')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm block truncate">{item.label}</span>
                      {item.hint && (
                        <span className={cn(
                          'text-[10px] block truncate font-medium',
                          isActive ? 'text-white/80' : 'text-gray-400'
                        )}>{item.hint}</span>
                      )}
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {user && (
          <div className="p-3 border-t border-forest-50 space-y-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-cream-50 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-full bg-forest-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-forest-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{user.nickname}</p>
                  <p className="text-[11px] font-semibold truncate">{roleInfo.name}</p>
                </div>
              </div>
              <div className="flex gap-1.5 pt-2 mt-2 border-t border-gray-100">
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/account/settings'); }}
                  className="flex-1 text-[10px] px-2 py-1.5 rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-forest-50 hover:border-forest-200 hover:text-forest-700 font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <Settings className="w-3 h-3" />
                  账号设置
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 text-[10px] px-2 py-1.5 rounded-lg text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <LogOut className="w-3 h-3" />
                  退出
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {impersonateRole && originalCredentials && (
          <>
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-warm-500 text-white px-4 sm:px-6 py-2.5 shadow-md z-30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold truncate">
                      平台预览中 · 正在以【{ROLE_LABEL[impersonateRole]?.name || impersonateRole}】身份承接
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold whitespace-nowrap">
                      原身份：{ROLE_LABEL[originalCredentials.role]?.name || originalCredentials.role}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold whitespace-nowrap">
                      🔐 已通过账号密码重新验证
                    </span>
                    {impersonationSession && (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold whitespace-nowrap flex items-center gap-1">
                          <ListChecks className="w-3 h-3" />
                          已操作: {impersonationSession.operationLog.length}次
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono whitespace-nowrap">
                          Session: {impersonationSession.sessionId.slice(0, 8)}...
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-white/90 leading-snug">
                    <span className="font-bold mr-1">操作生效范围：</span>
                    当前页面所有业务操作（问诊下单/商城购买/档案修改等）均以{ROLE_LABEL[impersonateRole]?.name}身份真实写入数据库，
                    <span className="font-bold"> 权限边界按{ROLE_LABEL[impersonateRole]?.name}角色的RBAC矩阵实时生效。</span>
                    审计日志将保留「{ROLE_LABEL[originalCredentials.role]?.name}→{ROLE_LABEL[impersonateRole]?.name}」的切换留痕。
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-[11px]">
                    <button
                      onClick={() => { setPermissionPanelOpen(true); setOperationLogPanelOpen(false); setHistoryPanelOpen(false); }}
                      className="font-bold underline underline-offset-2 hover:text-amber-100 transition-colors flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      本次模拟权限边界
                    </button>
                    <button
                      onClick={() => { setOperationLogPanelOpen(true); setPermissionPanelOpen(false); setHistoryPanelOpen(false); setSelectedHistorySession(null); }}
                      className="font-bold underline underline-offset-2 hover:text-amber-100 transition-colors flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      操作记录回看
                    </button>
                    <button
                      onClick={() => { setHistoryPanelOpen(true); setPermissionPanelOpen(false); setOperationLogPanelOpen(false); }}
                      className="font-bold underline underline-offset-2 hover:text-amber-100 transition-colors flex items-center gap-1"
                    >
                      <History className="w-3 h-3" />
                      历史模拟
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button
                    onClick={handleExitImpersonation}
                    disabled={exitingPreview}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white text-amber-600 hover:bg-amber-50 text-xs font-bold shadow-md transition-all disabled:opacity-60 inline-flex items-center gap-1"
                  >
                    {exitingPreview ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        退出中
                      </>
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5" />
                        退出预览
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {permissionPanelOpen && impersonationSession && (
              <div className="bg-white border-b border-amber-200 px-4 sm:px-6 py-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    本次模拟权限边界详情
                  </h3>
                  <button onClick={() => setPermissionPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold mb-1">模拟角色</div>
                    <div className="text-sm font-bold text-gray-900">{ROLE_LABEL[impersonationSession.targetRole]?.name}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold mb-1">原始角色</div>
                    <div className="text-sm font-bold text-gray-900">{ROLE_LABEL[impersonationSession.originalRole]?.name}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold mb-1">写入权限</div>
                    <div className={cn("text-sm font-bold flex items-center gap-1", impersonationSession.writeAllowed ? "text-green-600" : "text-orange-600")}>
                      {impersonationSession.writeAllowed ? <CheckCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                      {impersonationSession.writeAllowed ? "真实写入" : "模拟写入"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold mb-1">已持续时长</div>
                    <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(impersonationSession.startTime, impersonationSession.endTime)}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 mb-2 font-semibold">权限规则列表（{impersonationSession.permissionBoundary.length}条）</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {impersonationSession.permissionBoundary.map((item, idx) => {
                    const parsed = parsePermissionItem(item);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                          parsed.allowed
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-red-50 border border-red-200 text-red-700"
                        )}
                      >
                        {parsed.allowed ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span className="font-medium">{parsed.desc}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-[10px] text-gray-400">
                  开始时间：{formatTime(impersonationSession.startTime)}
                  {impersonationSession.endTime && ` | 结束时间：${formatTime(impersonationSession.endTime)}`}
                </div>
              </div>
            )}

            {(operationLogPanelOpen || (historyPanelOpen && selectedHistorySession)) && (
              <div className="bg-white border-b border-amber-200 px-4 sm:px-6 py-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    {selectedHistorySession ? `历史模拟操作记录 (${selectedHistorySession.sessionId.slice(0, 8)}...)` : '本次模拟操作记录'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={operationFilter}
                        onChange={(e) => setOperationFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {operationTypes.map((type) => (
                          <option key={type} value={type}>
                            {type === 'all' ? '全部操作' : type}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedHistorySession ? (
                      <button onClick={() => setSelectedHistorySession(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => setOperationLogPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">时间</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">操作</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">目标</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">详情</th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-600">写入尝试</th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-600">是否允许</th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-600">结果</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOperations.map((op) => (
                        <tr
                          key={op.id}
                          className={cn(
                            "border-b border-gray-100",
                            op.result === 'blocked' && "bg-red-50",
                            op.result === 'simulated' && "bg-orange-50",
                            op.result === 'completed' && "bg-green-50/30"
                          )}
                        >
                          <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">{formatTime(op.timestamp).split(' ')[1]}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">{op.action}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-700 font-mono">{op.target}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-xs truncate">{op.detail}</td>
                          <td className="px-3 py-2 text-center">
                            {op.writeAttempted ? (
                              <span className="text-red-600 font-semibold">是</span>
                            ) : (
                              <span className="text-gray-400">否</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {op.writeAllowed ? (
                              <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              {getResultBadge(op.result)}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOperations.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                            暂无操作记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                  <span>共 {filteredOperations.length} 条记录</span>
                  <span>
                    真实执行: {filteredOperations.filter(o => o.result === 'completed').length} |
                    模拟执行: {filteredOperations.filter(o => o.result === 'simulated').length} |
                    被拦截: {filteredOperations.filter(o => o.result === 'blocked').length}
                  </span>
                </div>
              </div>
            )}

            {historyPanelOpen && !selectedHistorySession && (
              <div className="bg-white border-b border-amber-200 px-4 sm:px-6 py-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-600" />
                    历史模拟记录
                  </h3>
                  <div className="flex items-center gap-2">
                    {impersonationHistory.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('确定要清空所有历史模拟记录吗？')) {
                            clearImpersonationHistory();
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        清空历史
                      </button>
                    )}
                    <button onClick={() => setHistoryPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {impersonationHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无历史模拟记录</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-semibold text-gray-600">模拟角色</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600">原始角色</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600">开始时间</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600">结束时间</th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-600">持续时长</th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-600">操作次数</th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-600">真实写入</th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-600">被拦截</th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-600">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...impersonationHistory].reverse().map((session) => (
                          <tr key={session.sessionId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <span className="font-semibold text-gray-900">
                                {ROLE_LABEL[session.targetRole]?.name}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {ROLE_LABEL[session.originalRole]?.name}
                            </td>
                            <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">
                              {formatTime(session.startTime)}
                            </td>
                            <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">
                              {session.endTime ? formatTime(session.endTime) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700">
                              {formatDuration(session.startTime, session.endTime)}
                            </td>
                            <td className="px-3 py-2 text-center font-semibold text-gray-900">
                              {session.operationLog.length}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="text-green-600 font-semibold">
                                {session.operationLog.filter(o => o.result === 'completed' && o.writeAttempted).length}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="text-red-600 font-semibold">
                                {session.operationLog.filter(o => o.result === 'blocked').length}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => setSelectedHistorySession(session)}
                                className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                查看
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {showBlockedToast && (
              <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
                <XCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold">{blockedMessage}</span>
              </div>
            )}
          </>
        )}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-forest-50">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-forest-50 shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-base text-gray-900 truncate flex items-center gap-2">
                  <span>{pageTitle}</span>
                  {currentNav?.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-warm-100 to-orange-100 text-warm-700 border border-warm-200">
                      {currentNav.badge}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-gray-500">
                  {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {effectiveRole !== 'ops' && (
                <div className="hidden md:flex relative mr-2">
                  <Search className="w-4 h-4" />
                </div>
              )}

              <button className="relative p-2.5 rounded-xl hover:bg-forest-50 transition-all" title="消息通知">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-br from-rose-400 to-red-500 rounded-full border-2 border-white" />
                <span className="hidden sm:hidden text-[9px] absolute -top-0.5 -right-0.5 bg-rose-500 text-white px-1 rounded-full font-bold">3</span>
              </button>

              {(effectiveRole === 'admin' || effectiveRole === 'platform') && (
                <button className="hidden md:inline-flex p-2.5 rounded-xl hover:bg-purple-50 transition-all text-purple-600" title="审核队列">
                  <FileCheck2 className="w-5 h-5" />
                </button>
              )}

              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-forest-50 transition-all border border-transparent hover:border-forest-100"
                  onClick={() => setUserMenuOpen(v => !v)}
                >
                  <div className="w-8.5 rounded-full bg-forest-100 flex items-center justify-center overflow-hidden ring-2 ring-white">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4.5" />
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-800 leading-tight">{user?.nickname}</span>
                    <span className="text-[9px] text-gray-500 font-semibold leading-tight">{roleInfo.name}</span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-forest-100 overflow-hidden animate-in fade-in-up z-50">
                    <div className="p-4 border-b bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-forest-100">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5.5 h-5.5 text-forest-700" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-gray-900 truncate">{user?.nickname}</p>
                          <p className="text-xs truncate text-gray-500">{user?.phone}</p>
                          <p className="text-[10px] mt-0.5 font-mono bg-gradient-to-r bg-clip-text text-transparent font-bold">{roleInfo.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { setUserMenuOpen(false); navigate('/account/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-forest-50 transition-all">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">个人中心</span>
                      </button>
                      <button onClick={() => { setUserMenuOpen(false); navigate('/account/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-forest-50 transition-all">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm">权限与安全</span>
                      </button>
                      <button onClick={() => { setUserMenuOpen(false); navigate('/admin/dashboard'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-forest-50 transition-all">
                        <ClipboardList className="w-4 h-4" />
                        <span className="text-sm">操作日志</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-all"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">安全退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-28 lg:pb-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl animate-in fade-in-up duration-500">
            <Outlet />
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-forest-100 px-2 py-2 shadow-2xl">
          <div className="grid grid-cols-5 gap-1">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path
                || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all duration-300',
                    isActive
                      ? 'text-white bg-gradient-to-br from-forest-500 to-emerald-600 shadow-lg'
                      : 'text-gray-500 hover:text-gray-700'
                    )}
                >
                  <item.icon className={cn('w-5.5 h-5.5', isActive && 'animate-pulse-soft')} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
