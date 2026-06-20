import { useState, useEffect, useRef } from 'react';
import { 
  Building2, Users, Package, CheckCircle, 
  AlertTriangle, DollarSign, TrendingUp,
  RefreshCw, Clock, MapPin, Activity,
  UserCheck, XCircle, RotateCcw, UserPlus,
  Loader2, Search
} from 'lucide-react';
import dayjs from 'dayjs';
import { get as apiGet, post as apiPost } from '@/utils/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  AreaChart, Area
} from 'recharts';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { Modal, ModalFooter } from '@/components/Modal';
import type { User } from 'shared/types';
import { cn } from '@/lib/utils';

interface ExceptionItem {
  id: string;
  orderNo: string;
  outletName: string;
  courierName: string;
  exceptionReason: string;
  createdAt: string;
  status: string;
}

interface DashboardData {
  totalTasks: number;
  pending: number;
  exception: number;
  totalRevenue: number;
  totalCouriers: number;
  totalOutlets: number;
  recentExceptions: ExceptionItem[];
  hourlyTrend: { hour: string; tasks: number }[];
  outletRankings: { outletId: string; outletName: string; completedTasks: number; totalRevenue: number }[];
}

const provinceData = [
  { name: '北京', value: 486, x: 82, y: 35 },
  { name: '天津', value: 215, x: 85, y: 42 },
  { name: '上海', value: 398, x: 88, y: 58 },
  { name: '重庆', value: 186, x: 58, y: 65 },
  { name: '河北', value: 256, x: 80, y: 48 },
  { name: '山西', value: 178, x: 72, y: 45 },
  { name: '辽宁', value: 198, x: 88, y: 30 },
  { name: '吉林', value: 145, x: 90, y: 22 },
  { name: '黑龙江', value: 132, x: 92, y: 15 },
  { name: '江苏', value: 365, x: 82, y: 62 },
  { name: '浙江', value: 318, x: 80, y: 68 },
  { name: '安徽', value: 212, x: 75, y: 65 },
  { name: '福建', value: 245, x: 78, y: 78 },
  { name: '江西', value: 189, x: 72, y: 72 },
  { name: '山东', value: 342, x: 78, y: 50 },
  { name: '河南', value: 278, x: 68, y: 55 },
  { name: '湖北', value: 284, x: 65, y: 62 },
  { name: '湖南', value: 223, x: 68, y: 70 },
  { name: '广东', value: 412, x: 70, y: 85 },
  { name: '广西', value: 156, x: 62, y: 82 },
  { name: '海南', value: 89, x: 58, y: 92 },
  { name: '四川', value: 296, x: 48, y: 65 },
  { name: '贵州', value: 142, x: 55, y: 75 },
  { name: '云南', value: 167, x: 45, y: 78 },
  { name: '陕西', value: 258, x: 60, y: 45 },
  { name: '甘肃', value: 112, x: 48, y: 42 },
  { name: '青海', value: 68, x: 38, y: 38 },
  { name: '内蒙古', value: 134, x: 65, y: 28 },
  { name: '新疆', value: 98, x: 20, y: 35 },
  { name: '西藏', value: 45, x: 25, y: 58 },
  { name: '宁夏', value: 78, x: 55, y: 40 },
  { name: '台湾', value: 0, x: 85, y: 82 },
  { name: '香港', value: 0, x: 75, y: 88 },
  { name: '澳门', value: 0, x: 73, y: 90 },
];

const getHeatColor = (value: number, max: number) => {
  const ratio = value / max;
  if (ratio > 0.8) return '#dc2626';
  if (ratio > 0.6) return '#ea580c';
  if (ratio > 0.4) return '#f59e0b';
  if (ratio > 0.2) return '#eab308';
  return '#65a30d';
};

type InterveneAction = 'mark_completed' | 'mark_exception' | 'cancel' | 'reassign';

export default function GlobalDashboard() {
  const hasRole = useAuthStore(state => state.hasRole);
  const addNotification = useAppStore(state => state.addNotification);
  const isOperator = hasRole(['operator']);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useRef(0);
  const animationRef = useRef<number>();

  const [isInterveneModalOpen, setIsInterveneModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedException, setSelectedException] = useState<ExceptionItem | null>(null);
  const [selectedAction, setSelectedAction] = useState<InterveneAction | null>(null);
  const [interveneReason, setInterveneReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couriers, setCouriers] = useState<User[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [courierSearch, setCourierSearch] = useState('');
  const [loadingCouriers, setLoadingCouriers] = useState(false);

  const transformExceptions = (raw: any[]): ExceptionItem[] => {
    return raw.map((item) => ({
      id: item.taskId || item.id,
      orderNo: item.orderNo,
      outletName: item.outletName || '-',
      courierName: item.courierName || '-',
      exceptionReason: item.exceptionReason || item.reason || '-',
      createdAt: item.createdAt,
      status: item.status || 'exception',
    }));
  };

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setLoading(true);
    try {
      const result = await apiGet<any>('/dashboard/global');
      const transformed: DashboardData = {
        totalTasks: result.totalTasksToday || 0,
        pending: result.pendingTasks || 0,
        exception: result.exceptionTasks || 0,
        totalRevenue: result.totalRevenueToday || 0,
        totalCouriers: result.totalCouriers || 0,
        totalOutlets: result.totalOutlets || 0,
        recentExceptions: transformExceptions(result.recentExceptions || []),
        hourlyTrend: result.hourlyTrend || [],
        outletRankings: result.outletRankings || [],
      };
      setData(transformed);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取全局数据失败',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const animate = () => {
      scrollOffset.current += 0.5;
      if (scrollOffset.current >= scrollContainer.scrollHeight / 2) {
        scrollOffset.current = 0;
      }
      scrollContainer.scrollTop = scrollOffset.current;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data]);

  const openInterveneModal = (exception: ExceptionItem, action: InterveneAction) => {
    setSelectedException(exception);
    setSelectedAction(action);
    setInterveneReason('');
    if (action === 'reassign') {
      openReassignModal(exception);
    } else {
      setIsInterveneModalOpen(true);
    }
  };

  const openReassignModal = (exception: ExceptionItem) => {
    setSelectedException(exception);
    setSelectedAction('reassign');
    setSelectedCourierId('');
    setCourierSearch('');
    setIsReassignModalOpen(true);
    fetchCouriers();
  };

  const fetchCouriers = async () => {
    try {
      setLoadingCouriers(true);
      const result = await apiGet<{ list: User[]; total: number }>('/couriers', {
        params: { pageSize: 100 },
      });
      setCouriers(result.list || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取快递员列表失败',
      });
    } finally {
      setLoadingCouriers(false);
    }
  };

  const handleIntervene = async () => {
    if (!selectedException || !selectedAction) return;

    if (selectedAction !== 'mark_completed' && selectedAction !== 'mark_exception' && selectedAction !== 'cancel' && !interveneReason.trim()) {
      addNotification({
        type: 'error',
        title: '参数错误',
        message: '请输入干预原因',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost(`/tasks/${selectedException.id}/intervene`, {
        action: selectedAction,
        reason: interveneReason || undefined,
      });
      addNotification({
        type: 'success',
        title: '操作成功',
        message: `已成功${getActionLabel(selectedAction)}`,
      });
      setIsInterveneModalOpen(false);
      setInterveneReason('');
      fetchData();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.message || '干预操作失败',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedException || !selectedCourierId) {
      addNotification({
        type: 'error',
        title: '参数错误',
        message: '请选择要重新指派的快递员',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost(`/tasks/${selectedException.id}/intervene`, {
        action: 'reassign',
        reason: interveneReason || '重新指派快递员',
        courierId: selectedCourierId,
      });
      addNotification({
        type: 'success',
        title: '操作成功',
        message: '已成功重新指派快递员',
      });
      setIsReassignModalOpen(false);
      setSelectedCourierId('');
      setInterveneReason('');
      fetchData();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.message || '重新指派失败',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionLabel = (action: InterveneAction) => {
    const labels: Record<InterveneAction, string> = {
      mark_completed: '标记为完成',
      mark_exception: '标记为异常',
      cancel: '取消任务',
      reassign: '重新指派',
    };
    return labels[action];
  };

  const filteredCouriers = couriers.filter(c =>
    c.name.toLowerCase().includes(courierSearch.toLowerCase()) ||
    c.phone.includes(courierSearch)
  );

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-lg">数据加载中...</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...provinceData.map(p => p.value));
  const completionRate = data.totalTasks > 0
    ? (((data.totalTasks - data.pending - data.exception) / data.totalTasks) * 100).toFixed(1)
    : '0.0';

  const metricCards = [
    { 
      label: '网点总数', 
      value: data.totalOutlets, 
      icon: Building2, 
      color: 'from-blue-500 to-cyan-500',
      suffix: '个'
    },
    { 
      label: '快递员总数', 
      value: data.totalCouriers, 
      icon: Users, 
      color: 'from-emerald-500 to-teal-500',
      suffix: '人'
    },
    { 
      label: '今日任务', 
      value: data.totalTasks, 
      icon: Package, 
      color: 'from-amber-500 to-orange-500',
      suffix: '单'
    },
    { 
      label: '完成率', 
      value: `${completionRate}%`, 
      icon: CheckCircle, 
      color: 'from-green-500 to-emerald-500',
      suffix: ''
    },
    { 
      label: '待处理异常', 
      value: data.exception, 
      icon: AlertTriangle, 
      color: 'from-red-500 to-rose-500',
      suffix: '单'
    },
    { 
      label: '今日营收', 
      value: `¥${(data.totalRevenue / 10000).toFixed(2)}`, 
      icon: DollarSign, 
      color: 'from-purple-500 to-violet-500',
      suffix: '万'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white">
      <div className="max-w-[1920px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                全局数据看板
              </h1>
              <p className="text-gray-400 text-sm">实时监控全国揽收运营数据</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>更新时间: {dayjs(lastUpdated).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">实时更新中</span>
            </div>
            <button
              onClick={() => fetchData(true)}
              className={cn(
                'p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors',
                isRefreshing && 'animate-spin'
              )}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="relative overflow-hidden bg-slate-800/50 backdrop-blur rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all hover:scale-[1.02] group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <div className={cn('absolute inset-0 bg-gradient-to-br rounded-full blur-3xl', card.color)} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                      card.color
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <TrendingUp className={cn(
                      'w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity',
                      index % 2 === 0 ? 'text-green-400' : 'text-red-400'
                    )} />
                  </div>
                  <p className="text-3xl font-bold mb-1">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    <span className="text-lg text-gray-400 ml-1">{card.suffix}</span>
                  </p>
                  <p className="text-gray-400 text-sm">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-400" />
            全国揽收热力分布
          </h2>
          <div className="relative h-[400px] flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full max-w-4xl">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {provinceData.map((province) => (
                <g key={province.name}>
                  <circle
                    cx={province.x}
                    cy={province.y}
                    r={Math.max(1, province.value / 80)}
                    fill={getHeatColor(province.value, maxValue)}
                    opacity={0.7}
                    filter="url(#glow)"
                    className="animate-pulse"
                  />
                  <circle
                    cx={province.x}
                    cy={province.y}
                    r={Math.max(0.5, province.value / 120)}
                    fill="white"
                    opacity={0.9}
                  />
                  <text
                    x={province.x}
                    y={province.y - Math.max(1.5, province.value / 60) - 0.5}
                    textAnchor="middle"
                    fontSize="2.5"
                    fill="white"
                    opacity={0.8}
                  >
                    {province.name}
                  </text>
                </g>
              ))}
            </svg>
            
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#65a30d]" />
                <span className="text-xs text-gray-300">低</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#eab308]" />
                <span className="text-xs text-gray-300">较低</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <span className="text-xs text-gray-300">中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#ea580c]" />
                <span className="text-xs text-gray-300">较高</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
                <span className="text-xs text-gray-300">高</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              24小时揽收趋势
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#475569' }}
                    interval={2}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                      color: 'white'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number) => [`${value} 单`, '揽收量']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fill="url(#colorTasks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-4 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              网点业绩排行 TOP10
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.outletRankings} 
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <YAxis 
                    dataKey="outletName"
                    type="category"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#475569' }}
                    width={100}
                    tickFormatter={(value) => value.replace('网点', '').slice(0, 8)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                      color: 'white'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number, name: string) => [
                      name === 'completedTasks' ? `${value} 单` : `¥${value.toLocaleString()}`,
                      name === 'completedTasks' ? '完成单数' : '营收'
                    ]}
                  />
                  <Bar 
                    dataKey="completedTasks" 
                    fill="#10b981" 
                    radius={[0, 4, 4, 0]}
                    name="completedTasks"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-4 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              最近异常
              <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                {data.recentExceptions.length}
              </span>
            </h3>
            <div 
              ref={scrollRef}
              className="h-[520px] overflow-hidden space-y-2"
            >
              {[...data.recentExceptions, ...data.recentExceptions].map((exception, index) => (
                <div
                  key={`${exception.id}-${index}`}
                  className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30 hover:border-red-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-blue-400">{exception.orderNo}</span>
                    <span className="text-xs text-gray-400">
                      {dayjs(exception.createdAt).format('HH:mm')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{exception.outletName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{exception.courierName}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2 mb-3">{exception.exceptionReason}</p>
                  {isOperator && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-600/30">
                      <button
                        onClick={() => openInterveneModal(exception, 'mark_completed')}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        <UserCheck className="w-3 h-3" />
                        标记完成
                      </button>
                      <button
                        onClick={() => openInterveneModal(exception, 'mark_exception')}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        标记异常
                      </button>
                      <button
                        onClick={() => openInterveneModal(exception, 'cancel')}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        取消任务
                      </button>
                      <button
                        onClick={() => openReassignModal(exception)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <UserPlus className="w-3 h-3" />
                        重新指派
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isInterveneModalOpen}
        onClose={() => setIsInterveneModalOpen(false)}
        title={selectedAction ? getActionLabel(selectedAction) : '任务干预'}
        size="md"
      >
        <div className="space-y-4">
          {selectedException && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold text-gray-900">{selectedException.orderNo}</span>
                <span className="text-sm text-gray-500">
                  {dayjs(selectedException.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              <p className="text-sm text-gray-600">{selectedException.exceptionReason}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              干预原因
            </label>
            <textarea
              value={interveneReason}
              onChange={(e) => setInterveneReason(e.target.value)}
              placeholder="请输入干预原因..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setIsInterveneModalOpen(false)}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleIntervene}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                确认操作
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="重新指派快递员"
        size="lg"
      >
        <div className="space-y-4">
          {selectedException && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold text-gray-900">{selectedException.orderNo}</span>
                <span className="text-sm text-gray-500">
                  当前快递员: {selectedException.courierName}
                </span>
              </div>
              <p className="text-sm text-gray-600">{selectedException.exceptionReason}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              干预原因
            </label>
            <input
              type="text"
              value={interveneReason}
              onChange={(e) => setInterveneReason(e.target.value)}
              placeholder="请输入干预原因（选填）"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择快递员
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={courierSearch}
                onChange={(e) => setCourierSearch(e.target.value)}
                placeholder="搜索快递员姓名或手机号"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {loadingCouriers ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : filteredCouriers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  暂无匹配的快递员
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredCouriers.map((courier) => (
                    <button
                      key={courier.id}
                      type="button"
                      onClick={() => setSelectedCourierId(courier.id)}
                      className={cn(
                        'w-full p-3 flex items-center gap-3 text-left transition-colors hover:bg-blue-50',
                        selectedCourierId === courier.id && 'bg-blue-50'
                      )}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                        {courier.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{courier.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {courier.phone} · {courier.outletName || '未分配网点'}
                        </p>
                      </div>
                      {selectedCourierId === courier.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setIsReassignModalOpen(false)}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleReassign}
            disabled={isSubmitting || !selectedCourierId}
            className="px-8 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                指派中...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                确认指派
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
