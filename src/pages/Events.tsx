import { useEffect, useMemo, useState } from 'react';
import {
  Bell, Users, Home, Eye, UserCheck, Dog, Activity,
  CheckCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import type { AlertType, AlertEvent } from '@/types';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<AlertType, { label: string; color: string; icon: typeof Bell }> = {
  visitor: { label: '访客', color: '#00D4FF', icon: UserCheck },
  family: { label: '家人', color: '#2ED573', icon: Home },
  pet: { label: '宠物', color: '#FFA502', icon: Dog },
  motion: { label: '移动', color: '#1E90FF', icon: Activity },
};

const FILTERS: ('all' | AlertType)[] = ['all', 'visitor', 'family', 'pet', 'motion'];

function StatCard({ icon: Icon, value, label }: { icon: typeof Bell; value: number; label: string }) {
  return (
    <div className="glass-card rounded-xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-cyan-glow/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-cyan-glow" />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono gradient-text">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function TypeBar({ stats }: { stats: Record<AlertType, number> }) {
  const data = useMemo(
    () => (['visitor', 'family', 'pet', 'motion'] as AlertType[]).map((t) => ({
      name: TYPE_CONFIG[t].label,
      value: stats[t],
      fill: TYPE_CONFIG[t].color,
    })),
    [stats],
  );

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">事件类型分布</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#E2E8F0' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HourArea({ byHour }: { byHour: number[] }) {
  const data = useMemo(
    () => byHour.map((v, i) => ({ hour: `${i}`, value: v })),
    [byHour],
  );

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">24 小时分布</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
          <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#E2E8F0' }}
            labelFormatter={(l) => `${l}:00`}
          />
          <Area type="monotone" dataKey="value" stroke="#00D4FF" fill="url(#hourGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EventCard({ event, onRead, index }: { event: AlertEvent; onRead: () => void; index: number }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;
  const ts = new Date(event.timestamp);
  const time = `${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div
      onClick={onRead}
      className={cn(
        'glass-card rounded-xl p-4 cursor-pointer transition-all duration-300 animate-fade-in-up',
        !event.read && 'border-l-2 border-l-cyan-glow bg-deep-800/60',
        event.read && 'opacity-70 hover:opacity-90',
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cfg.color}18` }}>
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-xs text-slate-500 font-mono">{time}</span>
            <span className="text-xs font-mono ml-auto" style={{ color: cfg.color }}>
              {event.confidence}%
            </span>
          </div>
          <p className="text-sm text-slate-300 truncate">
            {event.description ?? `${cfg.label}检测 · 置信度 ${event.confidence}%`}
          </p>
        </div>

        <div className="w-14 h-14 rounded-lg bg-deep-900 flex items-center justify-center flex-shrink-0 border border-deep-700">
          <Eye className="w-5 h-5 text-slate-600" />
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const { alerts, alertStats, fetchAlerts, fetchAlertStats, markAlertRead, markAllAlertsRead } = useAppStore();
  const [filter, setFilter] = useState<'all' | AlertType>('all');

  useEffect(() => {
    fetchAlerts();
    fetchAlertStats();
  }, [fetchAlerts, fetchAlertStats]);

  const filtered = useMemo(
    () => (filter === 'all' ? alerts : alerts.filter((a) => a.type === filter)),
    [alerts, filter],
  );

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = { all: alerts.length };
    (['visitor', 'family', 'pet', 'motion'] as AlertType[]).forEach((t) => {
      m[t] = alerts.filter((a) => a.type === t).length;
    });
    return m;
  }, [alerts]);

  const stats = alertStats ?? { today: 0, week: 0, byType: { visitor: 0, family: 0, pet: 0, motion: 0 }, byHour: Array(24).fill(0) };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Bell className="w-5 h-5 text-cyan-glow" />
        侦测事件
      </h2>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Bell} value={stats.today} label="今日告警" />
        <StatCard icon={Activity} value={stats.week} label="本周告警" />
        <StatCard icon={Users} value={stats.byType.visitor} label="访客数" />
        <StatCard icon={Home} value={stats.byType.family} label="家人数" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TypeBar stats={stats.byType} />
        <HourArea byHour={stats.byHour} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const cfg = f === 'all' ? null : TYPE_CONFIG[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                active
                  ? 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow'
                  : 'border-deep-700 bg-deep-800 text-slate-400 hover:text-white hover:border-deep-600',
              )}
            >
              {cfg && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />}
              {f === 'all' ? '全部' : cfg!.label}
              <span className="font-mono text-[10px] opacity-70">{typeCounts[f]}</span>
            </button>
          );
        })}
        <button
          onClick={markAllAlertsRead}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-deep-700 bg-deep-800 text-slate-400 hover:text-white hover:border-accent-success/40 transition-all"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          全部已读
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center text-slate-500 text-sm">
            暂无侦测事件
          </div>
        )}
        {filtered.map((ev, i) => (
          <EventCard key={ev.id} event={ev} onRead={() => markAlertRead(ev.id)} index={i} />
        ))}
      </div>
    </div>
  );
}
