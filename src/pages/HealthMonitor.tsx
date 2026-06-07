import { useEffect, useState } from 'react';
import { Cpu, Thermometer, Wifi, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { DeviceStatusBadge } from '@/components/Badges';
import type { DeviceHealth } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';

export default function HealthMonitor() {
  const [devices, setDevices] = useState<DeviceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get('/settings/health')
      .then(res => {
        if (res.data.success) {
          setDevices(res.data.devices);
          setLastUpdate(new Date().toISOString());
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '设备健康 - 云瞳视频监控';
    fetchData();
    const t = setInterval(fetchData, 8000);
    return () => clearInterval(t);
  }, []);

  const getProgressColor = (val: number, thresholds: [number, number]) => {
    if (val < thresholds[0]) return 'bg-emerald-500';
    if (val < thresholds[1]) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="设备健康监测"
        subtitle={`共 ${devices.length} 台设备的 CPU、温度、网络延迟实时监测，自动刷新中`}
        breadcrumbs={[{ label: '系统设置' }, { label: '设备健康' }]}
        actions={
          <button onClick={fetchData} className="vms-btn-secondary flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> 刷新
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="vms-card p-4 animate-pulse">
              <div className="h-5 bg-vms-surface-2 rounded w-3/4 mb-3" />
              <div className="space-y-3">
                <div className="h-4 bg-vms-surface-2 rounded w-full" />
                <div className="h-4 bg-vms-surface-2 rounded w-2/3" />
                <div className="h-4 bg-vms-surface-2 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : (
          devices.map(d => {
            const cpu = d.cpu_usage;
            const temp = d.temperature;
            const lat = d.network_latency;
            const isWarn = cpu > 70 || temp > 65 || lat > 100;
            return (
              <div key={d.id} className={cn("vms-card p-4 transition-all", isWarn && "border-amber-500/50")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="font-medium text-white text-sm truncate">{(d as any).device_name}</div>
                  <DeviceStatusBadge status={(d as any).status || 'online'} className="text-[10px]" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-vms-text-muted">
                        <Cpu className="w-3.5 h-3.5" /> CPU
                      </span>
                      <span className="font-mono text-vms-text">{cpu.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-vms-surface-2 rounded-full overflow-hidden">
                      <div className={cn("h-full", getProgressColor(cpu, [50, 75]))} style={{ width: `${Math.min(100, cpu)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-vms-text-muted">
                        <Thermometer className="w-3.5 h-3.5 text-red-400" /> 温度
                      </span>
                      <span className="font-mono text-vms-text">{temp.toFixed(1)}°C</span>
                    </div>
                    <div className="h-1.5 bg-vms-surface-2 rounded-full overflow-hidden">
                      <div className={cn("h-full", getProgressColor(temp, [45, 60]))} style={{ width: `${Math.min(100, temp / 0.8)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-vms-text-muted">
                        <Wifi className="w-3.5 h-3.5 text-green-400" /> 延迟
                      </span>
                      <span className="font-mono text-vms-text">{lat} ms</span>
                    </div>
                    <div className="h-1.5 bg-vms-surface-2 rounded-full overflow-hidden">
                      <div className={cn("h-full", getProgressColor(lat, [50, 100]))} style={{ width: `${Math.min(100, lat / 2)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-vms-border/50 text-[11px] text-vms-text-muted">
                  {formatDateTime(d.recorded_at)}
                </div>
              </div>
            );
          })
        )}
        {!loading && devices.length === 0 && (
          <div className="col-span-full vms-card p-12 text-center text-vms-text-muted">
            暂无设备健康数据
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-vms-text-muted text-right">
        最后更新: {formatDateTime(lastUpdate)} · 每 8 秒自动刷新
      </div>
    </div>
  );
}
