import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, CreditCard, AlertOctagon, Map,
  UserCircle2, CalendarDays, History, BriefcaseBusiness, UsersRound, Home
} from 'lucide-react';
import { cn } from "@/lib/utils";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import WhitelistMgmt from "@/pages/admin/WhitelistMgmt";
import CreditScoreMgmt from "@/pages/admin/CreditScoreMgmt";
import ResignWarning from "@/pages/admin/ResignWarning";
import RegionHeatmap from "@/pages/admin/RegionHeatmap";

import BrokerDashboard from "@/pages/broker/BrokerDashboard";
import ScheduleCenter from "@/pages/broker/ScheduleCenter";
import OrderHistory from "@/pages/broker/OrderHistory";

import FactoryJobsMgmt from "@/pages/factory/FactoryJobsMgmt";
import FactoryApplicants from "@/pages/factory/FactoryApplicants";

import WorkerLayout from "@/components/layout/WorkerLayout";
import WorkerHome from "@/pages/worker/WorkerHome";
import JobDetail from "@/pages/worker/JobDetail";
import FactoryDetail from "@/pages/worker/FactoryDetail";
import InterviewProgress from "@/pages/worker/InterviewProgress";
import Onboarding from "@/pages/worker/Onboarding";
import WorkerProfile from "@/pages/worker/WorkerProfile";

const navGroups = [
  {
    key: 'worker', title: '工人端', accent: 'from-emerald-500 to-emerald-700',
    links: [
      { path: '/worker', label: '找岗首页', icon: Home },
      { path: '/worker/interview', label: '面试进度', icon: CalendarDays },
      { path: '/worker/profile', label: '个人中心', icon: UserCircle2 },
    ],
  },
  {
    key: 'admin', title: '管理后台', accent: 'from-brand-600 to-brand-800',
    links: [
      { path: '/admin/dashboard', label: '数据仪表盘', icon: LayoutDashboard },
      { path: '/admin/whitelist', label: '白名单管理', icon: ShieldCheck },
      { path: '/admin/credit', label: '信用分管理', icon: CreditCard },
      { path: '/admin/resign-warning', label: '离职预警中心', icon: AlertOctagon },
      { path: '/admin/heatmap', label: '区域热力图', icon: Map },
    ],
  },
  {
    key: 'broker', title: '经纪人端', accent: 'from-blue-500 to-blue-700',
    links: [
      { path: '/broker/dashboard', label: '经纪人工作台', icon: UserCircle2 },
      { path: '/broker/schedule', label: '排班中心', icon: CalendarDays },
      { path: '/broker/orders', label: '订单历史', icon: History },
    ],
  },
  {
    key: 'factory', title: '工厂端', accent: 'from-accent-500 to-accent-700',
    links: [
      { path: '/factory/jobs', label: '岗位管理', icon: BriefcaseBusiness },
      { path: '/factory/applicants', label: '应聘者管理', icon: UsersRound },
    ],
  },
];

function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isWorker = pathname.startsWith('/worker');

  if (isHome || isWorker) return <>{children}</>;

  const currentGroup = navGroups.find(g => pathname.startsWith(`/${g.key}`));

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-72 shrink-0 bg-gradient-to-b from-brand-900 via-[#1E3A5F] to-brand-950 text-white flex flex-col shadow-2xl">
        <Link to="/" className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
            <UsersRound className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">蓝领用工</div>
            <div className="text-xs text-white/60 mt-0.5">智慧匹配服务平台</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all">
            <Home className="w-5 h-5" />
            <span className="font-medium">返回首页</span>
          </Link>

          {navGroups.map(group => (
            <div key={group.key}>
              <div className="px-4 mb-2 flex items-center gap-2">
                <div className={cn('w-1 h-5 rounded-full bg-gradient-to-b', group.accent)} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">{group.title}</span>
              </div>
              <div className="space-y-1">
                {group.links.map(link => {
                  const Icon = link.icon;
                  const active = pathname === link.path || pathname.startsWith(link.path + '/');
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                        active
                          ? 'bg-gradient-to-r from-accent-500/90 to-accent-600/90 text-white shadow-lg shadow-accent-500/25 font-semibold'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 shrink-0', active ? '' : 'opacity-80')} />
                      <span className="text-sm">{link.label}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {currentGroup ? (
            <div className={cn('p-4 rounded-xl bg-gradient-to-br', currentGroup.accent + ' shadow-lg')}>
              <div className="text-xs text-white/80 mb-0.5">当前视图</div>
              <div className="font-bold text-lg mb-2">{currentGroup.title}</div>
              <div className="text-xs text-white/80 leading-relaxed">
                {currentGroup.key === 'worker' && '工人端岗位搜索与面试入职管理'}
                {currentGroup.key === 'admin' && '平台全局数据监控与风险管控中心'}
                {currentGroup.key === 'broker' && '经纪人接单排班与服务收入管理'}
                {currentGroup.key === 'factory' && '工厂招聘岗位与应聘人员管理'}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="text-sm text-white/80">请选择功能模块</div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            {currentGroup && (
              <>
                <span className={cn('px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r', currentGroup.accent)}>
                  {currentGroup.title}
                </span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-700 font-medium text-sm">
                  {currentGroup.links.find(l => pathname === l.path || pathname.startsWith(l.path + '/'))?.label || '工作台'}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              系统运行正常 · 数据实时同步
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-md">
                管
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-900 leading-tight">管理员</div>
                <div className="text-xs text-gray-500">admin@platform.com</div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}

function HomeWrapper() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-[#1E3A5F] to-brand-950">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm border border-white/10">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            蓝领用工智慧匹配服务平台 · v2.0 全新发布
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            让<span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">千万蓝领</span>
            <br />精准匹配优质岗位
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed">
            覆盖管理后台 / 经纪人端 / 工厂端 / 工人端 四端一体化服务，
            基于信用分与智能算法实现高效匹配，保障务工权益与用工质量
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {navGroups.map(group => (
            <div key={group.key} className="group relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/10 transition-all hover:scale-[1.02] hover:shadow-2xl">
              <div className="rounded-[22px] bg-white/95 backdrop-blur-sm p-8 h-full">
                <div className={cn('w-16 h-16 rounded-2xl bg-gradient-to-br mb-6 flex items-center justify-center shadow-xl', group.accent + ' shadow-lg')}>
                  {group.key === 'worker' && <Home className="w-8 h-8 text-white" />}
                  {group.key === 'admin' && <ShieldCheck className="w-8 h-8 text-white" />}
                  {group.key === 'broker' && <UserCircle2 className="w-8 h-8 text-white" />}
                  {group.key === 'factory' && <BriefcaseBusiness className="w-8 h-8 text-white" />}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">{group.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {group.links.length}个模块
                  </span>
                </div>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  {group.key === 'worker' && '定位匹配周边岗位、一键预约面试、面试进度跟踪、入职补贴领取'}
                  {group.key === 'admin' && '全局数据监控、工厂白名单审核、工人信用分管理、离职风险预警、区域用工热力图分析'}
                  {group.key === 'broker' && '经纪人工作台、智能排班、订单管理、收入统计、服务评价、工人服务进度实时跟踪'}
                  {group.key === 'factory' && '岗位发布管理、应聘者筛选、面试安排、入职办理、招聘转化数据分析'}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {group.links.map(link => {
                    const Icon = link.icon;
                    return (
                      <span key={link.path} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 text-xs font-medium">
                        <Icon className="w-3.5 h-3.5" />
                        {link.label}
                      </span>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {group.links.map(link => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-brand-50 hover:to-accent-50 text-gray-700 hover:text-brand-700 font-semibold transition-all group-hover:shadow-md border border-transparent hover:border-brand-100"
                      >
                        <Icon className={cn('w-5 h-5', 'group-hover:text-accent-500')} />
                        <span className="flex-1 text-left">{link.label}</span>
                        <span className="text-brand-500 translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '合作工厂', value: '2,800+', sub: '白名单认证' },
            { label: '注册工人', value: '156,000+', sub: '实名认证' },
            { label: '服务经纪人', value: '1,200+', sub: '专业培训' },
            { label: '累计成功入职', value: '480,000+', sub: '稳定履约' },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
              <div className="text-4xl font-black bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent mb-1">{s.value}</div>
              <div className="text-white font-semibold mb-0.5">{s.label}</div>
              <div className="text-white/60 text-xs">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-white/50 text-sm">
          © 2026 蓝领用工智慧匹配平台 · 工业蓝(#1E3A5F) + 活力橙(#FF7A00) 设计规范
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<HomeWrapper />} />

          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<WorkerHome />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="factory/:id" element={<FactoryDetail />} />
            <Route path="interview" element={<InterviewProgress />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>

          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/whitelist" element={<WhitelistMgmt />} />
          <Route path="/admin/credit" element={<CreditScoreMgmt />} />
          <Route path="/admin/resign-warning" element={<ResignWarning />} />
          <Route path="/admin/heatmap" element={<RegionHeatmap />} />

          <Route path="/broker/dashboard" element={<BrokerDashboard />} />
          <Route path="/broker/schedule" element={<ScheduleCenter />} />
          <Route path="/broker/orders" element={<OrderHistory />} />

          <Route path="/factory/jobs" element={<FactoryJobsMgmt />} />
          <Route path="/factory/applicants" element={<FactoryApplicants />} />

          <Route path="*" element={
            <div className="py-20 text-center">
              <div className="text-6xl font-black text-brand-600 mb-4">404</div>
              <div className="text-xl text-gray-600 mb-6">页面不存在或尚未开发</div>
              <Link to="/" className="btn-primary inline-flex">
                <Home className="w-4 h-4" />返回首页
              </Link>
            </div>
          } />
        </Routes>
      </Shell>
    </Router>
  );
}
