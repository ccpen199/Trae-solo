import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  CreditCard,
  Wallet,
  Send,
  FileText,
  Thermometer,
  Shield,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { statusTextMap, tempControlMap, formatMoney, formatVolume, formatWeight, minutesAgo } from '@/utils/format';
import type { CargoOrder, TempControl } from '@/types';

function StatusBadge({ status }: { status: CargoOrder['status'] }) {
  const cfg = statusTextMap[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className="status-dot animate-pulse" style={{ backgroundColor: 'currentColor' }} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="stat-panel corner-brackets">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-mono mb-2">{label}</div>
          <div className="text-2xl font-display font-bold text-white">{value}</div>
          <div className="text-xs text-slate-500 mt-1 font-mono">{sub}</div>
        </div>
        <div className={`w-11 h-11 flex items-center justify-center rounded-sm ${accent}`}>
          <Icon className="w-5 h-5 text-orange-400" />
        </div>
      </div>
      <div className="divider-dashed mt-4" />
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="status-dot bg-orange-500 animate-pulse" />
        <span>实时数据同步</span>
      </div>
    </div>
  );
}

function QuickEntry({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative industrial-card p-5 hover:border-orange-500/50 transition-all duration-200 text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center bg-orange-500/10 rounded-sm group-hover:bg-orange-500/20 transition-colors">
          <Icon className="w-6 h-6 text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">点击进入 →</div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
      </div>
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-orange-500/10" />
    </button>
  );
}

function OrderRow({ order, onClick }: { order: CargoOrder; onClick: () => void }) {
  const pickup = order.stops.find((s) => s.type === 'PICKUP');
  const deliveries = order.stops.filter((s) => s.type === 'DELIVERY');
  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer border-b border-ink-600/40 hover:bg-orange-500/5 transition-colors"
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm text-orange-400">{order.orderNo}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="text-xs text-slate-500 mt-1 font-mono">{minutesAgo(order.createdAt)}</div>
      </td>
      <td className="py-3.5 px-4">
        <div className="text-sm text-slate-200">{order.cargoName}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="hex-tag">{formatVolume(order.volume)}</span>
          <span className="hex-tag">{formatWeight(order.weight)}</span>
          <span className="text-xs text-slate-500">{tempControlMap[order.tempControl].icon} {tempControlMap[order.tempControl].label}</span>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-start gap-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
          <div className="space-y-1 min-w-0">
            <div className="text-slate-300 truncate">取：{pickup?.address.split('区').pop()?.slice(0, 12) || pickup?.address.slice(0, 12)}</div>
            <div className="text-slate-400 truncate">送：{deliveries[0]?.address.split('区').pop()?.slice(0, 12) || deliveries[0]?.address.slice(0, 12)}
              {deliveries.length > 1 && <span className="text-orange-400"> +{deliveries.length - 1}站</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-right">
        <div className="font-display text-lg font-bold text-orange-400">{formatMoney(order.totalPrice)}</div>
      </td>
    </tr>
  );
}

export default function ShipperDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, init, loading } = useOrderStore();

  useEffect(() => {
    init();
  }, [init]);

  const shipperId = user?.id ?? 'shipper_demo';

  const myOrders = useMemo(() => orders.filter((o) => o.shipperId === shipperId), [orders, shipperId]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayShipments = myOrders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
    const inTransit = myOrders.filter((o) => ['MATCHED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'PARTIAL_DELIVERED', 'DELIVERED', 'FULFILLMENT_CHECKING'].includes(o.status)).length;
    const pendingPayment = myOrders.filter((o) => ['COMPLETED'].includes(o.status)).reduce((s, o) => s + o.totalPrice, 0);
    const saved = myOrders.length * 128.5;
    return { todayShipments, inTransit, pendingPayment, saved };
  }, [myOrders]);

  const recentOrders = useMemo(() => [...myOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [myOrders]);

  const trendOption = useMemo(() => {
    const days = ['6-8', '6-9', '6-10', '6-11', '6-12', '6-13', '今天'];
    const volumes = [12, 8, 15, 22, 18, 25, stats.todayShipments + 3];
    const freights = [3850, 2680, 4920, 7150, 5880, 8200, (stats.todayShipments + 3) * 320];
    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 48, top: 40, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        axisPointer: { type: 'cross', lineStyle: { color: '#F97316', opacity: 0.4 } },
      },
      legend: {
        data: ['发货量', '运费'],
        right: 0,
        top: 0,
        textStyle: { color: '#94A3B8', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '单',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#64748B', fontSize: 11 },
          splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '元',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : v) },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '发货量',
          type: 'bar',
          data: volumes,
          barWidth: 18,
          itemStyle: {
            borderRadius: [2, 2, 0, 0],
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#F97316' },
                { offset: 1, color: 'rgba(249,115,22,0.2)' },
              ],
            },
          },
        },
        {
          name: '运费',
          type: 'line',
          yAxisIndex: 1,
          data: freights,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#06B6D4', width: 2 },
          itemStyle: { color: '#06B6D4', borderColor: '#0F172A', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(6,182,212,0.25)' },
                { offset: 1, color: 'rgba(6,182,212,0)' },
              ],
            },
          },
        },
      ],
    };
  }, [stats.todayShipments]);

  const tempDistOption = useMemo(() => {
    const counts: Record<TempControl, number> = { NORMAL: 0, FRESH: 0, REFRIGERATED: 0, DEEP_FREEZE: 0 };
    myOrders.forEach((o) => { counts[o.tempControl]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        formatter: '{b}<br/>{c} 单 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 8,
        top: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        formatter: (name: string) => {
          const key = name as TempControl;
          const cnt = counts[key] || 0;
          return `${tempControlMap[key].icon} ${name}  ${cnt}`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['65%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 2, borderColor: '#0B1220', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value: counts.NORMAL, name: 'NORMAL', itemStyle: { color: '#64748B' } },
            { value: counts.FRESH, name: 'FRESH', itemStyle: { color: '#10B981' } },
            { value: counts.REFRIGERATED, name: 'REFRIGERATED', itemStyle: { color: '#3B82F6' } },
            { value: counts.DEEP_FREEZE, name: 'DEEP_FREEZE', itemStyle: { color: '#06B6D4' } },
          ].filter((d) => d.value > 0),
          emphasis: {
            scale: true,
            scaleSize: 4,
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(249,115,22,0.4)' },
          },
        },
      ],
      graphic: total === 0 ? [] : [
        {
          type: 'text', left: '65%', top: '42%',
          style: { text: Object.values(counts).reduce((a, b) => a + b, 0) + '', textAlign: 'center', fill: '#F97316', fontSize: 22, fontWeight: 700, fontFamily: 'Orbitron' },
        },
        {
          type: 'text', left: '65%', top: '55%',
          style: { text: '总订单', textAlign: 'center', fill: '#64748B', fontSize: 11 },
        },
      ],
    };
  }, [myOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">装载数据中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">货主工作台</h1>
            <span className="hex-tag">{user?.company || '货主模式'}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            {new Date().toLocaleDateString('zh-CN')} · 共 {myOrders.length} 条订单
          </p>
        </div>
        <button onClick={() => navigate('/shipper/publish')} className="btn-primary">
          <Send className="w-4 h-4 mr-2" />
          发布货源
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Package} label="今日发货量" value={`${stats.todayShipments} 单`} sub="较昨日 +23%" accent="bg-orange-500/10" />
        <StatCard icon={Truck} label="在途订单" value={`${stats.inTransit} 单`} sub="实时追踪中" accent="bg-cyan-500/10" />
        <StatCard icon={CreditCard} label="待付款" value={formatMoney(stats.pendingPayment)} sub={`${myOrders.filter(o => o.status === 'COMPLETED').length} 笔结算`} accent="bg-yellow-500/10" />
        <StatCard icon={Wallet} label="累计节省" value={formatMoney(stats.saved)} sub="对比传统调度" accent="bg-emerald-500/10" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-5">
          <div className="industrial-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">快捷入口</h3>
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <QuickEntry icon={Send} label="发布货源" onClick={() => navigate('/shipper/publish')} />
              <QuickEntry icon={FileText} label="查看订单" onClick={() => navigate('/shipper/orders')} />
              <QuickEntry icon={Thermometer} label="热力图" onClick={() => {}} />
              <QuickEntry icon={Shield} label="保险服务" onClick={() => {}} />
            </div>
          </div>

          <div className="industrial-card p-5 corner-brackets h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">温控类型分布</h3>
              <span className="text-xs text-slate-500 font-mono">TEMP DIST</span>
            </div>
            <ReactECharts option={tempDistOption} style={{ height: 260 }} />
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="industrial-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">最近7天发货趋势</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">7-DAY SHIPMENT TREND</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500 rounded-sm" />发货量</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />运费</span>
              </div>
            </div>
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </div>

          <div className="industrial-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-600/60">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">最近订单</h3>
                <span className="hex-tag">TOP 5</span>
              </div>
              <button onClick={() => navigate('/shipper/orders')} className="text-xs text-orange-400 hover:text-orange-300 font-mono flex items-center gap-1">
                查看全部 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider bg-ink-900/50">
                    <th className="text-left font-medium py-3 px-4">订单号</th>
                    <th className="text-left font-medium py-3 px-4">货物信息</th>
                    <th className="text-left font-medium py-3 px-4">路线</th>
                    <th className="text-right font-medium py-3 px-4">运费</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((o) => (
                      <OrderRow key={o.id} order={o} onClick={() => navigate(`/shipper/orders/${o.id}`)} />
                    ))
                  ) : (
                    <tr><td colSpan={4} className="py-12 text-center text-slate-500 text-sm">暂无订单，点击右上角发布第一条货源</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
