import { useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Banknote, Package, ShieldCheck, Clock, Wind, Star,
  TrendingUp, TrendingDown, Zap, AlertCircle, CheckCircle,
  Send, Truck, AlertTriangle, Eye,
} from 'lucide-react';
import { useDispatchStore } from '@/store/dispatchStore';
import { useOrderStore } from '@/store/orderStore';
import { formatMoney, statusTextMap, minutesAgo } from '@/utils/format';
import { AREA_ADDRESSES_EXPORT } from '@/utils/mockData';
import type { CargoOrder, TempControl } from '@/types';

function MiniSpark({ color, seed }: { color: string; seed: number }) {
  const data = useMemo(() => Array.from({ length: 14 }, (_, i) => 30 + Math.abs(Math.sin(i * 0.8 + seed)) * 60 + Math.random() * 10), [seed]);
  return (
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`mg-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none" stroke={color} strokeWidth="1.5"
        points={data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / 100) * 28}`).join(' ')}
      />
      <polygon
        fill={`url(#mg-${seed})`}
        points={`0,30 ${data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / 100) * 28}`).join(' ')} 100,30`}
      />
    </svg>
  );
}

export default function AdminOverview() {
  const { init: initD, gmv, todayOrders, fulfillmentRate, avgDeliveryMin, emptyMileageRate } = useDispatchStore();
  const { orders, init: initO, loading } = useOrderStore();
  const tickRef = useRef(0);
  const [, force] = useState(0);

  useEffect(() => { initD(); initO(); }, [initD, initO]);
  useEffect(() => {
    const id = setInterval(() => { tickRef.current++; force((n) => n + 1); }, 3500);
    return () => clearInterval(id);
  }, []);

  const kpis = useMemo(() => [
    { label: 'GMV 今日总营收', value: `¥${(gmv / 10000).toFixed(2)}`, unit: '万', change: 5.8, icon: Banknote, color: 'orange', spark: '#F97316', seed: 1, big: true },
    { label: '订单量', value: todayOrders, unit: '单', change: 12.3, icon: Package, color: 'cyan', spark: '#06B6D4', seed: 2 },
    { label: '履约率', value: `${(fulfillmentRate * 100).toFixed(1)}`, unit: '%', change: 0.6, icon: ShieldCheck, color: 'green', spark: '#10B981', seed: 3 },
    { label: '平均配送时长', value: avgDeliveryMin, unit: 'min', change: -3.2, icon: Clock, color: 'blue', spark: '#3B82F6', seed: 4 },
    { label: '空驶率', value: `${(emptyMileageRate * 100).toFixed(1)}`, unit: '%', change: -1.8, icon: Wind, color: 'yellow', spark: '#F59E0B', seed: 5 },
    { label: '司机满意度', value: '4.82', unit: '分', change: 0.4, icon: Star, color: 'purple', spark: '#A855F7', seed: 6 },
  ], [gmv, todayOrders, fulfillmentRate, avgDeliveryMin, emptyMileageRate]);

  const order24hOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const normal = hours.map((_, i) => Math.floor(8 + Math.abs(Math.sin(i * 0.4)) * 25 + Math.random() * 6));
    const fresh = hours.map((_, i) => Math.floor(3 + Math.abs(Math.cos(i * 0.5)) * 14 + Math.random() * 4));
    const refri = hours.map((_, i) => Math.floor(1 + Math.abs(Math.sin(i * 0.6 + 1)) * 10 + Math.random() * 3));
    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 24, top: 48, bottom: 32 },
      tooltip: { trigger: 'axis', backgroundColor: '#0B1220', borderColor: '#243049', textStyle: { color: '#E2E8F0', fontSize: 11 } },
      legend: { data: ['常温 NORMAL', '保鲜 FRESH', '冷藏 REFRIGERATED'], right: 0, top: 0,
        textStyle: { color: '#94A3B8', fontSize: 11 }, itemWidth: 12, itemHeight: 10, itemGap: 18 },
      xAxis: { type: 'category', data: hours, boundaryGap: false,
        axisLine: { lineStyle: { color: '#243049' } }, axisLabel: { color: '#64748B', fontSize: 10, interval: 2 }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 }, splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } } },
      series: [
        { name: '常温 NORMAL', type: 'line', stack: 'o', smooth: true, showSymbol: false,
          lineStyle: { color: '#64748B', width: 0 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#64748Baa' }, { offset: 1, color: '#64748B22' }] } },
          data: normal },
        { name: '保鲜 FRESH', type: 'line', stack: 'o', smooth: true, showSymbol: false,
          lineStyle: { color: '#10B981', width: 0 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10B981cc' }, { offset: 1, color: '#10B98122' }] } },
          data: fresh },
        { name: '冷藏 REFRIGERATED', type: 'line', stack: 'o', smooth: true, showSymbol: false,
          lineStyle: { color: '#3B82F6', width: 0 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3B82F6cc' }, { offset: 1, color: '#3B82F622' }] } },
          data: refri },
      ],
    };
  }, [tickRef.current]);

  const heatMatrixOption = useMemo(() => {
    const regions = AREA_ADDRESSES_EXPORT.map((a) => a.name);
    const slots = ['00', '03', '06', '09', '12', '15', '18', '21'];
    const data: [number, number, number][] = [];
    for (let i = 0; i < regions.length; i++) {
      for (let j = 0; j < slots.length; j++) {
        data.push([j, i, Math.floor(0.3 + Math.abs(Math.sin(i * 0.7 + j * 0.9 + tickRef.current * 0.05)) * 0.7 * 100) / 100]);
      }
    }
    return {
      backgroundColor: 'transparent',
      grid: { left: 72, right: 24, top: 16, bottom: 40 },
      tooltip: { position: 'top', backgroundColor: '#0B1220', borderColor: '#243049', textStyle: { color: '#E2E8F0', fontSize: 11 },
        formatter: (p: { data: [number, number, number] }) => `${regions[p.data[1]]} · ${slots[p.data[0]]}:00<br/>饱和度 <b style="color:#F97316">${(p.data[2] * 100).toFixed(0)}%</b>` },
      xAxis: { type: 'category', data: slots, splitArea: { show: true, areaStyle: { color: ['#0B122044', 'transparent'] } },
        axisLine: { show: false }, axisLabel: { color: '#64748B', fontSize: 10 }, axisTick: { show: false } },
      yAxis: { type: 'category', data: regions, splitArea: { show: true },
        axisLine: { show: false }, axisLabel: { color: '#94A3B8', fontSize: 10 }, axisTick: { show: false } },
      visualMap: { min: 0.2, max: 1, show: false, inRange: { color: ['#1A2238', '#10B981', '#F59E0B', '#F97316', '#EF4444'] } },
      series: [{ name: '饱和度', type: 'heatmap', data, label: { show: true, color: '#E2E8F0', fontSize: 9, formatter: (p: { data: [number, number, number] }) => `${(p.data[2] * 100).toFixed(0)}%` },
        itemStyle: { borderColor: '#050A14', borderWidth: 1, borderRadius: 2 } }],
    };
  }, [tickRef.current]);

  const shipperRankOption = useMemo(() => {
    const names = ['上海鲜达供应链', '沪上快仓物流', '申城速运', '长三角冷链', '顺丰同城仓', '京东云仓', '苏宁物流', '德邦快递', '安能快运', '壹米滴答'];
    const vals = names.map((_, i) => 80 + Math.floor(Math.abs(Math.sin(i * 1.3 + 2)) * 340));
    return {
      backgroundColor: 'transparent',
      grid: { left: 100, right: 48, top: 8, bottom: 8, containLabel: false },
      tooltip: { trigger: 'axis', backgroundColor: '#0B1220', borderColor: '#243049', textStyle: { color: '#E2E8F0', fontSize: 11 }, axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#64748B', fontSize: 10 }, splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } } },
      yAxis: { type: 'category', data: names.reverse(), axisLine: { show: false }, axisLabel: { color: '#94A3B8', fontSize: 10 }, axisTick: { show: false } },
      series: [{
        type: 'bar', data: vals.reverse(), barWidth: 14,
        itemStyle: { borderRadius: [0, 2, 2, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: '#243049' }, { offset: 1, color: '#F97316' }] } },
        label: { show: true, position: 'right', color: '#F97316', fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, formatter: '{c} 单' },
      }],
    };
  }, []);

  const exceptionRingOption = useMemo(() => {
    const data = [
      { name: '超时送达', value: 42, color: '#F97316' },
      { name: '温度异常', value: 28, color: '#3B82F6' },
      { name: '货物损坏', value: 18, color: '#EF4444' },
      { name: '司机爽约', value: 14, color: '#F59E0B' },
      { name: '其他原因', value: 22, color: '#64748B' },
    ];
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: '#0B1220', borderColor: '#243049', textStyle: { color: '#E2E8F0', fontSize: 11 }, formatter: '{b}: {c} 单 ({d}%)' },
      legend: { orient: 'vertical', right: 4, top: 'center', textStyle: { color: '#94A3B8', fontSize: 11 }, itemWidth: 10, itemHeight: 10, itemGap: 12 },
      series: [{
        type: 'pie', radius: ['48%', '76%'], center: ['38%', '50%'],
        itemStyle: { borderRadius: 3, borderColor: '#0B1220', borderWidth: 2 },
        label: { show: true, color: '#E2E8F0', fontSize: 10, formatter: '{d}%', fontFamily: 'Orbitron', fontWeight: 700 },
        labelLine: { length: 6, length2: 4, lineStyle: { color: '#243049' } },
        data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
      }],
      graphic: [
        { type: 'text', left: '38%', top: '42%', style: { text: '124', textAlign: 'center', fill: '#F97316', fontSize: 26, fontWeight: 800, fontFamily: 'Orbitron' } },
        { type: 'text', left: '38%', top: '55%', style: { text: '异常单', textAlign: 'center', fill: '#64748B', fontSize: 11 } },
      ],
    };
  }, []);

  const feedEvents = useMemo(() => {
    const events: { type: 'NEW' | 'ACCEPT' | 'DELIVER' | 'EXCEPTION'; order: CargoOrder; time: string }[] = [];
    const feedOrders = orders.slice(0, 15);
    feedOrders.forEach((o, i) => {
      const types: ('NEW' | 'ACCEPT' | 'DELIVER' | 'EXCEPTION')[] = ['NEW', 'ACCEPT', 'DELIVER', 'EXCEPTION'];
      events.push({ type: types[i % 4], order: o, time: `${i * 3 + 1}分钟前` });
    });
    return events;
  }, [orders, tickRef.current]);

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400">加载中...</div>;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-ink-950 p-4 flex flex-col gap-4">
      <div className="absolute inset-0 data-grid opacity-40 pointer-events-none" />

      <header className="relative shrink-0">
        <div className="industrial-card corner-brackets px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-sm bg-gradient-to-br from-orange-500/40 to-orange-550/20 flex items-center justify-center border border-orange-500/30 shadow-glow-orange-sm">
                <Banknote className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl tracking-wider text-white">运营综合大屏</h1>
                <div className="font-mono text-[10px] text-slate-500 tracking-[0.3em] mt-1">OPERATIONS OVERVIEW DASHBOARD</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-signal-green/10 border border-signal-green/30">
                <Zap className="w-4 h-4 text-signal-green animate-pulse" />
                <span className="font-mono text-xs text-signal-green font-semibold">实时同步中</span>
              </div>
              <div className="font-mono text-xs text-slate-500">数据刷新 · {(tickRef.current * 3.5).toFixed(0)}s</div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-6 gap-4 shrink-0">
        {kpis.map((k, i) => {
          const PosIcon = k.change >= 0 ? TrendingUp : TrendingDown;
          const posColor = k.change >= 0 ? 'text-signal-green' : 'text-signal-red';
          const colorMap: Record<string, string> = { orange: 'from-orange-500/30 to-orange-550/10 border-orange-500/30 text-orange-400', cyan: 'from-signal-cyan/30 to-signal-cyan/10 border-signal-cyan/30 text-signal-cyan', green: 'from-signal-green/30 to-signal-green/10 border-signal-green/30 text-signal-green', blue: 'from-signal-blue/30 to-signal-blue/10 border-signal-blue/30 text-signal-blue', yellow: 'from-signal-yellow/30 to-signal-yellow/10 border-signal-yellow/30 text-signal-yellow', purple: 'from-purple-500/30 to-purple-500/10 border-purple-500/30 text-purple-400' };
          return (
            <div key={i} className={`stat-panel corner-brackets ${i === 0 ? 'col-span-2' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-9 h-9 rounded-sm bg-gradient-to-br ${colorMap[k.color]} border flex items-center justify-center`}>
                      <k.icon size={18} />
                    </div>
                    <span className="text-xs text-slate-400 font-mono tracking-wider">{k.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display font-extrabold tracking-wide text-white ${k.big ? 'text-4xl' : 'text-3xl'}`}>{k.value}</span>
                    <span className="text-xs text-slate-500 font-mono">{k.unit}</span>
                  </div>
                  <div className={`mt-1.5 inline-flex items-center gap-1 text-xs ${posColor}`}>
                    <PosIcon size={12} />
                    <span>{k.change >= 0 ? '+' : ''}{k.change}%</span>
                    <span className="text-slate-500 ml-1 font-normal">环比</span>
                  </div>
                </div>
                <div className="w-20 shrink-0">
                  <MiniSpark color={k.spark} seed={k.seed} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 grid grid-cols-100 gap-4 min-h-0">
        <div className="col-span-[45%] industrial-card corner-brackets p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">订单量 24 小时走势</h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />常温</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-signal-green" />保鲜</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-signal-blue" />冷藏</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ReactECharts option={order24hOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="col-span-[55%] industrial-card corner-brackets p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-signal-cyan" />
              <h3 className="text-sm font-semibold text-white tracking-wide">运力饱和度热力矩阵</h3>
              <span className="font-mono text-[10px] text-slate-500 ml-2">REGION × TIME SLOT</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ReactECharts option={heatMatrixOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="col-span-[48%] industrial-card corner-brackets p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">Top 10 发货货主排名</h3>
            </div>
            <span className="hex-tag text-[10px]">SHIPPER RANKING</span>
          </div>
          <div className="flex-1 min-h-0">
            <ReactECharts option={shipperRankOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="col-span-[52%] industrial-card corner-brackets p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-signal-red" />
              <h3 className="text-sm font-semibold text-white tracking-wide">履约异常原因分布</h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span>异常率</span>
              <span className="font-display font-bold text-signal-red text-sm">1.28%</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ReactECharts option={exceptionRingOption} style={{ height: '100%' }} />
          </div>
        </div>
      </div>

      <div className="shrink-0 industrial-card corner-brackets overflow-hidden">
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-ink-600/60 bg-ink-900/60">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400 animate-pulse" />
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase">实时订单动态 Feed 流</h3>
          </div>
          <span className="hex-tag text-[10px]">LIVE STREAM</span>
        </div>
        <div className="overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee py-3 gap-8" style={{ animationDuration: '45s' }}>
            {[...feedEvents, ...feedEvents].map((ev, idx) => {
              const Icon = ev.type === 'NEW' ? Send : ev.type === 'ACCEPT' ? Truck : ev.type === 'DELIVER' ? CheckCircle : AlertTriangle;
              const cfg = ev.type === 'NEW' ? { bg: 'bg-signal-blue/10', text: 'text-signal-blue', border: 'border-signal-blue/30', label: '新订单' }
                : ev.type === 'ACCEPT' ? { bg: 'bg-signal-green/10', text: 'text-signal-green', border: 'border-signal-green/30', label: '已接单' }
                : ev.type === 'DELIVER' ? { bg: 'bg-signal-cyan/10', text: 'text-signal-cyan', border: 'border-signal-cyan/30', label: '已送达' }
                : { bg: 'bg-signal-red/10', text: 'text-signal-red', border: 'border-signal-red/30', label: '异常' };
              return (
                <div key={idx} className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-sm border ${cfg.bg} ${cfg.border} shrink-0`}>
                  <Icon size={14} className={cfg.text} />
                  <span className={`font-mono text-[10px] font-semibold ${cfg.text} uppercase tracking-wider`}>{cfg.label}</span>
                  <span className="font-display text-xs text-orange-400 font-bold">{ev.order.orderNo.slice(-8)}</span>
                  <span className="text-xs text-slate-400">{ev.order.shipperName}</span>
                  <span className="text-xs text-slate-300">{ev.order.cargoName}</span>
                  <span className="font-mono text-[10px] text-slate-500">{ev.time}</span>
                  <span className="font-mono text-xs text-orange-300 font-bold">{formatMoney(ev.order.totalPrice)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
