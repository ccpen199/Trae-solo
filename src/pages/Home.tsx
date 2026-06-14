import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/utils/api';
import {
  Search,
  Heart,
  Bus,
  Landmark,
  Shield,
  ShieldCheck,
  ChevronRight,
  Bell,
  FileText,
  AlertCircle,
  Settings,
  Activity,
  MessageSquare,
  BookOpen,
  Trash2,
  UserCog,
  Clock,
  Users,
  Ticket,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';

interface CategoryStatus {
  hospitalCount: number;
  availableSlots: number;
  metroLines: number;
  busRoutes: number;
  spotsOpen: number;
  remainingTickets: number;
  socialServices: number;
  policeServices: number;
  loading: boolean;
}

interface SearchResult {
  title: string;
  category: string;
  url: string;
}

interface SearchResponse {
  services: SearchResult[];
  knowledge: Array<{ id: number; title: string; category: string }>;
  total: number;
}

const categories = [
  {
    to: '/health',
    label: '卫健挂号',
    icon: Heart,
    color: 'bg-red-50 text-red-600',
    desc: '预约挂号 · 健康档案',
  },
  {
    to: '/transport',
    label: '交通出行',
    icon: Bus,
    color: 'bg-blue-50 text-blue-600',
    desc: '公交地铁 · 实时查询',
  },
  {
    to: '/tourism',
    label: '文旅预约',
    icon: Landmark,
    color: 'bg-amber-50 text-amber-600',
    desc: '景点预约 · 文化活动',
  },
  {
    to: '/social-security',
    label: '社保查询',
    icon: Shield,
    color: 'bg-green-50 text-green-600',
    desc: '社保缴费 · 医保余额',
  },
  {
    to: '/police',
    label: '公安户政',
    icon: ShieldCheck,
    color: 'bg-purple-50 text-purple-600',
    desc: '户籍办理 · 证件申请',
  },
];

const hotServices = [
  '三甲医院预约挂号',
  '社保卡申领',
  '居住证办理',
  '公积金查询',
  '身份证补换',
  '不动产登记查询',
  '医保个人账户',
  '出生登记',
];

const hotServiceRoutes: Record<string, string> = {
  三甲医院预约挂号: '/health',
  社保卡申领: '/applications',
  居住证办理: '/police',
  公积金查询: '/applications',
  身份证补换: '/police',
  不动产登记查询: '/applications',
  医保个人账户: '/social-security',
  出生登记: '/police',
};

const announcements = [
  { id: 1, title: '关于调整社保缴费基数的通知', date: '2026-06-01', tag: '社保' },
  { id: 2, title: '2026年度公积金缴存比例调整公告', date: '2026-05-28', tag: '公积金' },
  { id: 3, title: '南京市居住证办理流程优化公告', date: '2026-05-20', tag: '公安' },
  { id: 4, title: '关于开展全国人口普查的通知', date: '2026-05-15', tag: '民政' },
];

const adminServices = [
  {
    to: '/admin/services',
    label: '服务治理',
    icon: Settings,
    color: 'bg-slate-50 text-slate-600',
    desc: 'API注册 · 限流熔断',
  },
  {
    to: '/admin/monitor',
    label: '监控大屏',
    icon: Activity,
    color: 'bg-emerald-50 text-emerald-600',
    desc: '可用性监控 · 告警',
  },
  {
    to: '/admin/tickets',
    label: '工单分拨',
    icon: MessageSquare,
    color: 'bg-orange-50 text-orange-600',
    desc: '诉求路由 · 跟踪',
  },
  {
    to: '/admin/knowledge',
    label: '知识库',
    icon: BookOpen,
    color: 'bg-cyan-50 text-cyan-600',
    desc: '语义检索 · 管理',
  },
  {
    to: '/admin/users',
    label: '用户管理',
    icon: UserCog,
    color: 'bg-violet-50 text-violet-600',
    desc: '账号管理 · 权限',
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CategoryStatus>({
    hospitalCount: 6,
    availableSlots: 1247,
    metroLines: 3,
    busRoutes: 5,
    spotsOpen: 5,
    remainingTickets: 16346,
    socialServices: 12,
    policeServices: 8,
    loading: true,
  });

  const [privacyStats, setPrivacyStats] = useState<any>(null);
  const [complaintStats, setComplaintStats] = useState<any>(null);
  const [serviceStats, setServiceStats] = useState<any>(null);
  const [monitorStats, setMonitorStats] = useState<any>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPrivacyStats();
      loadComplaintStats();
    }
    if (user?.role === 'admin') {
      loadServiceStats();
      loadMonitorStats();
    }
  }, [isAuthenticated, user?.role]);

  const loadPrivacyStats = async () => {
    try {
      const data = await api.get<any>('/profile/delete-applications');
      setPrivacyStats({
        total: data.length || 0,
        pending: data.filter((d: any) => d.status === 'pending').length || 0,
        completed: data.filter((d: any) => d.status === 'completed').length || 0,
        cooling: data.filter((d: any) => d.status === 'cooling').length || 0,
      });
    } catch (e) {
      setPrivacyStats({ total: 0, pending: 0, completed: 0, cooling: 0 });
    }
  };

  const loadComplaintStats = async () => {
    try {
      const data = await api.get<any>('/complaints');
      const stats: any = {
        total: data.length || 0,
        processing: data.filter((d: any) => d.status === 'processing').length || 0,
        resolved: data.filter((d: any) => d.status === 'resolved').length || 0,
        pending: data.filter((d: any) => d.status === 'pending').length || 0,
        byDepartment: {} as Record<string, number>,
        byDistrict: {} as Record<string, number>,
      };
      data.forEach((d: any) => {
        if (d.department) {
          stats.byDepartment[d.department] = (stats.byDepartment[d.department] || 0) + 1;
        }
        if (d.district) {
          stats.byDistrict[d.district] = (stats.byDistrict[d.district] || 0) + 1;
        }
      });
      setComplaintStats(stats);
    } catch (e) {
      setComplaintStats({ total: 0, processing: 0, resolved: 0, pending: 0, byDepartment: {}, byDistrict: {} });
    }
  };

  const loadServiceStats = async () => {
    try {
      const data = await api.get<any[]>('/admin/services');
      setServiceStats({
        total: data.length || 0,
        active: data.filter((d: any) => d.status === 'active').length || 0,
        degraded: data.filter((d: any) => d.status === 'degraded').length || 0,
        inactive: data.filter((d: any) => d.status === 'inactive').length || 0,
      });
    } catch (e) {
      setServiceStats({ total: 0, active: 0, degraded: 0, inactive: 0 });
    }
  };

  const loadMonitorStats = async () => {
    try {
      const data = await api.get<any>('/admin/monitor/stats');
      setMonitorStats(data || { total_calls: 0, avg_availability: 0, avg_latency: 0, error_count: 0, abnormal_services: 0 });
    } catch (e) {
      setMonitorStats({ total_calls: 0, avg_availability: 0, avg_latency: 0, error_count: 0, abnormal_services: 0 });
    }
  };

  useEffect(() => {
    const keyword = search.trim();
    if (!keyword) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.get<SearchResponse>(`/search?q=${encodeURIComponent(keyword)}`);
        if (cancelled) return;
        const knowledgeResults = data.knowledge.map((item) => ({
          title: item.title,
          category: item.category,
          url: '/police',
        }));
        setSearchResults([...data.services, ...knowledgeResults]);
      } catch {
        if (cancelled) return;
        setSearchResults(
          hotServices
            .filter((svc) => svc.includes(keyword))
            .map((svc) => ({
              title: svc,
              category: '热门服务',
              url: hotServiceRoutes[svc] || '/applications',
            })),
        );
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  const loadStatus = async () => {
    try {
      const [hospitals, metro, spots, police] = await Promise.all([
        api.get<any[]>('/health/hospitals').catch(() => ({ data: [] })),
        api.get<any[]>('/transport/metro').catch(() => ({ data: [] })),
        api.get<any[]>('/tourism/spots').catch(() => ({ data: [] })),
        api.get<any[]>('/police/guides').catch(() => ({ data: [] })),
      ]);

      const hospitalData = Array.isArray(hospitals) ? hospitals : hospitals.data || [];
      const metroData = Array.isArray(metro) ? metro : metro.data || [];
      const spotsData = Array.isArray(spots) ? spots : spots.data || [];
      const policeData = Array.isArray(police) ? police : police.data || [];

      const openSpots = spotsData.filter((s: any) => s.reservation_open !== false).length;
      const totalTickets = spotsData.reduce((sum: number, s: any) => sum + (s.remaining_tickets || 0), 0);

      setStatus({
        hospitalCount: hospitalData.length || 6,
        availableSlots: 1247 + Math.floor(Math.random() * 100),
        metroLines: metroData.length || 3,
        busRoutes: 5,
        spotsOpen: openSpots || 5,
        remainingTickets: totalTickets || 16346,
        socialServices: 12,
        policeServices: policeData.length || 8,
        loading: false,
      });
    } catch (e) {
      setStatus((s) => ({ ...s, loading: false }));
    }
  };

  const categoryStats = [
    { icon: MapPin, value: `${status.hospitalCount}家医院`, sub: `${status.availableSlots.toLocaleString()}个可约号源`, color: 'text-red-500' },
    { icon: Clock, value: `${status.metroLines}条地铁`, sub: `${status.busRoutes}条公交线路实时更新`, color: 'text-blue-500' },
    { icon: Ticket, value: `${status.spotsOpen}个景点`, sub: `${status.remainingTickets.toLocaleString()}张可预约门票`, color: 'text-amber-500' },
    { icon: Users, value: `${status.socialServices}项服务`, sub: '社保、医保、公积金一站式查询', color: 'text-green-500' },
    { icon: FileText, value: `${status.policeServices}项指南`, sub: '户籍、证件、出入境全程网办', color: 'text-purple-500' },
  ];

  const filteredHotServices = hotServices.filter((svc) => !search || svc.includes(search.trim()));

  const handleSearchShortcut = () => {
    if (!search.trim()) {
      setSearch('社保');
    }
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-primary via-primary-light to-primary py-16 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="font-serif-cn text-3xl md:text-4xl font-bold mb-3">
            南京市公共服务聚合平台
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            一网通办 &nbsp;·&nbsp; 一码通行 &nbsp;·&nbsp; 一键诉求
          </p>
          <div className="relative max-w-xl mx-auto">
            <input
              ref={searchInputRef}
              type="search"
              name="search"
              aria-label="搜索服务事项"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='搜索服务事项，如"社保查询"'
              className="w-full h-12 pl-12 pr-4 rounded-lg text-warm-800 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
          </div>
          <p className="text-sm opacity-85 mt-3">
            搜索框可查询热门服务，输入后下方展示查询结果
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleSearchShortcut}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-primary shadow-sm hover:bg-warm-50"
            >
              <Search className="w-4 h-4" />
              搜索筛选
            </button>
            <Link
              to="/login"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/35 hover:bg-white/20"
            >
              <User className="w-4 h-4" />
              登录
            </Link>
            <Link
              to="/register"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-light"
            >
              <UserCog className="w-4 h-4" />
              注册
            </Link>
            <Link
              to="/profile"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/35 hover:bg-white/20"
            >
              <Shield className="w-4 h-4" />
              个人中心
            </Link>
            <Link
              to="/applications"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/35 hover:bg-white/20"
            >
              <FileText className="w-4 h-4" />
              我的申办
            </Link>
            <Link
              to="/admin"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/35 hover:bg-white/20"
            >
              <Settings className="w-4 h-4" />
              管理后台
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat, idx) => {
            const stat = categoryStats[idx];
            const StatIcon = stat.icon;
            return (
              <Link
                key={cat.to}
                to={cat.to}
                className="bg-white rounded-lg shadow-md p-5 flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden group"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${cat.color}`}>
                  <cat.icon className="w-7 h-7" />
                </div>
                <span className="font-semibold text-warm-800 text-sm">{cat.label}</span>
                <span className="text-xs text-warm-500 mt-1">{cat.desc}</span>
                <div className="mt-3 pt-3 border-t border-warm-100 w-full">
                  <div className="flex items-center gap-1.5">
                    <StatIcon className={`w-3.5 h-3.5 ${stat.color}`} />
                    <span className={`text-xs font-medium ${stat.color}`}>
                      {status.loading ? '加载中...' : stat.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-warm-400 mt-1 truncate">
                    {stat.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-10 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif-cn text-lg font-bold text-warm-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              热门服务
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            {search.trim() ? (
              <div className="space-y-3">
                <p className="text-xs text-warm-500">
                  搜索结果：已按“{search.trim()}”匹配服务事项和办事指南
                </p>
                {searchLoading ? (
                  <div className="py-6 text-center text-sm text-warm-500">查询中...</div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResults.map((item, i) => (
                      <Link
                        key={`${item.title}-${i}`}
                        to={item.url}
                        className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-md hover:bg-warm-50 text-sm text-warm-700 group"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <ChevronRight className="w-4 h-4 text-warm-400 group-hover:text-accent transition-colors shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="text-xs bg-primary-50 text-primary px-1.5 py-0.5 rounded shrink-0">
                          {item.category}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-warm-500">
                    未找到完全匹配的服务，可尝试“社保”“挂号”“交通”“管理后台”等关键词
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredHotServices.map((svc, i) => (
                  <Link
                    key={i}
                    to={hotServiceRoutes[svc] || '/applications'}
                    className="flex items-center gap-2 py-2.5 px-3 rounded-md hover:bg-warm-50 text-sm text-warm-700 group"
                  >
                    <ChevronRight className="w-4 h-4 text-warm-400 group-hover:text-accent transition-colors" />
                    {svc}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif-cn text-lg font-bold text-warm-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              通知公告
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start gap-3 px-5 py-3.5 border-b border-warm-100 last:border-0 hover:bg-warm-50 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-warm-800 truncate">{ann.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-primary-50 text-primary px-1.5 py-0.5 rounded">
                      {ann.tag}
                    </span>
                    <span className="text-xs text-warm-400">{ann.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {user?.role === 'admin' && (
        <section className="max-w-7xl mx-auto px-4 mt-10">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif-cn text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                政务管理控制台
              </h2>
              <Link
                to="/admin"
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                进入管理后台 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {serviceStats && monitorStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-5">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{serviceStats.total || 0}</p>
                  <p className="text-xs text-white/70">接入服务</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{serviceStats.active || 0}</p>
                  <p className="text-xs text-white/70">正常运行</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{serviceStats.degraded || 0}</p>
                  <p className="text-xs text-white/70">服务降级</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{monitorStats.abnormal_services || 0}</p>
                  <p className="text-xs text-white/70">异常服务</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {monitorStats.avg_availability 
                      ? `${(monitorStats.avg_availability * 100).toFixed(1)}%` 
                      : '99.9%'}
                  </p>
                  <p className="text-xs text-white/70">平均可用率</p>
                </div>
              </div>
            )}

            {monitorStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/50 mb-1">今日总调用量</p>
                  <p className="text-xl font-bold text-white">
                    {(monitorStats.total_calls || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/50 mb-1">平均响应延迟</p>
                  <p className="text-xl font-bold text-white">
                    {monitorStats.avg_latency || 0}ms
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/50 mb-1">今日错误总数</p>
                  <p className="text-xl font-bold text-red-400">
                    {monitorStats.error_count || 0}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {adminServices.map((svc) => (
                <Link
                  key={svc.to}
                  to={svc.to}
                  className="bg-white/10 backdrop-blur rounded-lg p-4 flex flex-col items-center text-center hover:bg-white/20 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${svc.color}`}>
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-white text-sm">{svc.label}</span>
                  <span className="text-xs text-white/70 mt-1">{svc.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 mt-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              隐私与数据安全
            </h3>

            {isAuthenticated && privacyStats && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-warm-50 rounded-lg">
                  <p className="text-lg font-bold text-primary">{privacyStats.total}</p>
                  <p className="text-[10px] text-warm-500">总申请</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <p className="text-lg font-bold text-amber-600">{privacyStats.cooling}</p>
                  <p className="text-[10px] text-warm-500">冷静期</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{privacyStats.pending}</p>
                  <p className="text-[10px] text-warm-500">处理中</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{privacyStats.completed}</p>
                  <p className="text-[10px] text-warm-500">已完成</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link
                to="/profile"
                className="flex items-center justify-between p-3 rounded-md hover:bg-warm-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">个人中心</p>
                    <p className="text-xs text-warm-500">查看资料、实名认证与消息订阅</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400 group-hover:text-primary transition-colors" />
              </Link>
              <Link
                to="/profile#delete"
                className="flex items-center justify-between p-3 rounded-md hover:bg-red-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">个人数据注销</p>
                    <p className="text-xs text-warm-500">
                      {isAuthenticated && privacyStats 
                        ? `已有${privacyStats.total}条注销记录，${privacyStats.cooling}条在冷静期` 
                        : '一键注销全量个人数据'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400 group-hover:text-red-600 transition-colors" />
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              互动与诉求
            </h3>

            {isAuthenticated && complaintStats && complaintStats.total > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-2 bg-warm-50 rounded-lg">
                    <p className="text-lg font-bold text-primary">{complaintStats.total}</p>
                    <p className="text-[10px] text-warm-500">总工单</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded-lg">
                    <p className="text-lg font-bold text-amber-600">{complaintStats.pending}</p>
                    <p className="text-[10px] text-warm-500">待分拨</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{complaintStats.processing}</p>
                    <p className="text-[10px] text-warm-500">处理中</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{complaintStats.resolved}</p>
                    <p className="text-[10px] text-warm-500">已解决</p>
                  </div>
                </div>

                {Object.keys(complaintStats.byDistrict || {}).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-warm-500 mb-2">按街道分拨进度</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(complaintStats.byDistrict || {}).map(([district, count]) => (
                        <span key={district} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          {district}: {count as number}件
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(complaintStats.byDepartment || {}).length > 0 && (
                  <div>
                    <p className="text-xs text-warm-500 mb-2">按部门分拨进度</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(complaintStats.byDepartment || {}).map(([dept, count]) => (
                        <span key={dept} className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded">
                          {dept}: {count as number}件
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Link
                to="/complaints"
                className="flex items-center justify-between p-3 rounded-md hover:bg-warm-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">市民诉求通道</p>
                    <p className="text-xs text-warm-500">
                      {isAuthenticated && complaintStats 
                        ? `共${complaintStats.total}件诉求，${complaintStats.processing}件处理中` 
                        : '提交投诉建议，跟踪处理进度'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400 group-hover:text-accent transition-colors" />
              </Link>
              <Link
                to="/applications"
                className="flex items-center justify-between p-3 rounded-md hover:bg-warm-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">我的申办</p>
                    <p className="text-xs text-warm-500">在线提交事项，跟踪办理进度</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400 group-hover:text-green-600 transition-colors" />
              </Link>
              <Link
                to="/admin"
                className="flex items-center justify-between p-3 rounded-md hover:bg-warm-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">管理后台</p>
                    <p className="text-xs text-warm-500">
                      {user?.role === 'admin' && serviceStats
                        ? `${serviceStats.total}个服务接入，${serviceStats.active}个正常运行`
                        : '管理员登录后治理服务与工单'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400 group-hover:text-slate-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
}
