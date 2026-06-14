import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  CalendarDays,
  Layers,
  TrendingUp,
  Box,
  Scale,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import ReactECharts from 'echarts-for-react';
import { useDispatchStore } from '@/store/dispatchStore';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/common/StatCard';
import type { HeatmapPoint } from '@/types';
import { formatMoney, formatVolume, formatWeight } from '@/utils/format';

type TimeRange = 'TODAY' | 'WEEK7' | 'MONTH30';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'TODAY', label: '今日' },
  { key: 'WEEK7', label: '近7日' },
  { key: 'MONTH30', label: '近30日' },
];

const REGIONS = [
  '全部区域',
  '朝阳区',
  '海淀区',
  '西城区',
  '东城区',
  '丰台区',
  '通州区',
  '昌平区',
  '大兴区',
  '顺义区',
];

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  return (
    <div className="inline-flex rounded-sm border border-ink-600/60 bg-ink-900/50 overflow-hidden">
      {TIME_RANGES.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative px-4 py-2 text-xs font-semibold transition-all ${
              active ? 'text-white bg-orange-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {t.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function RegionSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 border border-ink-600/60 bg-ink-900/50 hover:border-ink-500 transition-colors rounded-sm"
      >
        <MapPin className="w-3.5 h-3.5 text-orange-400" />
        {value}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-44 bg-ink-900 border border-ink-600/60 rounded-sm overflow-hidden shadow-lg z-20">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-xs text-left transition-colors ${
                  value === r
                    ? 'text-orange-400 bg-orange-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeatmapChart({ data }: { data: HeatmapPoint[] }) {
  const option = useMemo(() => {
    const heatData: [number, number, number][] = data.map((p) => [p.lng, p.lat, p.value]);
    const scatterData: { value: [number, number, number]; name: string; count: number }[] = data.map((p) => ({
      value: [p.lng, p.lat, p.value],
      name: p.regionName,
      count: p.count,
    }));

    const minLat = Math.min(...data.map((d) => d.lat));
    const maxLat = Math.max(...data.map((d) => d.lat));
    const minLng = Math.min(...data.map((d) => d.lng));
    const maxLng = Math.max(...data.map((d) => d.lng));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        formatter: (params: { name?: string; value?: number[]; data?: { count: number; name: string } }) => {
          const name = params.data?.name || params.name || '未知';
          const value = params.value?.[2] ?? 0;
          const count = params.data?.count ?? 0;
          return `<div class="font-semibold text-orange-400 mb-1">${name}</div>
            <div class="flex justify-between gap-4 text-xs text-slate-300"><span>发货强度</span><span class="text-orange-400 font-display">${value.toFixed(1)}</span></div>
            <div class="flex justify-between gap-4 text-xs text-slate-300 mt-0.5"><span>订单数</span><span class="text-signal-cyan font-display">${count} 单</span></div>`;
        },
      },
      geo: {
        map: 'china-beijing-simplified',
        roam: true,
        zoom: 1.2,
        center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        label: { show: false },
        itemStyle: {
          areaColor: '#0F172A',
          borderColor: '#243049',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: { areaColor: '#1A2238' },
          label: { show: false },
        },
      },
      visualMap: {
        show: true,
        left: 16,
        bottom: 16,
        min: 0,
        max: data.length > 0 ? Math.max(...data.map((d) => d.value)) : 100,
        calculable: true,
        dimension: 2,
        itemHeight: 120,
        itemWidth: 10,
        text: ['高', '低'],
        textStyle: { color: '#64748B', fontSize: 10 },
        inRange: {
          color: ['#0F172A', '#1E3A5F', '#2563EB', '#F97316', '#FBBF24', '#EF4444'],
        },
      },
      series: [
        {
          name: '发货强度',
          type: 'heatmap',
          coordinateSystem: 'geo',
          pointSize: 32,
          blurSize: 24,
          data: heatData,
        },
        {
          name: '散点',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: (val: number[]) => Math.max(6, Math.min(24, Math.sqrt(val[2]) * 3)),
          itemStyle: {
            color: '#F97316',
            shadowBlur: 12,
            shadowColor: 'rgba(249,115,22,0.5)',
            borderColor: '#0F172A',
            borderWidth: 1.5,
          },
          emphasis: {
            scale: 1.3,
            itemStyle: {
              color: '#FBBF24',
              shadowBlur: 20,
              shadowColor: 'rgba(251,191,36,0.7)',
            },
          },
        },
      ],
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-[460px] flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm font-mono">热力数据加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: 460 }}>
      <MapContainer
        center={[
          data.length > 0 ? data.reduce((s, d) => s + d.lat, 0) / data.length : 39.9042,
          data.length > 0 ? data.reduce((s, d) => s + d.lng, 0) / data.length : 116.4074,
        ]}
        zoom={11}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {data.map((p, i) => {
          const maxVal = Math.max(...data.map((d) => d.value));
          const norm = p.value / (maxVal || 1);
          const radius = 18 + norm * 40;
          const color =
            norm > 0.8 ? '#EF4444' : norm > 0.55 ? '#F97316' : norm > 0.3 ? '#FBBF24' : norm > 0.1 ? '#3B82F6' : '#243049';
          return (
            <CircleMarker
              key={i}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.15 + norm * 0.35,
                weight: 1,
                opacity: 0.7,
              }}
            >
              <Popup>
                <div className="font-semibold text-orange-400 text-sm mb-1">{p.regionName}</div>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between gap-6 text-slate-400">
                    <span>发货强度</span>
                    <span className="text-orange-400">{p.value.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between gap-6 text-slate-400">
                    <span>订单数量</span>
                    <span className="text-signal-cyan">{p.count} 单</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="absolute left-4 bottom-4 bg-ink-900/90 backdrop-blur-sm border border-ink-600/60 rounded-sm p-3 space-y-1.5 z-[500]">
        <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">强度图例</div>
        {[
          { label: '极高', color: '#EF4444', range: '>80%' },
          { label: '高', color: '#F97316', range: '55-80%' },
          { label: '中', color: '#FBBF24', range: '30-55%' },
          { label: '低', color: '#3B82F6', range: '10-30%' },
          { label: '极低', color: '#243049', range: '<10%' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-[10px]">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color, opacity: 0.8 }} />
            <span className="text-slate-400 w-8">{l.label}</span>
            <span className="text-slate-500 font-mono">{l.range}</span>
          </div>
        ))}
      </div>
      <div className="absolute right-4 top-4 bg-ink-900/90 backdrop-blur-sm border border-ink-600/60 rounded-sm px-3 py-2 z-[500]">
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <Layers className="w-3.5 h-3.5 text-orange-400" />
          <span>热力点：<span className="text-orange-400 font-display">{data.length}</span></span>
        </div>
      </div>
    </div>
  );
}

function RegionRanking({ data }: { data: HeatmapPoint[] }) {
  const option = useMemo(() => {
    const sorted = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      backgroundColor: 'transparent',
      grid: { left: 80, right: 24, top: 20, bottom: 16 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(249,115,22,0.06)' } },
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((d) => d.regionName).reverse(),
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: {
          color: '#94A3B8',
          fontSize: 11,
          fontWeight: 500,
        },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: sorted
            .map((d, i) => ({
              value: d.value,
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    {
                      offset: 0,
                      color: i < 2 ? '#F97316' : i < 5 ? '#FBBF24' : '#3B82F6',
                    },
                    {
                      offset: 1,
                      color:
                        i < 2
                          ? 'rgba(249,115,22,0.3)'
                          : i < 5
                            ? 'rgba(251,191,36,0.3)'
                            : 'rgba(59,130,246,0.3)',
                    },
                  ],
                },
                borderRadius: [0, 2, 2, 0],
              },
            }))
            .reverse(),
          barWidth: 14,
          label: {
            show: true,
            position: 'right',
            color: '#F97316',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif',
            formatter: '{c}',
          },
        },
      ],
    };
  }, [data]);

  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">区域发货排名</h3>
        </div>
        <span className="hex-tag">TOP 8</span>
      </div>
      <ReactECharts option={option} style={{ height: 280 }} />
    </div>
  );
}

function HourlyWeekMatrix({ range }: { range: TimeRange }) {
  const option = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}时`);
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const data: [number, number, number][] = [];

    const multiplier = range === 'TODAY' ? 1 : range === 'WEEK7' ? 4 : 12;

    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        let base = 0;
        if (h >= 6 && h <= 8) base = 40;
        else if (h >= 9 && h <= 11) base = 85;
        else if (h >= 12 && h <= 13) base = 55;
        else if (h >= 14 && h <= 17) base = 95;
        else if (h >= 18 && h <= 20) base = 60;
        else if (h >= 21 && h <= 22) base = 30;
        else base = 8;

        if (d >= 5) base *= 0.6;

        const val = Math.max(0, Math.round(base + (Math.random() - 0.5) * 20) * multiplier);
        data.push([h, d, val]);
      }
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        formatter: (p: { value?: [number, number, number] }) => {
          if (!p.value) return '';
          return `<div class="font-mono text-[11px] text-slate-300">${weekdays[p.value[1]]} ${hours[p.value[0]]}<br/><span class="text-orange-400 font-display">${p.value[2]}</span> 单发货</div>`;
        },
      },
      grid: { left: 48, right: 24, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: { show: true, areaStyle: { color: ['rgba(15,23,42,0.4)', 'transparent'] } },
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 9,
          interval: 1,
          rotate: 0,
          formatter: (v: string) => v.replace('时', ''),
        },
        axisTick: { show: false },
        name: '小时',
        nameTextStyle: { color: '#64748B', fontSize: 10, padding: [28, 0, 0, 0] },
      },
      yAxis: {
        type: 'category',
        data: weekdays,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: { color: '#94A3B8', fontSize: 10, fontWeight: 500 },
        axisTick: { show: false },
      },
      visualMap: {
        min: 0,
        max: 1200,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: '#64748B', fontSize: 9 },
        text: ['热', '冷'],
        inRange: {
          color: ['#0F172A', '#1A2238', '#1E40AF', '#F97316', '#EF4444'],
        },
      },
      series: [
        {
          name: '发货频次',
          type: 'heatmap',
          data: data,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: 'rgba(249,115,22,0.6)',
              borderColor: '#F97316',
              borderWidth: 1,
            },
          },
        },
      ],
    };
  }, [range]);

  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-signal-cyan" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">时段分布热力矩阵</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">HOUR × WEEKDAY</span>
      </div>
      <ReactECharts option={option} style={{ height: 260 }} />
    </div>
  );
}

export default function ShipperHeatmap() {
  const { init: initDispatch, heatmapData } = useDispatchStore();
  const { init: initOrder, orders } = useOrderStore();
  const { user } = useAuthStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('WEEK7');
  const [region, setRegion] = useState('全部区域');

  useEffect(() => {
    initDispatch();
    initOrder();
  }, [initDispatch, initOrder]);

  const shipperId = user?.id ?? 'shipper_demo';

  const filteredData = useMemo(() => {
    let list = heatmapData;
    if (region !== '全部区域') {
      list = list.filter((d) => d.regionName.includes(region.replace('区', '')));
    }
    const rangeMult = timeRange === 'TODAY' ? 0.15 : timeRange === 'WEEK7' ? 1 : 4.2;
    return list.map((d) => ({
      ...d,
      value: +(d.value * rangeMult).toFixed(1),
      count: Math.max(1, Math.round(d.count * rangeMult)),
    }));
  }, [heatmapData, region, timeRange]);

  const overview = useMemo(() => {
    const myOrders = orders.filter((o) => o.shipperId === shipperId);
    const rangeMult = timeRange === 'TODAY' ? 0.12 : timeRange === 'WEEK7' ? 1 : 4.3;
    const totalOrders = Math.round(myOrders.length * rangeMult);
    const totalWeight = +myOrders.reduce((s, o) => s + o.weight, 0) * rangeMult;
    const totalVolume = +(myOrders.reduce((s, o) => s + o.volume, 0) * rangeMult).toFixed(1);
    const totalFreight = +myOrders.reduce((s, o) => s + o.totalPrice, 0) * rangeMult;
    return { totalOrders, totalWeight, totalVolume, totalFreight };
  }, [orders, shipperId, timeRange]);

  return (
    <div className="p-6 space-y-5 max-w-[1800px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">发货热力图</h1>
            <span className="hex-tag">HEATMAP</span>
          </div>
          <p className="text-sm text-slate-500 font-mono">分析您的发货密度与区域分布</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <RegionSelector value={region} onChange={setRegion} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="总发货单数"
          value={overview.totalOrders}
          unit="单"
          icon={Box}
          color="orange"
          change={12.4}
        />
        <StatCard
          label="总重量"
          value={formatWeight(overview.totalWeight)}
          icon={Scale}
          color="cyan"
          change={8.7}
        />
        <StatCard
          label="总体积"
          value={formatVolume(overview.totalVolume)}
          icon={Layers}
          color="green"
          change={6.2}
        />
        <StatCard
          label="总运费"
          value={formatMoney(overview.totalFreight)}
          icon={CreditCard}
          color="orange"
          change={15.8}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
        <div className="space-y-5">
          <div className="industrial-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-600/60">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">区域发货热力图</h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="status-dot bg-signal-green animate-pulse" />
                  实时更新
                </span>
              </div>
            </div>
            <HeatmapChart data={filteredData} />
          </div>

          <HourlyWeekMatrix range={timeRange} />
        </div>

        <div className="space-y-5">
          <RegionRanking data={filteredData} />

          <div className="industrial-card corner-brackets p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-signal-yellow" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">热门路线建议</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { from: '朝阳区·望京', to: '海淀区·中关村', volume: 428, rate: 96.2 },
                { from: '西城区·金融街', to: '东城区·国贸', volume: 315, rate: 98.5 },
                { from: '丰台区·丽泽', to: '通州区·运河', volume: 256, rate: 94.1 },
                { from: '昌平区·回龙观', to: '朝阳区·CBD', volume: 198, rate: 91.7 },
                { from: '大兴区·亦庄', to: '顺义区·空港', volume: 162, rate: 97.3 },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-sm bg-ink-900/60 border border-ink-600/40 hover:border-orange-500/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-sm bg-orange-500/15 flex items-center justify-center shrink-0 font-display text-xs font-bold text-orange-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 truncate">
                      <span className="text-orange-400">{r.from.split('·')[0]}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-signal-cyan">{r.to.split('·')[0]}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {r.from.split('·')[1]} → {r.to.split('·')[1]}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-sm font-bold text-orange-400">{r.volume}</div>
                    <div className="text-[10px] text-signal-green font-mono">{r.rate}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
