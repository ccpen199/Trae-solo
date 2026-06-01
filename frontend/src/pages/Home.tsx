import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingUp,
  MessageCircle,
  Headphones,
  HardHat,
  BarChart,
  Send,
  ClipboardList,
  RotateCcw,
  MapPin,
  Smile,
  Zap,
  History,
  UserCheck,
  PhoneCall,
  Map,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  XCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { api, statusMap, priorityMap } from '@/lib/api';

const roleNavItems = [
  { label: '客服中心', icon: Headphones, color: 'bg-blue-500', description: '工单受理、旅客咨询', path: '/tickets/new' },
  { label: '地服人员', icon: HardHat, color: 'bg-emerald-500', description: '现场处理、到场登记', path: '/tickets' },
  { label: '运营管理', icon: BarChart, color: 'bg-purple-500', description: '运营报表、人员排班', path: '/reports' },
  { label: '异常处理', icon: AlertTriangle, color: 'bg-red-500', description: '异常队列、投诉升级', path: '/exceptions' },
];

const quickActions = [
  { label: '创建工单', icon: MessageCircle, color: 'from-blue-500 to-blue-600', path: '/tickets/new', description: '快速录入旅客服务请求' },
  { label: '待派发', icon: Send, color: 'from-amber-500 to-amber-600', path: '/tickets?status=pending', description: '查看待分派工单' },
  { label: '异常队列', icon: AlertTriangle, color: 'from-red-500 to-red-600', path: '/exceptions', description: '处理异常与投诉升级' },
  { label: '处理记录', icon: ClipboardList, color: 'from-emerald-500 to-emerald-600', path: '/tickets?status=completed', description: '查看已处理工单' },
  { label: '复查记录', icon: RotateCcw, color: 'from-cyan-500 to-cyan-600', path: '/tickets?status=closed', description: '旅客回访与复查' },
  { label: '运营报表', icon: BarChart, color: 'from-purple-500 to-purple-600', path: '/reports', description: '多维度运营分析' },
];

const terminalAreas = [
  { terminal: 'T1', areas: ['A1服务台', 'B2登机口', 'C3行李提取'] },
  { terminal: 'T2', areas: ['D03登机口', 'B08登机口', 'B03服务台'] },
  { terminal: 'T3', areas: ['E21行李提取', 'C15登机口', 'C12登机口'] },
];

interface DashboardData {
  summary: {
    openTickets: number;
    pendingTickets: number;
    processingTickets: number;
    exceptionTickets: number;
    completedTickets: number;
    activeFlights: number;
  };
  flights: Array<any>;
  tickets: Array<any>;
}

interface ReportsData {
  avgResponseSeconds: number;
  avgSatisfaction: number;
  slaComplianceRate: number;
  totalFeedbackCalls: number;
  byArea: Array<any>;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [dashRes, reportsRes] = await Promise.all([
        api.dashboard(),
        api.reports(),
      ]);
      setData(dashRes.data);
      setReportsData(reportsRes.data);
    } catch (e: any) {
      console.error('Load dashboard failed:', e);
      setLoadError(e.message || '数据加载失败');
      setData(null);
      setReportsData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    loadData();
  }

  const summary = data?.summary || {
    openTickets: '-',
    pendingTickets: '-',
    processingTickets: '-',
    exceptionTickets: '-',
    completedTickets: '-',
    activeFlights: 0,
  };

  const statCards = [
    { label: '工单总数', value: summary.openTickets, icon: FileText, color: 'from-blue-500 to-blue-600' },
    { label: '待派发', value: summary.pendingTickets, icon: Clock, color: 'from-amber-500 to-amber-600' },
    { label: '处理中', value: summary.processingTickets, icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
    { label: '异常单', value: summary.exceptionTickets, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
    { label: '已完成', value: summary.completedTickets, icon: CheckCircle, color: 'from-green-500 to-green-600' },
  ];

  const kpiCards = reportsData ? [
    { label: '平均响应时长', value: `${Math.round(reportsData.avgResponseSeconds / 60)}分钟`, icon: Zap, color: 'bg-blue-50' },
    { label: '平均满意度', value: `${reportsData.avgSatisfaction.toFixed(1)}分`, icon: Smile, color: 'bg-green-50' },
    { label: 'SLA达标率', value: `${reportsData.slaComplianceRate}%`, icon: UserCheck, color: 'bg-purple-50' },
    { label: '回访次数', value: reportsData.totalFeedbackCalls, icon: PhoneCall, color: 'bg-cyan-50' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">机场旅客服务工单系统</h2>
          <p className="text-sm text-slate-500 mt-1">航站楼服务请求与投诉处理平台</p>
        </div>
        <div className="flex items-center gap-3">
          {loadError ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm">
              <WifiOff className="w-4 h-4" />
              <span>数据加载失败</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm">
              <Wifi className="w-4 h-4" />
              <span>服务正常</span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            快速受理
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800">数据加载失败</h4>
              <p className="text-sm text-red-600 mt-1">{loadError}</p>
              <p className="text-sm text-red-500 mt-2">请检查后端服务是否正常，或点击"刷新"按钮重试。所有功能入口仍可使用。</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">航站楼服务入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roleNavItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-all group"
            >
              <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-white/70 mt-1">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-md`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{loading ? '-' : card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {kpiCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => (
            <div key={idx} className={`${card.color} rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <card.icon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            快捷操作
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.path}
              className="flex flex-col items-center p-4 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-medium text-slate-800 text-sm">{action.label}</p>
              <p className="text-xs text-slate-500 text-center mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-600" />
              今日航班动态
            </h3>
            <span className="text-xs text-slate-500">
              {loading ? '-' : summary.activeFlights} 个活跃航班
            </span>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">加载中...</p>
              </div>
            ) : data?.flights && data.flights.length > 0 ? (
              data.flights.slice(0, 6).map((f: any) => (
                <div key={f.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Plane className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{f.flightNo}</p>
                      <p className="text-xs text-slate-500">{f.airline} · {f.terminal}-{f.gate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      f.status === 'boarding' ? 'bg-green-100 text-green-700' :
                      f.status === 'delayed' ? 'bg-red-100 text-red-700' :
                      f.status === 'arrived' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {f.status === 'boarding' ? '登机中' :
                       f.status === 'delayed' ? '延误' :
                       f.status === 'arrived' ? '已到达' :
                       f.status === 'on-time' ? '准点' : f.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(f.departureTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无航班数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              最新工单
            </h3>
            <Link to="/tickets" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">加载中...</p>
              </div>
            ) : data?.tickets && data.tickets.length > 0 ? (
              data.tickets.slice(0, 5).map((t: any) => (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="px-5 py-3 block hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${priorityMap[t.priority]?.color || 'bg-gray-100'}`}>
                          {priorityMap[t.priority]?.label || t.priority}
                        </span>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusMap[t.status]?.color || 'bg-gray-100'}`}>
                          {statusMap[t.status]?.label || t.status}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{t.passengerName} · {t.serviceType}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.flightNo ? `${t.flightNo} · ` : ''}{t.terminal}-{t.area}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">{t.assignedTo}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无工单数据</p>
                <Link
                  to="/tickets/new"
                  className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  创建第一个工单 →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600" />
                航站楼服务点
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {terminalAreas.map((term, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-slate-800 text-white text-xs font-bold rounded flex items-center justify-center">
                      {term.terminal}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{term.terminal} 航站楼</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-8">
                    {term.areas.map((area, aIdx) => (
                      <Link
                        key={aIdx}
                        to={`/tickets/new?terminal=${term.terminal}&area=${encodeURIComponent(area)}`}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                      >
                        {area}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                处理状态追踪
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Link to="/exceptions?type=complaint_escalation" className="flex items-center gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">投诉升级</p>
                    <p className="text-xs text-slate-500">需重点处理</p>
                  </div>
                </Link>
                <Link to="/exceptions?type=mis_assignment" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Send className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">误派单</p>
                    <p className="text-xs text-slate-500">重新分派</p>
                  </div>
                </Link>
                <Link to="/reports" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">超时工单</p>
                    <p className="text-xs text-slate-500">SLA监控</p>
                  </div>
                </Link>
                <Link to="/reports" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <PhoneCall className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">旅客回访</p>
                    <p className="text-xs text-slate-500">满意度追踪</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportsData?.byArea && reportsData.byArea.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Map className="w-4 h-4 text-orange-500" />
              热点区域 TOP 5
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-4">
              {reportsData.byArea.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="text-center">
                  <div className="relative w-full">
                    <div className="bg-orange-100 rounded-lg p-3">
                      <p className="text-2xl font-bold text-orange-600">{item.count}</p>
                      <p className="text-xs text-orange-600">工单</p>
                    </div>
                    {idx === 0 && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-2 font-medium">{item.area}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
