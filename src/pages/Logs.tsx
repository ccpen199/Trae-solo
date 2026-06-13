import { useEffect, useMemo, useState } from 'react';
import {
  Phone, PhoneIncoming, PhoneOutgoing, Moon, Sun, Eye,
  Mic, Volume2, Clock, Star,
} from 'lucide-react';
import { logApi } from '@/services/api';
import type { NightVisionLog, CallRecord } from '@/types';
import { cn } from '@/lib/utils';

type Tab = 'calls' | 'nightvision';
type CallDir = 'all' | 'incoming' | 'outgoing';
type NvEvent = 'all' | 'ir_on' | 'ir_off' | 'exposure_adjust';

const NV_CONFIG: Record<NightVisionLog['event'], { label: string; color: string }> = {
  ir_on: { label: 'IR ON', color: '#00D4FF' },
  ir_off: { label: 'IR OFF', color: '#64748B' },
  exposure_adjust: { label: '曝光调整', color: '#FFA502' },
};

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function QualityStars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn('w-3 h-3', i <= value ? 'fill-cyan-glow text-cyan-glow' : 'text-deep-600')}
        />
      ))}
    </span>
  );
}

function LuxBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 500) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 rounded-full bg-deep-700 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #1C3456 ${pct * 0.3}%, #00D4FF ${pct}%)`,
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-400">{value} lx</span>
    </div>
  );
}

function Badge({ active, label, icon: Icon }: { active: boolean; label: string; icon: typeof Mic }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
        active
          ? 'border-accent-success/30 bg-accent-success/10 text-accent-success'
          : 'border-deep-600 bg-deep-800 text-slate-600 line-through',
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

export default function Logs() {
  const [activeTab, setActiveTab] = useState<Tab>('calls');
  const [callFilter, setCallFilter] = useState<CallDir>('all');
  const [nvFilter, setNvFilter] = useState<NvEvent>('all');
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [nvLogs, setNvLogs] = useState<NightVisionLog[]>([]);

  useEffect(() => {
    logApi.getCallRecords().then(setCalls).catch(() => {});
    logApi.getNightVisionLogs().then(setNvLogs).catch(() => {});
  }, []);

  const filteredCalls = useMemo(
    () => (callFilter === 'all' ? calls : calls.filter((c) => c.direction === callFilter)),
    [calls, callFilter],
  );

  const filteredNv = useMemo(
    () => (nvFilter === 'all' ? nvLogs : nvLogs.filter((n) => n.event === nvFilter)),
    [nvLogs, nvFilter],
  );

  const avgDur = useMemo(() => {
    if (!calls.length) return '00:00';
    return fmtDuration(Math.round(calls.reduce((s, c) => s + c.duration, 0) / calls.length));
  }, [calls]);

  const avgQual = useMemo(() => {
    if (!calls.length) return 0;
    return +(calls.reduce((s, c) => s + c.quality, 0) / calls.length).toFixed(1);
  }, [calls]);

  const callDirs: { key: CallDir; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'incoming', label: '来电' },
    { key: 'outgoing', label: '去电' },
  ];

  const nvFilters: { key: NvEvent; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'ir_on', label: 'IR ON' },
    { key: 'ir_off', label: 'IR OFF' },
    { key: 'exposure_adjust', label: '曝光调整' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Eye className="w-5 h-5 text-cyan-glow" />
        通话记录 & 夜视日志
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-deep-800/60 border border-deep-700 w-fit">
        {([
          { key: 'calls' as Tab, label: '通话记录', icon: Phone },
          { key: 'nightvision' as Tab, label: '夜视日志', icon: Moon },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all relative',
              activeTab === key
                ? 'text-cyan-glow bg-deep-900 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {activeTab === key && (
              <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cyan-glow shadow-glow-cyan" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'calls' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Phone, value: calls.length, label: '总通话数' },
              { icon: Clock, value: avgDur, label: '平均时长' },
              { icon: Star, value: avgQual, label: '平均质量' },
            ].map(({ icon: Ic, value, label }) => (
              <div key={label} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-glow/10 flex items-center justify-center">
                  <Ic className="w-4 h-4 text-cyan-glow" />
                </div>
                <div>
                  <p className="text-lg font-bold font-mono gradient-text">{value}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {callDirs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCallFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  callFilter === key
                    ? 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow'
                    : 'border-deep-700 bg-deep-800 text-slate-400 hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Call list */}
          <div className="space-y-2">
            {filteredCalls.length === 0 && (
              <div className="glass-card rounded-xl p-10 text-center text-slate-500 text-sm">
                暂无通话记录
              </div>
            )}
            {filteredCalls.map((c) => {
              const isIn = c.direction === 'incoming';
              const DirIcon = isIn ? PhoneIncoming : PhoneOutgoing;
              const ts = new Date(c.startTime);
              const time = ts.toLocaleString('zh-CN', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
              });
              return (
                <div
                  key={c.id}
                  className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-cyan-glow/20 transition-all"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      isIn ? 'bg-accent-success/10' : 'bg-accent-info/10',
                    )}
                  >
                    <DirIcon
                      className={cn('w-4 h-4', isIn ? 'text-accent-success' : 'text-accent-info')}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono w-28">{time}</span>
                  <span className="text-sm font-mono font-semibold text-white">
                    {fmtDuration(c.duration)}
                  </span>
                  <QualityStars value={c.quality} />
                  <div className="ml-auto flex gap-1.5">
                    <Badge active={c.noiseReduction} label="降噪" icon={Mic} />
                    <Badge active={c.echoCancellation} label="回声消除" icon={Volume2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'nightvision' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {nvFilters.map(({ key, label }) => {
              const cfg = key === 'all' ? null : NV_CONFIG[key as NightVisionLog['event']];
              return (
                <button
                  key={key}
                  onClick={() => setNvFilter(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    nvFilter === key
                      ? 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow'
                      : 'border-deep-700 bg-deep-800 text-slate-400 hover:text-white',
                  )}
                >
                  {cfg && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="relative space-y-0">
            {filteredNv.length === 0 && (
              <div className="glass-card rounded-xl p-10 text-center text-slate-500 text-sm">
                暂无夜视日志
              </div>
            )}
            {filteredNv.map((log, i) => {
              const cfg = NV_CONFIG[log.event];
              const ts = new Date(log.timestamp);
              const time = ts.toLocaleString('zh-CN', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
              });
              return (
                <div key={log.id} className="relative flex gap-4 pb-4">
                  {/* Timeline line */}
                  {i < filteredNv.length - 1 && (
                    <div className="absolute left-[17px] top-9 bottom-0 w-px bg-deep-700" />
                  )}
                  {/* Dot */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 border"
                    style={{ backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}40` }}
                  >
                    {log.event === 'ir_on' ? (
                      <Moon className="w-4 h-4" style={{ color: cfg.color }} />
                    ) : log.event === 'ir_off' ? (
                      <Sun className="w-4 h-4" style={{ color: cfg.color }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: cfg.color }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="glass-card rounded-xl p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{time}</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">光照</span>
                        <LuxBar value={log.lightLevel} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">曝光补偿</span>
                        <span
                          className={cn(
                            'font-mono font-semibold',
                            log.exposureCompensation > 0
                              ? 'text-accent-warning'
                              : log.exposureCompensation < 0
                                ? 'text-accent-info'
                                : 'text-slate-400',
                          )}
                        >
                          {log.exposureCompensation > 0 ? '+' : ''}
                          {log.exposureCompensation} EV
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{log.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
