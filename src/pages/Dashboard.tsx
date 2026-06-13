import { useEffect, useMemo } from 'react';
import {
  Wifi,
  Bell,
  HardDrive,
  Battery,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import type { AlertStats } from '@/types';

function useDashboardData() {
  const currentDevice = useAppStore((s) => s.currentDevice);
  const devices = useAppStore((s) => s.devices);
  const signalHistory = useAppStore((s) => s.signalHistory);
  const batteryTrend = useAppStore((s) => s.batteryTrend);
  const alertStats = useAppStore((s) => s.alertStats);
  const fetchSignalHistory = useAppStore((s) => s.fetchSignalHistory);
  const fetchBatteryTrend = useAppStore((s) => s.fetchBatteryTrend);

  useEffect(() => {
    if (currentDevice) {
      fetchSignalHistory(currentDevice.deviceId);
      fetchBatteryTrend(currentDevice.deviceId);
    }
  }, [currentDevice, fetchSignalHistory, fetchBatteryTrend]);

  return { currentDevice, devices, signalHistory, batteryTrend, alertStats };
}

function OverviewCards({
  onlineCount,
  alertStats,
  storagePercent,
  batteryHealth,
}: {
  onlineCount: number;
  alertStats: AlertStats | null;
  storagePercent: number;
  batteryHealth: number;
}) {
  const cards = [
    {
      label: '在线设备',
      value: onlineCount,
      icon: Wifi,
      accent: 'text-accent-success',
      glow: 'shadow-glow-success',
      extra: <span className="status-dot online animate-pulse-slow ml-2" />,
    },
    {
      label: '今日告警',
      value: alertStats?.today ?? 0,
      icon: Bell,
      accent: (alertStats?.today ?? 0) > 0 ? 'text-accent-danger' : 'text-accent-success',
      glow: (alertStats?.today ?? 0) > 0 ? 'shadow-glow-danger' : 'shadow-glow-success',
    },
    {
      label: '存储使用',
      value: `${storagePercent}%`,
      icon: HardDrive,
      accent: storagePercent > 90 ? 'text-accent-danger' : storagePercent > 70 ? 'text-accent-warning' : 'text-cyan-glow',
      glow: storagePercent > 90 ? 'shadow-glow-danger' : '',
      extra: (
        <div className="mt-2 h-1.5 w-full rounded-full bg-deep-800 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              storagePercent > 90 ? 'bg-accent-danger' : storagePercent > 70 ? 'bg-accent-warning' : 'bg-cyan-glow'
            )}
            style={{ width: `${storagePercent}%` }}
          />
        </div>
      ),
    },
    {
      label: '电池健康',
      value: `${batteryHealth}%`,
      icon: Battery,
      accent: batteryHealth > 80 ? 'text-accent-success' : batteryHealth > 60 ? 'text-accent-warning' : 'text-accent-danger',
      glow: batteryHealth > 80 ? 'shadow-glow-success' : '',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={cn(
            'glass-card hud-corner rounded-xl p-5 animate-fade-in-up opacity-0',
            card.glow
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {card.label}
            </span>
            <card.icon className={cn('w-4 h-4', card.accent)} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-3xl font-bold font-mono', card.accent)}>
              {card.value}
            </span>
            {card.extra}
          </div>
        </div>
      ))}
    </div>
  );
}

const CustomTooltipStyle: React.CSSProperties = {
  background: 'rgba(10, 22, 40, 0.95)',
  border: '1px solid rgba(0, 212, 255, 0.2)',
  borderRadius: '8px',
  padding: '8px 12px',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
};

function SignalChart({ data }: { data: { timestamp: string; value: number }[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: new Date(d.timestamp).toLocaleDateString('zh-CN', { weekday: 'short' }),
      })),
    [data]
  );

  return (
    <div className="glass-card hud-corner rounded-xl p-5 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms' }}>
      <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">
        信号强度趋势
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="signalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(0,212,255,0.15)' }}
              tickLine={false}
            />
            <YAxis
              domain={[-95, -40]}
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(0,212,255,0.15)' }}
              tickLine={false}
              unit=" dBm"
            />
            <Tooltip
              contentStyle={CustomTooltipStyle}
              labelStyle={{ color: '#00D4FF', fontFamily: 'JetBrains Mono', fontSize: 12 }}
              itemStyle={{ color: '#E2E8F0', fontFamily: 'JetBrains Mono', fontSize: 12 }}
              formatter={(v: number) => [`${v} dBm`, '信号强度']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00D4FF"
              strokeWidth={2}
              fill="url(#signalGradient)"
              dot={false}
              activeDot={{ fill: '#00D4FF', r: 5, stroke: '#050A14', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const PIE_COLORS = ['#00D4FF', '#0F1F38'];

function StorageMonitor({ used, total }: { used: number; total: number }) {
  const free = total - used;
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  const pieData = [
    { name: '已用', value: used },
    { name: '可用', value: free },
  ];

  return (
    <div className="glass-card hud-corner rounded-xl p-5 animate-fade-in-up opacity-0" style={{ animationDelay: '500ms' }}>
      <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">
        存储监控
      </h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <p className="font-mono text-3xl font-bold text-cyan-glow">{percent}%</p>
            <p className="text-xs text-slate-400 font-mono mt-1">存储已用</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">已用</span>
              <span className="text-cyan-glow">{used.toFixed(1)} GB</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">可用</span>
              <span className="text-slate-300">{free.toFixed(1)} GB</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">总计</span>
              <span className="text-slate-300">{total.toFixed(1)} GB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BatteryChart({ data }: { data: { date: string; capacity: number }[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: d.date.slice(5),
      })),
    [data]
  );

  return (
    <div className="glass-card hud-corner rounded-xl p-5 animate-fade-in-up opacity-0" style={{ animationDelay: '600ms' }}>
      <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">
        电池衰减趋势
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(0,212,255,0.15)' }}
              tickLine={false}
              interval={4}
            />
            <YAxis
              domain={[40, 100]}
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(0,212,255,0.15)' }}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={CustomTooltipStyle}
              labelStyle={{ color: '#00D4FF', fontFamily: 'JetBrains Mono', fontSize: 12 }}
              itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}
              formatter={(v: number) => [
                `${v}%`,
                `容量 ${v > 80 ? '●' : v > 60 ? '●' : '●'}`,
              ]}
            />
            <ReferenceLine
              y={80}
              stroke="#FFA502"
              strokeDasharray="6 4"
              strokeWidth={1}
              label={{
                value: '80% 阈值',
                position: 'right',
                fill: '#FFA502',
                fontSize: 10,
                fontFamily: 'JetBrains Mono',
              }}
            />
            <Line
              type="monotone"
              dataKey="capacity"
              stroke="#2ED573"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#2ED573', stroke: '#050A14', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1.5 text-xs font-mono text-accent-success">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-success" /> &gt; 80%
        </span>
        <span className="flex items-center gap-1.5 text-xs font-mono text-accent-warning">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-warning" /> 60-80%
        </span>
        <span className="flex items-center gap-1.5 text-xs font-mono text-accent-danger">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-danger" /> &lt; 60%
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentDevice, devices, signalHistory, batteryTrend, alertStats } = useDashboardData();

  const onlineCount = devices.filter((d) => d.online).length;
  const storagePercent =
    currentDevice && currentDevice.storageTotal > 0
      ? Math.round((currentDevice.storageUsed / currentDevice.storageTotal) * 100)
      : 0;
  const batteryHealth = currentDevice?.batteryHealth ?? 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up opacity-0">
        <h1 className="text-2xl font-bold font-display gradient-text">设备健康看板</h1>
        <p className="text-sm text-slate-400 font-mono mt-1">
          {currentDevice ? currentDevice.deviceName : '暂无设备'}
        </p>
      </div>

      <OverviewCards
        onlineCount={onlineCount}
        alertStats={alertStats}
        storagePercent={storagePercent}
        batteryHealth={batteryHealth}
      />

      <div className="grid grid-cols-2 gap-4">
        <SignalChart data={signalHistory} />
        <StorageMonitor
          used={currentDevice?.storageUsed ?? 0}
          total={currentDevice?.storageTotal ?? 0}
        />
      </div>

      <BatteryChart data={batteryTrend} />
    </div>
  );
}
