import { useState, useEffect, useRef } from 'react';
import { 
  Building2, Users, Package, CheckCircle, 
  AlertTriangle, DollarSign, TrendingUp,
  RefreshCw, Clock, MapPin, Activity
} from 'lucide-react';
import dayjs from 'dayjs';
import { get as apiGet } from '@/utils/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  AreaChart, Area
} from 'recharts';
import type { GlobalDashboardData } from 'shared/types';
import { cn } from '@/lib/utils';

const mockData: GlobalDashboardData = {
  totalOutlets: 156,
  totalCouriers: 892,
  totalTasksToday: 3842,
  completedTasksToday: 3256,
  pendingTasks: 486,
  exceptionTasks: 32,
  totalRevenueToday: 128560.5,
  averagePickupTime: 38,
  outletRankings: [
    { outletId: '1', outletName: '北京朝阳区建国路网点', completedTasks: 486, totalRevenue: 18560 },
    { outletId: '2', outletName: '北京海淀区中关村网点', completedTasks: 412, totalRevenue: 15820 },
    { outletId: '3', outletName: '上海浦东新区陆家嘴网点', completedTasks: 398, totalRevenue: 15240 },
    { outletId: '4', outletName: '广州天河区珠江新城网点', completedTasks: 356, totalRevenue: 13680 },
    { outletId: '5', outletName: '深圳南山区科技园网点', completedTasks: 342, totalRevenue: 13120 },
    { outletId: '6', outletName: '杭州西湖区文三路网点', completedTasks: 318, totalRevenue: 12180 },
    { outletId: '7', outletName: '成都高新区天府大道网点', completedTasks: 296, totalRevenue: 11340 },
    { outletId: '8', outletName: '武汉武昌区东湖路网点', completedTasks: 284, totalRevenue: 10880 },
    { outletId: '9', outletName: '南京鼓楼区中山路网点', completedTasks: 276, totalRevenue: 10560 },
    { outletId: '10', outletName: '西安雁塔区长安路网点', completedTasks: 258, totalRevenue: 9880 },
  ],
  hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    tasks: Math.floor(Math.random() * 300) + 50
  })),
  recentExceptions: [
    { taskId: '1', orderNo: 'ORD202401150001', reason: '客户不在家，无法联系', createdAt: '2024-01-15T15:30:00Z' },
    { taskId: '2', orderNo: 'ORD202401150002', reason: '地址错误，无法找到', createdAt: '2024-01-15T15:15:00Z' },
    { taskId: '3', orderNo: 'ORD202401150003', reason: '重量差异较大，客户拒付', createdAt: '2024-01-15T14:45:00Z' },
    { taskId: '4', orderNo: 'ORD202401150004', reason: '物品破损，需要处理', createdAt: '2024-01-15T14:20:00Z' },
    { taskId: '5', orderNo: 'ORD202401150005', reason: '客户取消订单', createdAt: '2024-01-15T13:50:00Z' },
    { taskId: '6', orderNo: 'ORD202401150006', reason: '天气原因，延迟揽收', createdAt: '2024-01-15T13:30:00Z' },
    { taskId: '7', orderNo: 'ORD202401150007', reason: '快递员车辆故障', createdAt: '2024-01-15T12:45:00Z' },
    { taskId: '8', orderNo: 'ORD202401150008', reason: '系统分配错误', createdAt: '2024-01-15T12:10:00Z' },
  ]
};

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

export default function GlobalDashboard() {
  const [data, setData] = useState<GlobalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useRef(0);
  const animationRef = useRef<number>();

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setLoading(true);
    try {
      const result = await apiGet<GlobalDashboardData>('/dashboard/global');
      setData(result);
    } catch (error) {
      console.error('Fetch global dashboard error:', error);
      setData(mockData);
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
  const completionRate = ((data.completedTasksToday / data.totalTasksToday) * 100).toFixed(1);

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
      value: data.totalTasksToday, 
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
      value: data.exceptionTasks, 
      icon: AlertTriangle, 
      color: 'from-red-500 to-rose-500',
      suffix: '单'
    },
    { 
      label: '今日营收', 
      value: `¥${(data.totalRevenueToday / 10000).toFixed(2)}`, 
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
              className="h-[280px] overflow-hidden space-y-2"
            >
              {[...data.recentExceptions, ...data.recentExceptions].map((exception, index) => (
                <div
                  key={`${exception.taskId}-${index}`}
                  className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30 hover:border-red-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-blue-400">{exception.orderNo}</span>
                    <span className="text-xs text-gray-400">
                      {dayjs(exception.createdAt).format('HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-1">{exception.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
