import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Segmented,
  Card,
  Avatar,
  Tag,
  Badge,
  Typography,
  Tooltip,
  List,
  Progress,
  Space,
  Button,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  TrendingUp,
  Users,
  Car,
  Clock,
  Fuel,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  MapPin,
  Trophy,
  Activity,
  RefreshCw,
  Filter,
} from 'lucide-react';

const { Text, Title } = Typography;

type TimeRange = '1day' | '7day' | '30day';

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  reverse?: boolean;
  description?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  unit,
  icon,
  color,
  reverse = false,
  description,
}) => {
  const [display, setDisplay] = useState(0);
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
  const isPositive = reverse ? trend < 0 : trend > 0;

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const from = 0;
    const animate = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (numeric - from) * eased);
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [numeric]);

  const circumference = 2 * Math.PI * 42;
  const progress = Math.min(100, Math.abs(trend) * 2);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card
      className="!bg-gradient-to-br !from-deep-blue-800/60 !to-deep-blue-900/60 !border-white/10 !backdrop-blur-xl overflow-hidden relative"
      styles={{ body: { padding: 0 } }}
    >
      <div
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: color }}
      />
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}88)`,
                boxShadow: `0 8px 24px -8px ${color}66`,
              }}
            >
              {icon}
            </div>
            <div>
              <div className="text-xs text-white/50 font-medium mb-0.5">{title}</div>
              {description && (
                <div className="text-[10px] text-white/30">{description}</div>
              )}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${
              isPositive
                ? 'bg-success/15 text-success'
                : 'bg-danger/15 text-danger'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={11} />
            ) : (
              <ArrowDownRight size={11} />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter: `drop-shadow(0 0 6px ${color})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-2xl font-bold font-mono tracking-tight"
                style={{ color }}
              >
                {value.startsWith('¥') ? '¥' : ''}
                {display.toLocaleString(undefined, {
                  maximumFractionDigits: value.includes('.') ? 2 : 0,
                })}
              </span>
              {unit && (
                <span className="text-[10px] text-white/50 mt-0.5">{unit}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-2 pb-1">
            {[
              { label: '环比', pct: 42 + Math.random() * 30, color: 'rgba(59,130,246,0.5)' },
              { label: '同比', pct: 55 + Math.random() * 30, color: `${color}66` },
              { label: '目标', pct: 70 + Math.random() * 25, color: 'rgba(255,107,26,0.5)' },
            ].map((bar, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/40">{bar.label}</span>
                  <span className="text-white/60 font-mono">{bar.pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${bar.pct}%`, background: bar.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const hotCities = [
  { name: '北京', value: [116.4074, 39.9042, 98] },
  { name: '上海', value: [121.4737, 31.2304, 95] },
  { name: '广州', value: [113.2644, 23.1291, 88] },
  { name: '深圳', value: [114.0579, 22.5431, 85] },
  { name: '成都', value: [104.0668, 30.5728, 72] },
  { name: '重庆', value: [106.5516, 29.563, 68] },
  { name: '杭州', value: [120.1551, 30.2741, 78] },
  { name: '武汉', value: [114.3054, 30.5931, 65] },
  { name: '西安', value: [108.9398, 34.3416, 58] },
  { name: '郑州', value: [113.6254, 34.7466, 52] },
  { name: '南京', value: [118.7969, 32.0603, 60] },
  { name: '天津', value: [117.1902, 39.1256, 48] },
];

const flightLines: [string, string][] = [
  ['北京', '上海'],
  ['北京', '广州'],
  ['上海', '成都'],
  ['广州', '重庆'],
  ['深圳', '杭州'],
  ['北京', '深圳'],
  ['上海', '武汉'],
  ['广州', '杭州'],
  ['成都', '西安'],
  ['北京', '郑州'],
];

const alerts = [
  { id: 1, level: 'danger', time: '14:32:18', text: '司机李XX疲劳驾驶预警，已连续行驶4.5h', city: '沪陕高速' },
  { id: 2, level: 'warning', time: '14:30:05', text: '运单YD202406078923存在路线偏离2.3km', city: '杭州绕城' },
  { id: 3, level: 'danger', time: '14:28:42', text: '车牌京A·88888超速112km/h，限速100', city: '京沪高速' },
  { id: 4, level: 'warning', time: '14:26:11', text: '客户投诉：运单配送延迟超6小时', city: '广州' },
  { id: 5, level: 'info', time: '14:24:36', text: '新司机实名认证审核，待处理32份', city: '系统' },
  { id: 6, level: 'danger', time: '14:22:18', text: '油站联盟异常核销订单5笔，需复核', city: '深圳' },
  { id: 7, level: 'warning', time: '14:20:05', text: '货主上海XX物流额度告警，剩余8.2%', city: '上海' },
  { id: 8, level: 'info', time: '14:18:33', text: '系统自动完成运单结算128笔/¥286.5万', city: '系统' },
];

const topDrivers = [
  { name: '王志强', avatar: 'W', orders: 328, gmv: 186200, score: 99.2, truck: '京A·F8823' },
  { name: '李明辉', avatar: 'L', orders: 305, gmv: 172800, score: 98.7, truck: '沪B·K2568' },
  { name: '张建军', avatar: 'Z', orders: 286, gmv: 161500, score: 98.5, truck: '粤A·Q7721' },
  { name: '刘德胜', avatar: 'L', orders: 274, gmv: 154200, score: 98.1, truck: '川A·R3091' },
  { name: '陈志远', avatar: 'C', orders: 261, gmv: 148900, score: 97.8, truck: '浙A·S1288' },
  { name: '赵国栋', avatar: 'Z', orders: 248, gmv: 141200, score: 97.5, truck: '苏A·T6652' },
  { name: '孙海涛', avatar: 'S', orders: 235, gmv: 132800, score: 97.2, truck: '鲁A·U1102' },
  { name: '周立波', avatar: 'Z', orders: 222, gmv: 125600, score: 96.9, truck: '鄂A·V8834' },
  { name: '吴学斌', avatar: 'W', orders: 209, gmv: 118300, score: 96.6, truck: '闽A·W5577' },
  { name: '郑建华', avatar: 'Z', orders: 196, gmv: 109800, score: 96.3, truck: '湘A·X9911' },
];

const AdminDashboard: React.FC = () => {
  const [range, setRange] = useState<TimeRange>('7day');
  const [alarmIndex, setAlarmIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setAlarmIndex((p) => (p + 1) % alerts.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const kpiData: KpiCardProps[] = useMemo(
    () => [
      {
        title: '平台总GMV',
        value: range === '1day' ? '¥3.28M' : range === '7day' ? '¥22.65M' : '¥96.82M',
        trend: 12.8,
        unit: '元',
        icon: <TrendingUp size={20} className="text-white" />,
        color: '#FF6B1A',
        description: range === '1day' ? '今日累计' : range === '7day' ? '本周累计' : '本月累计',
      },
      {
        title: '活跃司机数',
        value: range === '1day' ? '3,852' : range === '7day' ? '8,624' : '15,328',
        trend: 8.4,
        unit: '人',
        icon: <Users size={20} className="text-white" />,
        color: '#3B82F6',
        description: '实名认证+在途接单',
      },
      {
        title: '空驶率',
        value: range === '1day' ? '21.3' : range === '7day' ? '23.6' : '24.8',
        trend: -3.2,
        unit: '%',
        icon: <Car size={20} className="text-white" />,
        color: '#10B981',
        reverse: true,
        description: '较上周优化',
      },
      {
        title: '平均账期',
        value: range === '1day' ? '2.1' : range === '7day' ? '2.4' : '2.6',
        trend: -15.6,
        unit: '天',
        icon: <Clock size={20} className="text-white" />,
        color: '#8B5CF6',
        reverse: true,
        description: '资金周转效率',
      },
      {
        title: '油费节省总额',
        value: range === '1day' ? '¥286K' : range === '7day' ? '¥1.92M' : '¥8.24M',
        trend: 18.2,
        unit: '元',
        icon: <Fuel size={20} className="text-white" />,
        color: '#06B6D4',
        description: '联盟油站优惠',
      },
      {
        title: '风险预警数',
        value: range === '1day' ? '128' : range === '7day' ? '856' : '3,420',
        trend: -6.8,
        unit: '件',
        icon: <AlertTriangle size={20} className="text-white" />,
        color: '#EF4444',
        reverse: true,
        description: '需人工处理',
      },
    ],
    [range]
  );

  const mapOption = useMemo<EChartsOption>(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10,35,66,0.95)',
        borderColor: 'rgba(255,107,26,0.3)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (p: any) => {
          if (p.seriesType === 'effectScatter') {
            return `<div class="font-bold text-primary-orange mb-1">${p.name}</div>
                    <div class="text-white/70 text-xs">运输热度: <span class="text-white font-semibold">${p.value[2]}</span></div>
                    <div class="text-white/70 text-xs">今日单量: <span class="text-primary-orange font-semibold">${Math.round(p.value[2] * 12.8)}</span></div>`;
          }
          if (p.seriesType === 'lines') {
            return `<div class="font-bold text-info mb-1">${p.data.fromName} → ${p.data.toName}</div>
                    <div class="text-white/70 text-xs">本周运单: <span class="text-white font-semibold">${Math.floor(500 + Math.random() * 1500)}</span> 单</div>
                    <div class="text-white/70 text-xs">平均时效: <span class="text-success font-semibold">${(12 + Math.random() * 24).toFixed(1)}</span>h</div>`;
          }
          return '';
        },
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        label: { show: false },
        itemStyle: {
          areaColor: 'rgba(59,130,246,0.06)',
          borderColor: 'rgba(59,130,246,0.25)',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            areaColor: 'rgba(255,107,26,0.15)',
            borderColor: '#FF6B1A',
          },
          label: { show: true, color: '#fff', fontSize: 11 },
        },
      },
      series: [
        {
          name: '飞线',
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          effect: {
            show: true,
            period: 5,
            trailLength: 0.3,
            symbol: 'arrow',
            symbolSize: 8,
            color: '#FF6B1A',
          },
          lineStyle: {
            color: 'rgba(255,107,26,0.5)',
            width: 1.2,
            opacity: 0.8,
            curveness: 0.3,
          },
          data: flightLines.map(([from, to]) => {
            const f = hotCities.find((c) => c.name === from);
            const t = hotCities.find((c) => c.name === to);
            return {
              fromName: from,
              toName: to,
              coords: f && t ? [f.value.slice(0, 2), t.value.slice(0, 2)] : [[0, 0], [0, 0]],
            };
          }),
        },
        {
          name: '城市热度',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 3,
          rippleEffect: {
            period: 4,
            scale: 4,
            brushType: 'stroke',
          },
          symbolSize: (v: number[]) => 6 + v[2] / 10,
          itemStyle: {
            color: (p: any) => {
              const val = p.value[2];
              if (val > 85) return '#EF4444';
              if (val > 70) return '#FF6B1A';
              if (val > 55) return '#F59E0B';
              return '#3B82F6';
            },
            shadowBlur: 12,
            shadowColor: 'rgba(255,107,26,0.6)',
          },
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 10,
          },
          data: hotCities,
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick]
  );

  const trendOption = useMemo<EChartsOption>(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const gmv = [2.6, 2.9, 3.1, 2.85, 3.3, 3.05, 3.28];
    const orders = [8820, 9650, 10280, 9450, 11200, 10350, 11120];
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,35,66,0.95)',
        borderColor: 'rgba(255,107,26,0.3)',
        textStyle: { color: '#fff', fontSize: 12 },
        axisPointer: { type: 'cross', lineStyle: { color: 'rgba(255,107,26,0.3)' } },
      },
      legend: {
        data: ['GMV(百万元)', '订单数'],
        top: 0,
        right: 0,
        textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 4,
      },
      grid: { left: 50, right: 55, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: days,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'GMV',
          nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, formatter: '{value}M' },
        },
        {
          type: 'value',
          name: '订单',
          nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
          splitLine: { show: false },
          axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, formatter: (v) => (v / 1000).toFixed(1) + 'K' },
        },
      ],
      series: [
        {
          name: 'GMV(百万元)',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: gmv,
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#FF6B1A' },
                { offset: 1, color: '#FFB347' },
              ],
            },
            shadowBlur: 12,
            shadowColor: 'rgba(255,107,26,0.4)',
          },
          itemStyle: { color: '#FF6B1A', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,107,26,0.35)' },
                { offset: 1, color: 'rgba(255,107,26,0)' },
              ],
            },
          },
        },
        {
          name: '订单数',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: orders,
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#3B82F6' },
                { offset: 1, color: '#06B6D4' },
              ],
            },
            shadowBlur: 12,
            shadowColor: 'rgba(59,130,246,0.4)',
          },
          itemStyle: { color: '#3B82F6', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.25)' },
                { offset: 1, color: 'rgba(59,130,246,0)' },
              ],
            },
          },
        },
      ],
    };
  }, []);

  const rankOption = useMemo<EChartsOption>(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,35,66,0.95)',
      borderColor: 'rgba(255,107,26,0.3)',
      textStyle: { color: '#fff', fontSize: 12 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,107,26,0.08)' } },
      formatter: (params: any) => {
        const p = params[0];
        const d = topDrivers[p.dataIndex];
        return `<div class="font-bold text-primary-orange mb-1">${p.name}</div>
                <div class="text-white/70 text-xs">完成订单: <span class="text-info font-semibold">${d.orders}</span> 单</div>
                <div class="text-white/70 text-xs">GMV: <span class="text-primary-orange font-semibold">¥${(d.gmv / 10000).toFixed(1)}万</span></div>
                <div class="text-white/70 text-xs">信用分: <span class="text-success font-semibold">${d.score}</span></div>`;
      },
    },
    grid: { left: 70, right: 60, top: 10, bottom: 10 },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: topDrivers.map((d) => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        fontWeight: 500,
        formatter: (val: string, idx: number) =>
          idx < 3
            ? `{rank${idx}|${idx + 1}}  ${val}`
            : `  ${idx + 1}   ${val}`,
        rich: {
          rank0: { color: '#FF6B1A', fontWeight: 'bold', padding: [0, 4, 0, 0] },
          rank1: { color: '#9CA3AF', fontWeight: 'bold', padding: [0, 4, 0, 0] },
          rank2: { color: '#B45309', fontWeight: 'bold', padding: [0, 4, 0, 0] },
        },
      },
    },
    series: [
      {
        type: 'bar',
        data: topDrivers.map((d, i) => ({
          value: d.orders,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color:
                    i === 0 ? '#FF6B1A' : i === 1 ? '#6B7280' : i === 2 ? '#B45309' : 'rgba(59,130,246,0.7)',
                },
                {
                  offset: 1,
                  color:
                    i === 0 ? '#FFB347' : i === 1 ? '#9CA3AF' : i === 2 ? '#F59E0B' : '#06B6D4',
                },
              ],
            },
            shadowBlur: 10,
            shadowColor: i < 3 ? 'rgba(255,107,26,0.3)' : 'rgba(59,130,246,0.2)',
          },
        })),
        barWidth: 14,
        label: {
          show: true,
          position: 'right',
          color: 'rgba(255,255,255,0.75)',
          fontSize: 10,
          fontWeight: 600,
          formatter: (p: any) => `${p.value}单  ¥${(topDrivers[p.dataIndex].gmv / 10000).toFixed(1)}万`,
        },
      },
    ],
  }), []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-bold text-white m-0">运营数据驾驶舱</h1>
            <Badge
              dot
              status="processing"
              className="!-translate-y-0.5"
              color="#10B981"
              text={<span className="text-xs text-success ml-1">实时同步中</span>}
            />
          </div>
          <p className="text-sm text-white/50 m-0">
            货运撮合平台 · 运力金融 · 油站联盟全域数据监控
          </p>
        </div>
        <Space>
          <Segmented
            value={range}
            onChange={(v) => setRange(v as TimeRange)}
            options={[
              { label: '今日', value: '1day', icon: <Zap size={13} /> },
              { label: '近7天', value: '7day', icon: <Activity size={13} /> },
              { label: '近30天', value: '30day', icon: <TrendingUp size={13} /> },
            ]}
            className="!bg-white/5"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          />
          <Tooltip title="刷新数据">
            <Button
              type="text"
              icon={<RefreshCw size={16} className="text-white/70" />}
              className="!w-9 !h-9 hover:!bg-white/5 !rounded-lg"
            />
          </Tooltip>
          <Tooltip title="导出报表">
            <Button
              type="primary"
              icon={<Filter size={15} />}
              className="!bg-gradient-primary !border-0 !rounded-lg shadow-soft-orange"
            >
              数据导出
            </Button>
          </Tooltip>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((k, i) => (
          <KpiCard key={`${i}-${range}`} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 dashboard-panel" style={{ minHeight: 480 }}>
          <div className="dashboard-title">
            <MapPin size={16} className="text-primary-orange" />
            <span>全国运输热力图</span>
            <div className="ml-auto flex items-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                高热度（大于85）
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-orange" />
                中热度(70-85)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" />
                次热度(55-70)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-info" />
                一般热度
              </span>
            </div>
          </div>
          <div className="p-4" style={{ height: 420 }}>
            <ReactECharts
              option={mapOption}
              style={{ height: '100%' }}
              theme="dark"
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>

        <div className="dashboard-panel" style={{ minHeight: 480 }}>
          <div className="dashboard-title">
            <Trophy size={16} className="text-primary-orange" />
            <span>司机活跃度 TOP10</span>
            <Tag color="orange" className="ml-auto !rounded-md !text-xs">
              本周
            </Tag>
          </div>
          <div className="p-4" style={{ height: 420 }}>
            <ReactECharts
              option={rankOption}
              style={{ height: '100%' }}
              theme="dark"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 dashboard-panel" style={{ minHeight: 360 }}>
          <div className="dashboard-title">
            <TrendingUp size={16} className="text-primary-orange" />
            <span>核心指标趋势</span>
            <div className="ml-auto flex items-center gap-4 text-xs text-white/70 font-mono">
              <span>
                日均: <span className="text-primary-orange font-bold">¥3.02M</span>
              </span>
              <span>
                峰值: <span className="text-success font-bold">¥3.3M</span>
              </span>
              <span>
                订单: <span className="text-info font-bold">10,124/日</span>
              </span>
            </div>
          </div>
          <div className="p-4" style={{ height: 300 }}>
            <ReactECharts
              option={trendOption}
              style={{ height: '100%' }}
              theme="dark"
            />
          </div>
        </div>

        <div className="dashboard-panel" style={{ minHeight: 360 }}>
          <div className="dashboard-title">
            <AlertTriangle size={16} className="text-danger" />
            <span>异常事件实时流</span>
            <Badge
              count="LIVE"
              size="small"
              color="#EF4444"
              className="ml-auto"
              style={{ fontSize: 9 }}
            />
          </div>
          <div className="p-4 flex flex-col" style={{ height: 300 }}>
            <div
              className="mb-3 p-3 rounded-xl bg-gradient-to-r from-danger/15 to-warning/10 border border-danger/20"
              style={{
                animation: 'slideUp 0.4s ease-out',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      alerts[alarmIndex].level === 'danger'
                        ? 'bg-danger'
                        : alerts[alarmIndex].level === 'warning'
                        ? 'bg-warning'
                        : 'bg-info'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold uppercase ${
                      alerts[alarmIndex].level === 'danger'
                        ? 'text-danger'
                        : alerts[alarmIndex].level === 'warning'
                        ? 'text-warning'
                        : 'text-info'
                    }`}
                  >
                    {alerts[alarmIndex].level === 'danger'
                      ? '严重告警'
                      : alerts[alarmIndex].level === 'warning'
                      ? '提醒预警'
                      : '系统通知'}
                  </span>
                </div>
                <span className="text-[11px] text-white/50 font-mono">
                  {alerts[alarmIndex].time} · {alerts[alarmIndex].city}
                </span>
              </div>
              <p className="text-sm text-white/80 m-0 leading-relaxed">
                {alerts[alarmIndex].text}
              </p>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-auto space-y-2 pr-1 -mr-1"
            >
              {alerts.map((a, i) => (
                <div
                  key={a.id}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    i === alarmIndex
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            a.level === 'danger'
                              ? 'bg-danger'
                              : a.level === 'warning'
                              ? 'bg-warning'
                              : 'bg-info'
                          }`}
                        />
                        <span className="text-[10px] text-white/40 font-mono">
                          {a.time}
                        </span>
                        <Tag
                          className="!text-[10px] !h-4 !px-1.5 !m-0"
                          color={
                            a.level === 'danger'
                              ? 'red'
                              : a.level === 'warning'
                              ? 'orange'
                              : 'blue'
                          }
                        >
                          {a.city}
                        </Tag>
                      </div>
                      <p className="text-xs text-white/60 m-0 line-clamp-2 leading-snug">
                        {a.text}
                      </p>
                    </div>
                    <Progress
                      type="circle"
                      size={32}
                      percent={70 + i * 3}
                      width={32}
                      strokeWidth={4}
                      strokeColor={
                        a.level === 'danger'
                          ? '#EF4444'
                          : a.level === 'warning'
                          ? '#F59E0B'
                          : '#3B82F6'
                      }
                      format={() => ''}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
