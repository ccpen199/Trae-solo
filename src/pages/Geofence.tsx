import { useState, useEffect } from 'react';
import { MapPin, Home, Bell, Shield, Circle, Radius } from 'lucide-react';
import { geofenceApi } from '@/services/api';
import type { GeofenceConfig } from '@/types';
import { cn } from '@/lib/utils';

const DEFAULT_CONFIG: GeofenceConfig = {
  enabled: true,
  homeAddress: '北京市朝阳区建国路88号',
  latitude: 39.9042,
  longitude: 116.4074,
  radius: 3000,
  enterAction: 'silent',
  exitAction: 'notify',
};

const ENTER_OPTIONS = [
  { value: 'silent', label: '静默', icon: Circle, desc: '进入围栏无操作' },
  { value: 'notify', label: '通知', icon: Bell, desc: '发送推送通知' },
  { value: 'disarm', label: '撤防', icon: Shield, desc: '自动撤除安防' },
] as const;

const EXIT_OPTIONS = [
  { value: 'notify', label: '通知', icon: Bell, desc: '发送推送通知' },
  { value: 'arm', label: '布防', icon: Shield, desc: '自动启动安防' },
  { value: 'ignore', label: '忽略', icon: Circle, desc: '离开围栏无操作' },
] as const;

export default function Geofence() {
  const [config, setConfig] = useState<GeofenceConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    geofenceApi.getConfig().then(setConfig).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await geofenceApi.updateConfig(config);
      setConfig(updated);
    } catch {}
    setSaving(false);
  };

  const update = <K extends keyof GeofenceConfig>(key: K, value: GeofenceConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const circleSizes = [1, 2, 3].map((km) => ({
    km,
    size: (km * 1000 / config.radius) * 100,
  }));

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up opacity-0">
        <h1 className="text-2xl font-bold font-display gradient-text">地理围栏设置</h1>
        <p className="text-sm text-slate-400 font-mono mt-1">基于位置的安全自动化规则</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glass-card hud-corner rounded-xl p-6 animate-fade-in-up opacity-0" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">地图视图</h3>
          <div className="relative w-full h-80 bg-deep-950 rounded-lg border border-deep-700 overflow-hidden grid-bg">
            {circleSizes.map(({ km, size }) => (
              <div
                key={km}
                className="absolute rounded-full border border-cyan-glow/20"
                style={{
                  width: `${size * 2}%`,
                  height: `${size * 2}%`,
                  top: `${50 - size}%`,
                  left: `${50 - size}%`,
                }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-cyan-glow/60 whitespace-nowrap">
                  {km}km
                </span>
              </div>
            ))}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <Home className="w-6 h-6 text-cyan-glow" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-glow/30 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-glow/50 rounded-full" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <MapPin className="w-3 h-3 text-cyan-glow" />
              <span>{config.latitude.toFixed(4)}, {config.longitude.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card hud-corner rounded-xl p-5 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400">围栏配置</h3>
              <button
                onClick={() => update('enabled', !config.enabled)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  config.enabled ? 'bg-cyan-glow/80' : 'bg-deep-700'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    config.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">家庭地址</label>
                <input
                  value={config.homeAddress}
                  onChange={(e) => update('homeAddress', e.target.value)}
                  className="w-full bg-deep-900 border border-deep-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-glow/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">
                  半径: <span className="text-cyan-glow font-mono">{(config.radius / 1000).toFixed(1)}km</span>
                </label>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={500}
                  value={config.radius}
                  onChange={(e) => update('radius', Number(e.target.value))}
                  className="w-full accent-cyan-glow"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>0.5km</span><span>5km</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-deep-900 rounded-lg px-3 py-2">
                  <span className="text-[10px] font-mono text-slate-500 block">LAT</span>
                  <span className="text-xs font-mono text-slate-300">{config.latitude.toFixed(4)}</span>
                </div>
                <div className="bg-deep-900 rounded-lg px-3 py-2">
                  <span className="text-[10px] font-mono text-slate-500 block">LNG</span>
                  <span className="text-xs font-mono text-slate-300">{config.longitude.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card hud-corner rounded-xl p-5 animate-fade-in-up opacity-0" style={{ animationDelay: '300ms' }}>
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-3">状态</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">状态</span>
                <span className={cn('flex items-center gap-1.5 text-xs font-mono', config.enabled ? 'text-accent-success' : 'text-slate-500')}>
                  <span className={cn('status-dot', config.enabled ? 'online' : 'offline')} />
                  {config.enabled ? '已启用' : '已禁用'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">距离</span>
                <span className="text-xs font-mono text-cyan-glow">1.2 km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">最近触发</span>
                <span className="text-xs font-mono text-slate-300">今天 14:32</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms' }}>
        {([
          { title: '进入围栏时', action: config.enterAction as string, key: 'enterAction' as const, options: ENTER_OPTIONS },
          { title: '离开围栏时', action: config.exitAction as string, key: 'exitAction' as const, options: EXIT_OPTIONS },
        ]).map(({ title, action, key, options }) => (
          <div key={key} className="glass-card hud-corner rounded-xl p-5">
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-3">{title}</h3>
            <div className="space-y-2">
              {options.map((opt) => {
                const Icon = opt.icon;
                const active = action === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update(key, opt.value as GeofenceConfig[typeof key])}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-left',
                      active
                        ? 'bg-cyan-glow/10 border border-cyan-glow/30'
                        : 'bg-deep-900 border border-deep-700 hover:border-deep-600'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-cyan-glow' : 'text-slate-500')} />
                    <div className="flex-1 min-w-0">
                      <div className={cn('text-sm', active ? 'text-cyan-glow' : 'text-slate-300')}>{opt.label}</div>
                      <div className="text-[10px] font-mono text-slate-500">{opt.desc}</div>
                    </div>
                    {active && <Radius className="w-3.5 h-3.5 text-cyan-glow" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end animate-fade-in-up opacity-0" style={{ animationDelay: '500ms' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'px-6 py-2.5 rounded-lg font-mono text-sm transition-all',
            'bg-cyan-glow/20 border border-cyan-glow/40 text-cyan-glow',
            'hover:bg-cyan-glow/30 hover:shadow-glow-cyan',
            saving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
