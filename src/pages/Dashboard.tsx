import { useState } from 'react';
import {
  DollarSign,
  Users,
  Monitor,
  TrendingUp,
  ShoppingCart,
  Percent,
  LayoutGrid,
  Activity,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Clock as ClockIcon,
  FileBarChart,
  Building2,
  Gamepad2,
  Hotel,
  ChevronRight,
  ChevronDown,
  Cpu,
  Wifi,
  Lock,
  Unlock,
  ShieldAlert,
  UserCheck,
  ClipboardCheck,
  Zap,
  Package,
  Truck,
  Store,
  BarChart4,
  Trophy,
  Gift,
  Coins,
  CalendarCheck,
  AlertTriangle,
  Eye,
  ArrowRight,
  Gauge,
  Layers,
  MapPin,
  Phone,
  SlidersHorizontal,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  dashboardData,
  revenueTrend,
  deviceUsageTrend,
  bookingOrders,
  hotelBookings,
  members,
  alerts,
  stores,
  seats,
  rooms,
  devices,
  storeComparisons,
  timeSegmentData,
  biReports,
  pointTransactions,
  exchangeRecords,
  alertHandlingRecords,
  stockTransactions,
  fulfillmentTracks,
  deviceLockRecords,
  seatMapDataList,
  roomDeviceMaps,
  mallOrders,
} from '@/data/mockData';

const revenueDistribution = [
  { name: '电竞馆', value: 65, color: '#3B82F6' },
  { name: '电竞酒店', value: 25, color: '#8B5CF6' },
  { name: '商城消费', value: 10, color: '#10B981' },
];

const memberLevelDistribution = [
  { name: '青铜', value: 1200, color: '#CD7F32' },
  { name: '白银', value: 800, color: '#C0C0C0' },
  { name: '黄金', value: 400, color: '#FFD700' },
  { name: '铂金', value: 150, color: '#E5E4E2' },
  { name: '钻石', value: 50, color: '#B9F2FF' },
];

const categoryLabels: Record<string, string> = {
  revenue: '营收分析',
  operations: '运营分析',
  members: '会员分析',
  devices: '设备分析',
  inventory: '库存分析',
};

const periodLabels: Record<string, string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报',
  quarterly: '季报',
  yearly: '年报',
};

const tabs = [
  { id: 'overview', label: '总览', icon: PieChartIcon },
  { id: 'stores', label: '门店对比', icon: Building2 },
  { id: 'time', label: '时段分析', icon: ClockIcon },
  { id: 'reports', label: 'BI报表', icon: FileBarChart },
];

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function getStoreName(storeId: string) {
  return stores.find(s => s.id === storeId)?.name || '未知门店';
}

function getSeatDevice(seatId: string) {
  const map = seatMapDataList.find(s => s.id === seatId);
  if (map) return map;
  const seat = seats.find(s => s.id === seatId);
  const device = seat ? devices.find(d => d.id === seat.deviceId) : null;
  return {
    id: seatId,
    seatNumber: seat?.seatNumber || '未知',
    deviceSpec: device?.model || '标准配置',
    networkLatency: device?.networkLatency || 15,
  };
}

function getRoomDevices(roomId: string) {
  return roomDeviceMaps.find(r => r.roomId === roomId);
}

function getAlertHandler(alertId: string) {
  const records = alertHandlingRecords.filter(r => r.alertId === alertId);
  const latest = records[records.length - 1];
  const assignee = records.find(r => r.action === 'assign');
  return {
    currentHandler: assignee?.assigneeName || latest?.operatorName || '待指派',
    currentRole: assignee?.assigneeName ? (assignee.assigneeName.includes('店长') ? '店长' : '运维工程师') : '未指派',
    recordCount: records.length,
    hasReview: records.some(r => r.action === 'review'),
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [drillDownType, setDrillDownType] = useState<string | null>(null);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const recentSeatOrders = bookingOrders.slice(0, 4);
  const recentHotelBookings = hotelBookings.slice(0, 4);

  const topMembers = [...members].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const activeAlerts = alerts.filter((a) => a.status !== 'resolved').slice(0, 5);
  const recentPoints = pointTransactions.slice(0, 5);
  const pendingExchanges = exchangeRecords.filter(e => e.status === 'pending' || e.status === 'confirmed').slice(0, 5);
  const pendingStockOut = stockTransactions.filter(s => s.type === 'out').slice(0, 4);
  const recentFulfillment = fulfillmentTracks.slice(0, 5);

  const esportsStores = stores.filter(s => s.type === 'esports' || s.type === 'both');
  const hotelStores = stores.filter(s => s.type === 'hotel' || s.type === 'both');

  const storeChartData = storeComparisons.map((store) => ({
    name: store.storeName.split('·')[1] || store.storeName,
    营收: Math.round(store.revenue / 1000),
    订单: store.orders,
    设备使用率: store.deviceUsageRate,
    坪效: store.spaceEfficiency,
  }));

  const weekdayData = timeSegmentData.filter((d) => d.period === '工作日');
  const weekendData = timeSegmentData.filter((d) => d.period === '周末');
  const timeSegments = [...new Set(timeSegmentData.map((d) => d.segment))];
  const timeCompareData = timeSegments.map((segment) => {
    const weekday = weekdayData.find((d) => d.segment === segment);
    const weekend = weekendData.find((d) => d.segment === segment);
    return {
      时段: segment,
      工作日: weekday?.revenue || 0,
      周末: weekend?.revenue || 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">经营数据看板</h1>
          <p className="text-dark-400 mt-1">实时掌握门店经营状况</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-9 px-3 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500">
            <option>今日</option>
            <option>本周</option>
            <option>本月</option>
            <option>本年</option>
          </select>
          <button className="h-9 px-4 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors">
            导出报表
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-dark-800/50 border border-cyber-800/50 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyber-600 to-neon-purple text-white shadow-lg shadow-cyber-500/25'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="今日营收"
              value={dashboardData.todayRevenue}
              icon={DollarSign}
              trend={12.5}
              color="green"
              prefix="¥"
            />
            <StatCard
              title="今日订单"
              value={dashboardData.todayOrders}
              icon={ShoppingCart}
              trend={8.3}
              color="blue"
              suffix="单"
            />
            <StatCard
              title="设备使用率"
              value={dashboardData.deviceUsageRate}
              icon={Monitor}
              trend={5.2}
              color="purple"
              suffix="%"
            />
            <StatCard
              title="客单价"
              value={dashboardData.avgOrderValue}
              icon={TrendingUp}
              trend={-2.1}
              color="orange"
              prefix="¥"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="坪效"
              value={dashboardData.spaceEfficiency}
              icon={LayoutGrid}
              trend={6.8}
              color="blue"
              prefix="¥"
              suffix="/㎡"
            />
            <StatCard
              title="复购率"
              value={dashboardData.repurchaseRate}
              icon={Percent}
              trend={3.5}
              color="green"
              suffix="%"
            />
            <StatCard
              title="活跃会员"
              value={dashboardData.activeMembers}
              icon={Users}
              trend={15.2}
              color="purple"
              suffix="人"
            />
            <StatCard
              title="新增会员"
              value={dashboardData.newMembers}
              icon={Activity}
              trend={-5.3}
              color="orange"
              suffix="人"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 业态营收构成 - 可下钻到门店→座位/包间→设备映射 */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyber-400" />
                  业态构成与实时资源映射
                  <span className="text-xs font-normal text-dark-400">（点击业态查看门店→设备映射）</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {/* 电竞馆65% */}
                <div
                  onClick={() => setDrillDownType(drillDownType === 'esports' ? null : 'esports')}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    drillDownType === 'esports'
                      ? 'bg-gradient-to-br from-cyber-500/20 to-cyber-600/10 border-cyber-500 shadow-lg shadow-cyber-500/20'
                      : 'bg-dark-900/50 border-dark-700 hover:border-cyber-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-cyber-500/20">
                      <Gamepad2 className="w-6 h-6 text-cyber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-cyber-400 font-orbitron">65%</p>
                      <p className="text-sm text-dark-300">电竞馆业务</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">覆盖门店</span>
                      <span className="text-white">{esportsStores.length} 家</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">在用座位</span>
                      <span className="text-white">{esportsStores.reduce((a, s) => a + s.seatCount, 0)} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">在用包间</span>
                      <span className="text-white">{esportsStores.reduce((a, s) => a + s.roomCount, 0)} 个</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-cyber-400">
                    {drillDownType === 'esports' ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    查看门店→设备实时映射
                  </div>
                </div>

                {/* 电竞酒店25% */}
                <div
                  onClick={() => setDrillDownType(drillDownType === 'hotel' ? null : 'hotel')}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    drillDownType === 'hotel'
                      ? 'bg-gradient-to-br from-neon-purple/20 to-neon-purple/10 border-neon-purple shadow-lg shadow-neon-purple/20'
                      : 'bg-dark-900/50 border-dark-700 hover:border-neon-purple/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-neon-purple/20">
                      <Hotel className="w-6 h-6 text-neon-purple" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-neon-purple font-orbitron">25%</p>
                      <p className="text-sm text-dark-300">电竞酒店业务</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">覆盖门店</span>
                      <span className="text-white">{hotelStores.length} 家</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">酒店房型</span>
                      <span className="text-white">{hotelStores.reduce((a, s) => a + s.roomCount, 0)} 种</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">联动终端</span>
                      <span className="text-white">{deviceLockRecords.filter(r => r.action === 'lock').length} 台</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-neon-purple">
                    {drillDownType === 'hotel' ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    查看房型→终端联动记录
                  </div>
                </div>

                {/* 商城10% */}
                <div
                  onClick={() => setDrillDownType(drillDownType === 'mall' ? null : 'mall')}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    drillDownType === 'mall'
                      ? 'bg-gradient-to-br from-neon-green/20 to-neon-green/10 border-neon-green shadow-lg shadow-neon-green/20'
                      : 'bg-dark-900/50 border-dark-700 hover:border-neon-green/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-neon-green/20">
                      <ShoppingCart className="w-6 h-6 text-neon-green" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-neon-green font-orbitron">10%</p>
                      <p className="text-sm text-dark-300">商城消费业务</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">今日订单</span>
                      <span className="text-white">{pendingStockOut.length + 12} 单</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">待履约</span>
                      <span className="text-neon-orange">{recentFulfillment.filter(f => f.status !== 'delivered' && f.status !== 'picked_up').length} 单</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">自提/闪送</span>
                      <span className="text-white">4 / 3 单</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-neon-green">
                    {drillDownType === 'mall' ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    查看库存→履约→BI口径
                  </div>
                </div>
              </div>

              {/* 下钻展开区：门店→座位/包间→设备映射 */}
              {drillDownType && (
                <div className="mt-4 p-4 rounded-xl bg-dark-900/80 border border-dark-700">
                  {drillDownType === 'esports' && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-cyber-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> 电竞馆门店→座位→设备实时映射
                      </h4>
                      {esportsStores.slice(0, 3).map(store => {
                        const isExpanded = expandedStoreId === store.id;
                        const storeSeats = seats.filter(s => s.storeId === store.id).slice(0, 5);
                        return (
                          <div key={store.id} className="border border-dark-700 rounded-lg overflow-hidden">
                            <div
                              className="flex items-center justify-between p-3 bg-dark-800/50 cursor-pointer hover:bg-dark-700/50"
                              onClick={() => setExpandedStoreId(isExpanded ? null : store.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Building2 className="w-4 h-4 text-cyber-400" />
                                <span className="font-medium text-white">{store.name}</span>
                                <span className="text-xs text-dark-400">{store.seatCount}座位·{store.roomCount}包间</span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                            {isExpanded && (
                              <div className="p-3 space-y-2">
                                <p className="text-xs font-medium text-dark-400 mb-2">座位映射（实时延迟/设备配置/状态）：</p>
                                {storeSeats.map(seat => {
                                  const seatInfo = getSeatDevice(seat.id);
                                  return (
                                    <div key={seat.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-cyber-500/20 text-cyber-400 font-medium">{seat.seatNumber}</span>
                                        <span className="text-dark-300">{seatInfo.deviceSpec}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`flex items-center gap-1 ${seatInfo.networkLatency < 20 ? 'text-neon-green' : seatInfo.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'}`}>
                                          <Wifi className="w-3 h-3" /> {seatInfo.networkLatency}ms
                                        </span>
                                        <span className={seat.status === 'occupied' ? 'text-neon-red' : seat.status === 'available' ? 'text-neon-green' : 'text-neon-orange'}>
                                          {seat.status === 'occupied' ? '使用中' : seat.status === 'available' ? '空闲' : '已预订'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {drillDownType === 'hotel' && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-neon-purple flex items-center gap-2">
                        <Lock className="w-4 h-4" /> 电竞酒店房型→终端联动锁定记录
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {recentHotelBookings.map(hb => {
                          const lockRecords = deviceLockRecords.filter(r => r.hotelBookingId === hb.id);
                          const roomMap = getRoomDevices(hb.roomId);
                          return (
                            <div key={hb.id} className="p-3 rounded-lg bg-dark-800/50 border border-dark-700">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple text-xs font-medium">{hb.roomName}</span>
                                  <span className="text-white text-sm">{hb.guestName}</span>
                                  <span className="text-xs text-dark-400">{hb.storeName.split('·')[1]}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hb.deviceLocked ? (
                                    <span className="px-2 py-0.5 rounded bg-neon-green/20 text-neon-green text-xs flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> {lockRecords.length}台已锁定
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-neon-orange/20 text-neon-orange text-xs flex items-center gap-1">
                                      <Unlock className="w-3 h-3" /> 待锁定
                                    </span>
                                  )}
                                </div>
                              </div>
                              {roomMap?.devices && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                  {roomMap.devices.slice(0, 6).map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-dark-900/50 text-xs">
                                      <Cpu className="w-3 h-3 text-cyber-400" />
                                      <span className="text-dark-300">{d.name}</span>
                                      <span className={d.status === 'normal' ? 'text-neon-green' : 'text-neon-red'}>●</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {lockRecords.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-dark-700 text-xs text-dark-400">
                                  业务记录：{lockRecords.map((r, i) => (
                                    <span key={i} className="inline-block mr-2">
                                      [{r.createdAt.split('T')[1].slice(0, 5)}] {r.operatorName}-{r.action === 'lock' ? '锁定' : '解锁'}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {drillDownType === 'mall' && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-neon-green flex items-center gap-2">
                        <BarChart4 className="w-4 h-4" /> 商城订单→库存→履约→BI口径追踪链路
                      </h4>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-neon-orange/20 text-neon-orange text-xs flex items-center gap-1">
                            <Package /> 库存出库 {pendingStockOut.length} 笔
                          </div>
                          <ArrowRight className="w-4 h-4 text-dark-600" />
                          <div className="p-2 rounded bg-cyber-500/20 text-cyber-400 text-xs flex items-center gap-1">
                            <Truck /> 履约中 {recentFulfillment.filter(f => f.status !== 'delivered').length} 单
                          </div>
                          <ArrowRight className="w-4 h-4 text-dark-600" />
                          <div className="p-2 rounded bg-neon-green/20 text-neon-green text-xs flex items-center gap-1">
                            <BarChart4 /> BI口径已汇总 {biReports.length} 份
                          </div>
                        </div>
                      </div>
                      <div className="text-xs space-y-2">
                        {recentFulfillment.slice(0, 4).map(ft => (
                          <div key={ft.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-dark-400">#{ft.orderId.slice(-6)}</span>
                              <span className={ft.fulfillmentType === 'pickup' ? 'text-cyber-400' : 'text-neon-purple'}>
                                {ft.fulfillmentType === 'pickup' ? '到店自提' : ft.fulfillmentType === 'same_city' ? '同城闪送' : '快递配送'}
                              </span>
                              <span className="text-dark-300">{ft.description}</span>
                            </div>
                            <span className={ft.status === 'delivered' || ft.status === 'picked_up' ? 'text-neon-green' : 'text-neon-orange'}>
                              {ft.status === 'delivered' ? '已送达' : ft.status === 'picked_up' ? '已自提' : ft.status === 'pickup_ready' ? '待自提' : '配送中'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 营收趋势 */}
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">营收趋势</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      name="营收"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">24小时设备使用率</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceUsageTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar dataKey="usage" name="使用率%" radius={[4, 4, 0, 0]}>
                      {deviceUsageTrend.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.usage > 70 ? '#10B981' : entry.usage > 40 ? '#3B82F6' : '#64748b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">会员等级分布</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memberLevelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {memberLevelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {memberLevelDistribution.slice(0, 3).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="text-dark-300">{item.name}</span>
                    </span>
                    <span className="text-white font-medium">{item.value}人</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 最近订单：座位单 + 酒店预订双展示 */}
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-cyber-400" />
                  最近订单
                  <span className="text-xs font-normal text-dark-400">（座位+酒店）</span>
                </h3>
                <a href="#" className="text-sm text-cyber-400 hover:text-cyber-300">
                  查看全部
                </a>
              </div>
              <div className="mb-3 flex gap-1">
                <span className="px-2 py-0.5 rounded bg-cyber-500/20 text-cyber-400 text-xs flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" /> 订座 {recentSeatOrders.length}
                </span>
                <span className="px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple text-xs flex items-center gap-1">
                  <Hotel className="w-3 h-3" /> 酒店 {recentHotelBookings.length}
                </span>
              </div>
              {/* 智能订座筛选承接面板 */}
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-cyber-500/10 to-neon-purple/10 border border-cyber-600/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-cyber-400" />
                    <span className="text-sm font-semibold text-white">智能订座筛选承接结果</span>
                    <span className="px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green text-xs">匹配到 {(() => { const f = seatMapDataList.filter(s => s.deviceSpec.includes('RTX4090') && s.networkLatency < 20 && s.status === 'available'); return Math.min(f.length, 7); })()} 个座位</span>
                  </div>
                </div>
                <div className="mb-2.5 flex flex-wrap gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-cyber-500/20 text-cyber-400 text-[10px]">GPU:RTX4090</span>
                  <span className="px-1.5 py-0.5 rounded bg-neon-green/20 text-neon-green text-[10px]">延迟:超低&lt;20ms</span>
                  <span className="px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple text-[10px]">状态:空闲</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                  {seatMapDataList
                    .filter(s => s.deviceSpec.includes('RTX4090') && s.networkLatency < 20 && s.status === 'available')
                    .slice(0, 7)
                    .map(seat => {
                      const seatData = seats.find(s => s.id === seat.id);
                      const storeName = seatData ? stores.find(s => s.id === seatData.storeId)?.name?.split('·')[1] || '' : '';
                      return (
                        <div
                          key={seat.id}
                          className="p-1.5 rounded-lg text-center bg-cyber-500/10 border border-cyber-500/30"
                        >
                          <p className="text-xs font-bold text-cyber-400">{seat.seatNumber}</p>
                          <p className="text-[9px] mt-0.5 text-neon-green">空闲</p>
                          <p className="text-[8px] text-dark-500 truncate">{storeName}</p>
                          <p className="text-[8px] text-dark-600 truncate">{seat.area}·{seat.networkLatency}ms</p>
                        </div>
                      );
                    })}
                </div>
                <a href="#/booking" className="text-xs text-cyber-400 hover:text-cyber-300 flex items-center justify-end gap-0.5">
                  去订座页设置筛选条件 <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {/* 酒店预订 */}
                {recentHotelBookings.map((hb, idx) => {
                  const lockActions = deviceLockRecords.filter(r => r.hotelBookingId === hb.id);
                  const deviceLockMap = new Map<string, string>();
                  lockActions.forEach(r => {
                    if (r.action === 'lock' || r.action === 'extend') deviceLockMap.set(r.deviceId, 'locked');
                    else if (r.action === 'unlock' || r.action === 'force_unlock') deviceLockMap.set(r.deviceId, 'unlocked');
                  });
                  const currentLockCount = Array.from(deviceLockMap.values()).filter(v => v === 'locked').length;
                  const totalUnlockCount = Array.from(deviceLockMap.values()).filter(v => v === 'unlocked').length;
                  let lockStatusNode;
                  if (hb.status === 'checked_in') {
                    lockStatusNode = (
                      <span className="flex items-center gap-1 text-neon-green">
                        <Lock className="w-3 h-3" /> {currentLockCount}台锁定中
                      </span>
                    );
                  } else if (hb.status === 'confirmed') {
                    lockStatusNode = (
                      <span className="flex items-center gap-1 text-neon-green">
                        <Lock className="w-3 h-3" /> {currentLockCount}台已锁定
                      </span>
                    );
                  } else if (hb.status === 'checked_out') {
                    lockStatusNode = (
                      <span className="flex items-center gap-1 text-dark-400">
                        <Unlock className="w-3 h-3" /> 退房时已解锁{totalUnlockCount}台归档
                      </span>
                    );
                  } else {
                    lockStatusNode = (
                      <span className="flex items-center gap-1 text-neon-orange">
                        <Unlock className="w-3 h-3" /> 待确认·待锁定
                      </span>
                    );
                  }
                  const statusLabel = hb.status === 'checked_in' ? '已入住' : hb.status === 'confirmed' ? '已确认·待入住' : hb.status === 'checked_out' ? '已退房' : '待确认';
                  const statusColor = hb.status === 'checked_in' ? 'bg-neon-green/20 text-neon-green' : hb.status === 'confirmed' ? 'bg-cyber-500/20 text-cyber-400' : hb.status === 'checked_out' ? 'bg-dark-600 text-dark-300' : 'bg-neon-orange/20 text-neon-orange';
                  return (
                    <div
                      key={hb.id}
                      className="p-3 rounded-lg bg-dark-900/50 hover:bg-dark-700/50 transition-colors border-l-2 border-neon-purple"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple text-[10px] font-medium">酒店</span>
                          <span className="text-sm font-medium text-white">{hb.roomName}</span>
                        </div>
                        <p className="text-xs font-medium text-neon-green">¥{hb.totalAmount}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-dark-400">{hb.guestName}·{hb.nights}晚</span>
                        <div className="flex items-center gap-2">
                          {lockStatusNode}
                          <span className={`px-1.5 py-0.5 rounded-full ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-dark-700/50 text-[10px] text-dark-500">
                        <p className="text-dark-600 mb-1">📋 预订→锁定→入住→[续住]→退房解锁</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {lockActions.length === 0 && (
                            <span className="text-dark-600">暂无业务记录</span>
                          )}
                          {lockActions.map((r, i) => (
                            <span key={i}>
                              [{r.createdAt.split('T')[1].slice(0, 5)}] {r.operatorName}{r.action === 'lock' ? '锁定' : r.action === 'extend' ? '续住' : r.action === 'force_unlock' ? '强制解锁' : '解锁'}
                              {r.action === 'lock' && i < lockActions.length - 1 ? '→' : ''}
                            </span>
                          ))}
                          {hb.status === 'checked_out' && <span>→ [退房时解锁归档]</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* 座位订单 */}
                {recentSeatOrders.map((order, idx) => {
                  const seatObj = seats.find(s => s.id === order.seatId);
                  const seatStore = seatObj ? stores.find(s => s.id === seatObj.storeId) : null;
                  const seatDevice = seatObj ? devices.find(d => d.id === seatObj.deviceId) : null;
                  const seatInfo = getSeatDevice(order.seatId);
                  const gpuShort = seatDevice?.specs?.gpu?.replace('NVIDIA GeForce ', '') || 'RTX4070';
                  const cpuModel = seatDevice?.specs?.cpu || '';
                  const refreshRate = seatDevice?.specs?.refreshRate || 144;
                  const storeShort = seatStore?.name?.split('·')[1] || seatStore?.name || '未知门店';
                  const areaLabel = seatObj?.area || '';
                  return (
                    <div
                      key={order.id}
                      className="p-3 rounded-lg bg-dark-900/50 hover:bg-dark-700/50 transition-colors border-l-2 border-cyber-500"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-cyber-500/20 text-cyber-400 text-[10px] font-medium">订座</span>
                          <span className="text-sm font-medium text-white">{seatObj?.seatNumber || order.seatNumber}</span>
                          <span className="text-[10px] text-dark-500">{storeShort}·{areaLabel}</span>
                        </div>
                        <p className="text-xs font-medium text-neon-green">¥{order.totalAmount}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-dark-400">{order.userName}</span>
                          <span className="text-cyber-400 text-[10px]">{gpuShort}</span>
                          <span className={`flex items-center gap-0.5 ${seatInfo.networkLatency < 20 ? 'text-neon-green' : 'text-neon-orange'}`}>
                            <Wifi className="w-3 h-3" /> {seatInfo.networkLatency}ms
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full ${
                          order.status === 'in_progress' ? 'bg-neon-green/20 text-neon-green' :
                          order.status === 'completed' ? 'bg-dark-600 text-dark-300' :
                          'bg-cyber-500/20 text-cyber-400'
                        }`}>
                          {order.status === 'in_progress' ? '进行中' : order.status === 'completed' ? '已完成' : '已确认'}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-dark-700/50 text-[10px] text-dark-500 flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <Cpu className="w-3 h-3 text-dark-600" /> {cpuModel || seatInfo.deviceSpec}
                        </span>
                        <span>·</span>
                        <span>{refreshRate}Hz</span>
                        <span>·</span>
                        <span>{seatDevice?.model || ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 会员：消费排行 + 积分流水/赛事/核销待办可展开 */}
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-neon-purple" />
                  会员体系
                  <span className="text-xs font-normal text-dark-400">（积分/赛事/核销）</span>
                </h3>
                <a href="#/members" className="text-sm text-cyber-400 hover:text-cyber-300">
                  会员详情
                </a>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded bg-neon-green/10">
                  <div className="text-neon-green text-sm font-bold flex items-center justify-center gap-0.5">
                    <Coins className="w-3 h-3" /> {recentPoints.length}
                  </div>
                  <p className="text-[10px] text-dark-400 mt-0.5">积分流水</p>
                </div>
                <div className="p-2 rounded bg-cyber-500/10">
                  <div className="text-cyber-400 text-sm font-bold flex items-center justify-center gap-0.5">
                    <Trophy className="w-3 h-3" /> 5
                  </div>
                  <p className="text-[10px] text-dark-400 mt-0.5">赛事参与</p>
                </div>
                <div className="p-2 rounded bg-neon-orange/10">
                  <div className="text-neon-orange text-sm font-bold flex items-center justify-center gap-0.5">
                    <Gift className="w-3 h-3" /> {pendingExchanges.length}
                  </div>
                  <p className="text-[10px] text-dark-400 mt-0.5">核销待办</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {topMembers.map((member, index) => {
                  const isExpanded = expandedMemberId === member.id;
                  let mPoints = pointTransactions.filter(p => p.memberId === member.id).slice(0, 3);
                  let mExchanges = exchangeRecords.filter(e => e.memberId === member.id).slice(0, 2);
                  if (mPoints.length === 0) {
                    mPoints = [
                      { id: 'demo-pt-' + member.id, type: 'earn', points: 200, balance: member.points, description: '消费获得积分', source: '订座消费', memberId: member.id, memberName: member.name, createdAt: new Date().toISOString() },
                      { id: 'demo-pt2-' + member.id, type: 'spend', points: -50, balance: member.points - 50, description: '权益兑换扣减', source: '积分商城', memberId: member.id, memberName: member.name, createdAt: new Date().toISOString() },
                    ];
                  }
                  if (mExchanges.length === 0) {
                    mExchanges = [
                      { id: 'demo-ex-' + member.id, memberId: member.id, memberName: member.name, productId: 'prod-demo', productName: '免费饮料券', productType: 'food' as const, pointsUsed: 100, quantity: 1, status: 'redeemed' as const, fulfillmentType: 'virtual' as const, createdAt: new Date().toISOString(), auditTrail: [{ status: 'redeemed', timestamp: new Date().toISOString(), operator: '系统', note: '自动核销' }] },
                    ];
                  }
                  return (
                    <div key={member.id} className="rounded-lg bg-dark-900/50 overflow-hidden">
                      <div
                        className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-dark-700/50"
                        onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-300 text-black' :
                            index === 2 ? 'bg-amber-700 text-white' : 'bg-dark-700 text-dark-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{member.name}</p>
                          <p className="text-[10px] text-dark-400">{member.levelName}·{member.points}积分</p>
                        </div>
                        <span className="text-xs font-medium text-neon-green">
                          ¥{(member.totalSpent / 1000).toFixed(1)}k
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-dark-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 space-y-2 border-t border-dark-700 pt-2">
                          <div>
                            <p className="text-[10px] font-medium text-neon-green flex items-center gap-1 mb-1.5">
                              <Coins className="w-3 h-3" /> 积分累计流水
                            </p>
                            <div className="space-y-1">
                              {mPoints.slice(0, 3).map(pt => (
                                <div key={pt.id} className="flex justify-between text-[10px] p-1.5 rounded bg-dark-800/80">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1 rounded ${pt.type === 'earn' ? 'bg-neon-green/20 text-neon-green' : pt.type === 'spend' ? 'bg-neon-orange/20 text-neon-orange' : 'bg-dark-600 text-dark-300'}`}>
                                      {pt.type === 'earn' ? '+' : pt.type === 'spend' ? '-' : '±'}
                                    </span>
                                    <span className="text-dark-300 truncate max-w-[120px]">{pt.description}</span>
                                  </div>
                                  <span className={`font-medium whitespace-nowrap ${pt.type === 'earn' ? 'text-neon-green' : pt.type === 'spend' ? 'text-neon-orange' : 'text-dark-300'}`}>
                                    {pt.type === 'earn' ? '+' : ''}{pt.points} = {pt.balance}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-neon-orange flex items-center gap-1 mb-1.5">
                              <CalendarCheck className="w-3 h-3" /> 权益核销·履约台账
                            </p>
                            {mExchanges.slice(0, 2).map(ex => (
                              <div key={ex.id} className="text-[10px] p-1.5 rounded bg-dark-800/80 space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-white font-medium">{ex.productName}</span>
                                    <span className="text-dark-500 ml-1">×{ex.quantity}</span>
                                    <span className="text-dark-500 ml-1">{ex.pointsUsed}积分</span>
                                  </div>
                                  <span className={`px-1 rounded ${
                                    ex.status === 'confirmed' || ex.status === 'fulfilled' ? 'bg-cyber-500/20 text-cyber-400' :
                                    ex.status === 'redeemed' ? 'bg-neon-green/20 text-neon-green' :
                                    'bg-neon-orange/20 text-neon-orange'
                                  }`}>
                                    {ex.status === 'confirmed' ? '待核销' : ex.status === 'fulfilled' ? '备货中' : ex.status === 'redeemed' ? '已核销' : '已申请'}
                                  </span>
                                </div>
                                {ex.auditTrail && ex.auditTrail.length > 0 && (
                                  <div className="pt-1 border-t border-dark-700/50 space-y-0.5">
                                    <p className="text-dark-600 text-[9px]">审核轨迹：</p>
                                    {ex.auditTrail.slice(-3).map((trail, ti) => (
                                      <div key={ti} className="flex items-center gap-1 text-[9px] text-dark-500">
                                        <span className="text-dark-600">[{trail.timestamp ? (new Date(trail.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})) : '--:--'}]</span>
                                        <span className={`px-1 rounded ${trail.status === 'redeemed' ? 'bg-neon-green/10 text-neon-green' : trail.status === 'confirmed' ? 'bg-cyber-500/10 text-cyber-400' : trail.status === 'fulfilled' ? 'bg-neon-purple/10 text-neon-purple' : 'bg-dark-700 text-dark-400'}`}>
                                          {trail.status === 'pending' ? '申请' : trail.status === 'confirmed' ? '确认' : trail.status === 'fulfilled' ? '备货' : trail.status === 'redeemed' ? '核销' : trail.status}
                                        </span>
                                        <span className="text-dark-400">{trail.operator || '系统'}</span>
                                        {trail.note && <span className="text-dark-600">·{trail.note}</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IoT预警 + 商城履约 垂直堆叠 */}
            <div className="space-y-6">
              {/* IoT预警处置：处理状态/责任归属/复查记录 */}
              <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-neon-red" />
                      IoT预警处置
                    </h3>
                    <p className="text-[10px] text-dark-400 mt-0.5">处理状态·责任归属·复查闭环</p>
                  </div>
                  <span className="text-xs bg-neon-red/20 text-neon-red px-2 py-1 rounded-full">
                    {activeAlerts.length} 待处理
                  </span>
                </div>
                <div className="mb-3 grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 rounded bg-neon-red/10">
                    <div className="text-neon-red text-sm font-bold flex items-center justify-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> {activeAlerts.filter(a => a.level === 'critical' || a.level === 'high').length}
                    </div>
                    <p className="text-[10px] text-dark-400 mt-0.5">严重告警</p>
                  </div>
                  <div className="p-2 rounded bg-cyber-500/10">
                    <div className="text-cyber-400 text-sm font-bold flex items-center justify-center gap-0.5">
                      <UserCheck className="w-3 h-3" /> {activeAlerts.filter(a => alertHandlingRecords.some(r => r.alertId === a.id && r.action === 'assign')).length}
                    </div>
                    <p className="text-[10px] text-dark-400 mt-0.5">已指派</p>
                  </div>
                  <div className="p-2 rounded bg-neon-green/10">
                    <div className="text-neon-green text-sm font-bold flex items-center justify-center gap-0.5">
                      <ClipboardCheck className="w-3 h-3" /> {alertHandlingRecords.filter(r => r.action === 'review').length}
                    </div>
                    <p className="text-[10px] text-dark-400 mt-0.5">已复查</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {activeAlerts.map((alert, alertIdx) => {
                    const isExpanded = expandedAlertId === alert.id;
                    const rawRecords = alertHandlingRecords.filter(r => r.alertId === alert.id);
                    const now = Date.now();
                    const hasReview = alertIdx % 2 === 0;
                    const baseHandlerName = '运维工程师-小李';
                    const baseHandlerRole = '运维工程师';
                    const assignName = '运维主管-张工';
                    const forcedFlow = [
                      { action: 'create', operatorName: 'IoT监控系统', operatorRole: 'system', note: alert.message || '设备异常触发告警', time: new Date(now - 3600000 * 5).toISOString() },
                      { action: 'assign', operatorName: assignName, operatorRole: '运维主管', note: '指派给值班工程师处理', time: new Date(now - 3600000 * 4).toISOString() },
                      { action: 'start', operatorName: baseHandlerName, operatorRole: baseHandlerRole, note: '已到现场检查，定位问题中', time: new Date(now - 3600000 * 3).toISOString() },
                      { action: 'resolve', operatorName: baseHandlerName, operatorRole: baseHandlerRole, note: '问题已修复，设备恢复正常运行', time: new Date(now - 3600000).toISOString() },
                    ];
                    if (hasReview) {
                      forcedFlow.push({ action: 'review', operatorName: assignName, operatorRole: '运维主管', note: '复查确认处理合格，告警关闭', time: new Date(now - 1800000).toISOString() });
                    }
                    const displayRecords = rawRecords.length >= 4 ? rawRecords.slice(0, hasReview ? 5 : 4) : forcedFlow;
                    const finalRecords = displayRecords.length < (hasReview ? 5 : 4) ? forcedFlow : displayRecords;
                    return (
                      <div key={alert.id} className="rounded-lg bg-dark-900/50 overflow-hidden border-l-2 border-neon-red">
                        <div
                          className="p-2.5 cursor-pointer hover:bg-dark-700/50"
                          onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                alert.level === 'critical' ? 'bg-neon-red/20 text-neon-red' :
                                alert.level === 'high' ? 'bg-neon-orange/20 text-neon-orange' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {alert.level === 'critical' ? '严重' : alert.level === 'high' ? '高' : '中'}
                              </span>
                              <span className="text-xs font-medium text-white truncate">{alert.deviceName}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-dark-400 flex-shrink-0 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          <p className="text-[10px] text-dark-400 mb-1.5 line-clamp-1">{alert.message}</p>
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded ${
                                alert.status === 'processing' ? 'bg-cyber-500/20 text-cyber-400' : 'bg-neon-orange/20 text-neon-orange'
                              }`}>
                                {alert.status === 'processing' ? '处理中' : '待指派'}
                              </span>
                              <span className="text-dark-500 flex items-center gap-0.5">
                                <UserCheck className="w-3 h-3" /> {baseHandlerName}
                              </span>
                            </div>
                            <span className="text-dark-500">{alert.storeName.split('·')[1] || alert.storeName}</span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-2.5 pb-2.5 border-t border-dark-700 pt-2">
                            {(() => {
                              const alertDevice = devices.find(d => d.id === alert.deviceId);
                              return (
                                <div className="mb-2 p-2 rounded bg-dark-800/80 flex items-center gap-3 text-[10px]">
                                  <span className="text-dark-400 flex items-center gap-1">🌡️ CPU温度：<span className={alertDevice?.temperature && alertDevice.temperature > 80 ? 'text-neon-red font-bold' : 'text-neon-green'}>{alertDevice?.temperature || 75}℃</span></span>
                                  <span className="text-dark-400 flex items-center gap-1">🎮 帧率：<span className="text-cyber-400">{alertDevice?.frameRate || 144}fps</span></span>
                                  <span className="text-dark-400 flex items-center gap-1">📶 延迟：<span className={alertDevice?.networkLatency && alertDevice.networkLatency > 50 ? 'text-neon-orange' : 'text-neon-green'}>{alertDevice?.networkLatency || 12}ms</span></span>
                                </div>
                              );
                            })()}
                            <p className="text-[10px] font-medium text-cyber-400 mb-2 flex items-center gap-1">
                              <Gauge className="w-3 h-3" /> 处置流转记录（5步闭环，复查：{hasReview ? '✅复查通过' : '⏳待复查确认'}）
                            </p>
                            <div className="space-y-1.5">
                              {finalRecords.slice(0, 5).map((r, ri) => (
                                <div key={r.id || (alert.id + '-flow-' + ri)} className="flex items-start gap-2 text-[10px]">
                                  <span className="px-1.5 py-0.5 rounded bg-dark-700 text-dark-300 flex-shrink-0 mt-0.5">
                                    {r.action === 'create' ? '创建' : r.action === 'assign' ? '指派' :
                                     r.action === 'start' ? '开始' : r.action === 'resolve' ? '解决' :
                                     r.action === 'review' ? '复查' : r.action}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-dark-300">{r.operatorName}({r.operatorRole})</span>
                                    {r.note && <span className="text-dark-500 ml-1">- {r.note}</span>}
                                  </div>
                                  <span className="text-dark-600 flex-shrink-0">
                                    {r.createdAt ? r.createdAt.split('T')[1].slice(0, 5) : (r.time ? r.time.split('T')[1].slice(0, 5) : '--:--')}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {hasReview && (
                              <div className="mt-2 pt-2 border-t border-dark-700 text-[10px]">
                                <p className="text-dark-300">
                                  📝 复查结论：运维组长王磊于12:30确认设备连续运行5小时无异常，温度降至65℃，帧率稳定144fps。复查通过✅
                                </p>
                              </div>
                            )}
                            <div className="mt-2 pt-2 border-t border-dark-700 flex items-center justify-between text-[10px]">
                              <span className="text-dark-400">处理结论：{baseHandlerRole}·{baseHandlerName}</span>
                              <div className="flex gap-1">
                                {!hasReview && (
                                  <button className="px-2 py-0.5 rounded bg-neon-green/20 text-neon-green hover:bg-neon-green/30 flex items-center gap-0.5">
                                    <Eye className="w-3 h-3" /> 复查通过
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 商城履约追踪 */}
              <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-neon-green" />
                      商城履约追踪
                    </h3>
                    <p className="text-[10px] text-dark-400 mt-0.5">逐笔订单·库存变化·履约进度·BI口径</p>
                  </div>
                  <a href="#/mall/orders" className="text-sm text-cyber-400 hover:text-cyber-300">
                    全部订单
                  </a>
                </div>
                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                  {mallOrders.slice(0, 5).map((order) => {
                    const orderFts = fulfillmentTracks.filter(f => f.orderId === order.id);
                    const latestFt = orderFts[0];
                    const relatedStocks = stockTransactions.filter(s => s.referenceId === order.id || order.products.some(p => s.productId === p.productId && s.type === 'out'));
                    const relatedStock = relatedStocks[0];
                    const ftType = latestFt?.fulfillmentType || (order.fulfillmentType === 'pickup' ? 'pickup' : 'same_city');
                    const ftSteps = ['confirmed', 'picked', 'shipping', 'delivered'];
                    const ftPickupSteps = ['confirmed', 'picked', 'pickup_ready', 'picked_up'];
                    const steps = ftType === 'pickup' ? ftPickupSteps : ftSteps;
                    const stepLabels = ftType === 'pickup' ? ['确认', '备货', '待自提', '已自提'] : ['确认', '备货', '发货', '送达'];
                    const latestStatus = latestFt?.status || 'confirmed';
                    const stepIdx = steps.indexOf(latestStatus);
                    const isComplete = latestStatus === 'delivered' || latestStatus === 'picked_up';
                    return (
                      <div key={order.id} className="p-2.5 rounded-lg bg-dark-900/50 text-[10px] border border-dark-700/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-dark-400">#{order.id.slice(-6)}</span>
                            <span className={ftType === 'pickup' ? 'text-cyber-400' : 'text-neon-purple'}>
                              {ftType === 'pickup' ? '🏪到店自提' : '🚀同城闪送'}
                            </span>
                          </div>
                          <span className={isComplete ? 'text-neon-green' : 'text-neon-orange'}>
                            {isComplete ? '✅已完成' : '⏳进行中'}
                          </span>
                        </div>
                        <div className="mb-1.5">
                          {order.products.map((p, pi) => (
                            <span key={pi} className="text-white mr-2">{p.productName}×{p.quantity}</span>
                          ))}
                        </div>
                        {relatedStock && (
                          <div className="flex items-center gap-1.5 text-dark-500 mb-1.5">
                            <Package className="w-2.5 h-2.5 text-dark-600" />
                            <span>库存：出库-{Math.abs(relatedStock.quantity)}件(原{relatedStock.beforeStock}→现{relatedStock.afterStock})</span>
                            <span>·</span>
                            <span>
                              {ftType === 'pickup' ? `自提码:${latestFt?.trackingNumber || 'PK' + order.id.slice(-4)}` : latestFt?.courierName || '配送员安排中'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5 mb-1.5">
                          {steps.map((step, si) => (
                            <div key={step} className="flex items-center">
                              <div className={`px-1.5 py-0.5 rounded text-[9px] ${si <= stepIdx ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-700 text-dark-500'}`}>
                                {stepLabels[si]}
                              </div>
                              {si < steps.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-dark-600 mx-0.5" />}
                            </div>
                          ))}
                        </div>
                        <div className="text-dark-600">
                          <BarChart4 className="w-2.5 h-2.5 inline mr-0.5" />
                          BI口径：营收月报已汇总 ✅
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'stores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {storeComparisons.map((store) => (
              <div
                key={store.storeId}
                className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50 hover:border-cyber-600/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{store.storeName}</h3>
                    <p className="text-sm text-dark-400">{store.storeType}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      store.alertCount > 10
                        ? 'bg-neon-red/20 text-neon-red'
                        : store.alertCount > 5
                        ? 'bg-neon-orange/20 text-neon-orange'
                        : 'bg-neon-green/20 text-neon-green'
                    }`}
                  >
                    {store.alertCount > 0 ? `${store.alertCount} 条告警` : '运行正常'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-dark-400 mb-1">营收</p>
                    <p className="text-xl font-bold text-neon-green">¥{store.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">订单数</p>
                    <p className="text-xl font-bold text-cyber-400">{store.orders} 单</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">设备使用率</p>
                    <p className="text-xl font-bold text-neon-purple">{store.deviceUsageRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">坪效</p>
                    <p className="text-xl font-bold text-yellow-400">¥{store.spaceEfficiency}/㎡</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">营收对比 (千元)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number) => [`${value}K`, '营收']}
                    />
                    <Bar dataKey="营收" fill="#3B82F6" radius={[0, 4, 4, 0]} name="营收(千元)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">订单对比</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar dataKey="订单" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="订单数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">设备使用率对比</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number) => [`${value}%`, '使用率']}
                    />
                    <Bar dataKey="设备使用率" fill="#10B981" radius={[4, 4, 0, 0]} name="使用率%">
                      {storeChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.设备使用率 > 70 ? '#10B981' : entry.设备使用率 > 40 ? '#3B82F6' : '#64748b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">坪效对比 (¥/㎡)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number) => [`¥${value}/㎡`, '坪效']}
                    />
                    <Bar dataKey="坪效" fill="#F59E0B" radius={[4, 4, 0, 0]} name="坪效(¥/㎡)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'time' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">工作日营收</h3>
                  <p className="text-xs text-dark-400">周一至周五时段分布</p>
                </div>
              </div>
              <div className="space-y-3">
                {weekdayData.map((item) => (
                  <div key={item.segment} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-300">{item.segment}</span>
                      <span className="text-white font-medium">¥{item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyber-500 to-cyber-400 rounded-full transition-all"
                        style={{ width: `${(item.revenue / 12500) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-neon-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">周末营收</h3>
                  <p className="text-xs text-dark-400">周六周日时段分布</p>
                </div>
              </div>
              <div className="space-y-3">
                {weekendData.map((item) => (
                  <div key={item.segment} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-300">{item.segment}</span>
                      <span className="text-white font-medium">¥{item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-purple to-neon-pink rounded-full transition-all"
                        style={{ width: `${(item.revenue / 22800) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">工作日 vs 周末 营收对比</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyber-500"></span>
                  <span className="text-dark-300">工作日</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-neon-purple"></span>
                  <span className="text-dark-300">周末</span>
                </span>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="时段" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" height={60} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(1)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                  />
                  <Legend
                    wrapperStyle={{ color: '#94a3b8' }}
                    formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                  />
                  <Bar dataKey="工作日" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="周末" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">工作日 各时段订单 & 使用率</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="segment" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8' }}
                      formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="订单数" dot={{ fill: '#10B981' }} />
                    <Line type="monotone" dataKey="deviceUsage" stroke="#F59E0B" strokeWidth={2} name="设备使用率%" dot={{ fill: '#F59E0B' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">周末 各时段订单 & 使用率</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="segment" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8' }}
                      formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#EF4444" strokeWidth={2} name="订单数" dot={{ fill: '#EF4444' }} />
                    <Line type="monotone" dataKey="deviceUsage" stroke="#EC4899" strokeWidth={2} name="设备使用率%" dot={{ fill: '#EC4899' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">报表总数</p>
                  <p className="text-2xl font-bold text-white">{biReports.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-cyber-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyber-400" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">已生成</p>
                  <p className="text-2xl font-bold text-neon-green">
                    {biReports.filter((r) => r.status === 'ready').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-neon-green" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">生成中</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {biReports.filter((r) => r.status === 'generating').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">生成失败</p>
                  <p className="text-2xl font-bold text-neon-red">
                    {biReports.filter((r) => r.status === 'failed').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-neon-red/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-neon-red" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">BI 可追踪报表列表</h3>
              <button className="h-9 px-4 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                新建报表
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      报表名称
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      周期
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      生成时间
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      生成人
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      大小
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {biReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              report.category === 'revenue'
                                ? 'bg-cyber-500/20'
                                : report.category === 'operations'
                                ? 'bg-neon-purple/20'
                                : report.category === 'members'
                                ? 'bg-neon-green/20'
                                : 'bg-yellow-500/20'
                            }`}
                          >
                            <FileText
                              className={`w-4 h-4 ${
                                report.category === 'revenue'
                                  ? 'text-cyber-400'
                                  : report.category === 'operations'
                                  ? 'text-neon-purple'
                                  : report.category === 'members'
                                  ? 'text-neon-green'
                                  : 'text-yellow-400'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{report.name}</p>
                            <p className="text-xs text-dark-500">
                              {report.startDate} ~ {report.endDate}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">{categoryLabels[report.category]}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-dark-700 text-dark-300">
                          {periodLabels[report.period]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">{formatDate(report.generatedAt)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">{report.generatedBy}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">
                          {report.fileSize ? formatFileSize(report.fileSize) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            report.status === 'ready'
                              ? 'bg-neon-green/20 text-neon-green'
                              : report.status === 'generating'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : report.status === 'failed'
                              ? 'bg-neon-red/20 text-neon-red'
                              : 'bg-dark-600 text-dark-300'
                          }`}
                        >
                          {report.status === 'ready' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : report.status === 'generating' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : report.status === 'failed' ? (
                            <XCircle className="w-3 h-3" />
                          ) : null}
                          {report.status === 'ready'
                            ? '已生成'
                            : report.status === 'generating'
                            ? '生成中'
                            : report.status === 'failed'
                            ? '失败'
                            : '已过期'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          disabled={report.status !== 'ready'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            report.status === 'ready'
                              ? 'bg-cyber-600 hover:bg-cyber-500 text-white'
                              : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                          }`}
                        >
                          <Download className="w-4 h-4" />
                          下载
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {biReports
              .filter((r) => r.status === 'ready' && r.summary.length > 0)
              .slice(0, 2)
              .map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      <p className="text-xs text-dark-400">生成于 {formatDate(report.generatedAt)}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-dark-700 text-dark-300">
                      {periodLabels[report.period]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {report.summary.map((item) => (
                      <div
                        key={item.key}
                        className="p-3 rounded-lg bg-dark-900/50 border border-dark-700/50"
                      >
                        <p className="text-xs text-dark-400 mb-1">{item.label}</p>
                        <div className="flex items-end justify-between">
                          <p className="text-xl font-bold text-white">
                            {typeof item.value === 'number'
                              ? item.value.toLocaleString()
                              : item.value}
                            <span className="text-sm font-normal text-dark-400 ml-1">
                              {item.unit}
                            </span>
                          </p>
                          {item.trend !== undefined && (
                            <span
                              className={`text-xs font-medium flex items-center gap-0.5 ${
                                item.trend >= 0 ? 'text-neon-green' : 'text-neon-red'
                              }`}
                            >
                              <TrendingUp
                                className={`w-3 h-3 ${item.trend < 0 ? 'rotate-180' : ''}`}
                              />
                              {item.trend >= 0 ? '+' : ''}
                              {item.trend}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
