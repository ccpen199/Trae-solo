import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import ReactECharts from 'echarts-for-react';
import { MapPin, Clock, Star, AlertTriangle, TrendingUp, Users, ShoppingBag, Wallet } from 'lucide-react';

const mapWidth = 800;
const mapHeight = 500;

interface MapPoint {
  id: string;
  x: number;
  y: number;
  type: 'order' | 'worker';
  status?: string;
  label?: string;
}

function MapView() {
  const { orders, workers } = useAppStore();
  const [points, setPoints] = useState<MapPoint[]>([]);

  useEffect(() => {
    const orderPoints: MapPoint[] = orders
      .filter(o => o.status === 'in_service' || o.status === 'pending')
      .map((o, i) => ({
        id: `o-${o.id}`,
        x: 100 + (i * 60) % 600,
        y: 80 + ((i * 47) % 350),
        type: 'order',
        status: o.status,
        label: o.faultTypeName,
      }));

    const workerPoints: MapPoint[] = workers
      .filter(w => w.status !== 'offline')
      .map((w, i) => ({
        id: `w-${w.id}`,
        x: 150 + (i * 53) % 550,
        y: 120 + ((i * 39) % 300),
        type: 'worker',
        status: w.status,
        label: w.name,
      }));

    setPoints([...orderPoints, ...workerPoints]);
  }, [orders, workers]);

  const roads = [
    { d: 'M0,200 L800,180', stroke: '#334155', strokeWidth: 3 },
    { d: 'M0,320 L800,340', stroke: '#334155', strokeWidth: 3 },
    { d: 'M120,0 L100,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M350,0 L370,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M580,0 L600,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M700,0 L720,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M0,260 L800,250', stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' },
    { d: 'M200,0 L210,500', stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' },
    { d: 'M480,0 L490,500', stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' },
  ];

  const blocks = [
    { x: 0, y: 0, w: 100, h: 200, name: '陆家嘴CBD' },
    { x: 100, y: 0, w: 250, h: 200, name: '潍坊新村' },
    { x: 350, y: 0, w: 230, h: 180, name: '塘桥' },
    { x: 580, y: 0, w: 220, h: 200, name: '南码头' },
    { x: 0, y: 200, w: 120, h: 120, name: '源深' },
    { x: 120, y: 200, w: 230, h: 120, name: '世纪公园' },
    { x: 350, y: 180, w: 230, h: 140, name: '花木' },
    { x: 580, y: 200, w: 220, h: 140, name: '北蔡' },
    { x: 0, y: 320, w: 100, h: 180, name: '洋泾' },
    { x: 100, y: 320, w: 270, h: 180, name: '金桥' },
    { x: 370, y: 320, w: 210, h: 180, name: '张江' },
    { x: 580, y: 340, w: 220, h: 160, name: '高行' },
  ];

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
      <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="glow-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

        {blocks.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x + 2}
              y={b.y + 2}
              width={b.w - 4}
              height={b.h - 4}
              fill="rgba(30,41,59,0.5)"
              stroke="#334155"
              strokeWidth="1"
              rx="4"
            />
            <text
              x={b.x + b.w / 2}
              y={b.y + 20}
              textAnchor="middle"
              fill="#64748b"
              fontSize="11"
              fontWeight="500"
            >
              {b.name}
            </text>
          </g>
        ))}

        {roads.map((road, i) => (
          <path key={i} d={road.d} stroke={road.stroke} strokeWidth={road.strokeWidth} strokeDasharray={road.strokeDasharray || ''} fill="none" opacity="0.7" />
        ))}

        {points.map(p => (
          <g key={p.id}>
            {p.type === 'order' ? (
              <>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="22"
                  fill="url(#glow-orange)"
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <circle cx={p.x} cy={p.y} r="10" fill="#f97316" stroke="white" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="4" fill="white" />
              </>
            ) : (
              <>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="18"
                  fill="url(#glow-blue)"
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                />
                <circle cx={p.x} cy={p.y} r="8" fill={p.status === 'busy' ? '#f59e0b' : '#22c55e'} stroke="white" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-slate-700/50">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-300">待处理订单</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-300">在线师傅</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300">服务中</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700/50">
        <p className="text-xs text-slate-400">上海 · 浦东新区</p>
        <p className="text-sm font-semibold text-white">实时调度地图</p>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, unit, trend, trendUp, icon: Icon, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/50 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              <TrendingUp className={`w-3.5 h-3.5 ${!trendUp && 'rotate-180'}`} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('500', '100').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

function OrderTicker() {
  const { orders } = useAppStore();
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'matched');

  return (
    <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm h-full flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">实时订单动态</h3>
        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
          {activeOrders.length} 单待处理
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {orders.slice(0, 8).map((order, idx) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${
                  order.status === 'pending' ? 'bg-orange-500 animate-pulse' :
                  order.status === 'in_service' ? 'bg-blue-500' :
                  order.status === 'completed' ? 'bg-green-500' :
                  'bg-slate-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">{order.faultTypeName}</p>
                  <p className="text-xs text-slate-400">{order.homeownerAddress}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {order.createdAt.split(' ')[1]?.slice(0, 5)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {order.id.slice(-4)}
              </span>
              {order.workerName && (
                <span className="text-xs text-slate-500">{order.workerName}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TrendChart() {
  const { orderTrendData } = useAppStore();

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    grid: { left: 40, right: 20, top: 20, bottom: 20 },
    xAxis: {
      type: 'category',
      data: orderTrendData.dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: orderTrendData.orders,
        lineStyle: { color: '#f97316', width: 2 },
        itemStyle: { color: '#f97316' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249,115,22,0.25)' },
              { offset: 1, color: 'rgba(249,115,22,0.02)' },
            ],
          },
        },
      },
      {
        name: '完成数',
        type: 'line',
        smooth: true,
        data: orderTrendData.completed,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34,197,94,0.2)' },
              { offset: 1, color: 'rgba(34,197,94,0.02)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5 h-full">
      <h3 className="font-semibold text-slate-800 mb-2">近7日订单趋势</h3>
      <div className="h-44">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { dashboardStats } = useAppStore();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">调度大屏</h2>
          <p className="text-sm text-slate-500 mt-1">实时监控全平台订单与师傅调度状态</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">今天是 2024年6月14日 星期五</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="今日订单" value={dashboardStats.todayOrders} trend="+12.5%" trendUp icon={ShoppingBag} color="text-orange-500" />
        <StatCard label="完成率" value={dashboardStats.completionRate} unit="%" trend="+3.2%" trendUp icon={CheckCircle} color="text-green-500" />
        <StatCard label="在线师傅" value={dashboardStats.onlineWorkers} trend="+2" trendUp icon={Users} color="text-blue-500" />
        <StatCard label="担保资金" value={dashboardStats.escrowAmount.toLocaleString()} unit="元" trend="+2,330" trendUp icon={Wallet} color="text-purple-500" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="h-[420px]">
            <MapView />
          </div>
        </div>
        <div className="col-span-1">
          <OrderTicker />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <TrendChart />
        </div>
        <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">服务质量概览</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">平均响应时间</span>
                <span className="text-sm font-semibold text-blue-600">{dashboardStats.avgResponseTime} 分钟</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">差评率</span>
                <span className="text-sm font-semibold text-red-500">{dashboardStats.badReviewRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: `${dashboardStats.badReviewRate * 10}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-700 font-medium">待处理质量问题</span>
                <span className="ml-auto text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
