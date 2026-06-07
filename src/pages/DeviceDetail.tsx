import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Thermometer, Cpu, Wifi, Activity } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { DeviceStatusBadge, P2PStatusBadge, ProtocolBadge } from '@/components/Badges';
import { formatDateTime } from '@/lib/utils';
import type { Device } from '@/types';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [health, setHealth] = useState<{ cpu: number; temperature: number; networkLatency: number; uptime: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{ time: string; cpu: number; temp: number; lat: number }[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchData = () => {
      setLoading(true);
      Promise.all([
        api.get(`/devices/${id}`),
        api.get(`/devices/${id}/health`),
      ]).then(([r1, r2]) => {
        if (r1.data.success) setDevice(r1.data.device);
        if (r2.data.success) {
          setHealth(r2.data);
          const now = new Date();
          const hist: typeof history = [];
          for (let i = 11; i >= 0; i--) {
            const t = new Date(now.getTime() - i * 5000);
            hist.push({
              time: `${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`,
              cpu: 20 + Math.random() * 30 + (i > 6 ? 15 : 0),
              temp: 35 + Math.random() * 15,
              lat: 10 + Math.random() * 30,
            });
          }
          setHistory(hist);
        }
      }).finally(() => setLoading(false));
    };
    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, [id]);

  const formatUptime = (sec: number) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${d}天 ${h}小时 ${m}分钟`;
  };

  const gaugePct = health ? Math.min(100, (health.cpu + health.temperature / 2) / 2) : 0;

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title={device?.name || '设备详情'}
        subtitle={`设备ID: ${device?.device_id || '-'}`}
        breadcrumbs={[
          { label: '设备管理', path: '/devices' },
          { label: device?.name || '详情' }
        ]}
        actions={
          <Link to="/devices" className="vms-btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-vms-primary border-t-transparent rounded-full" />
        </div>
      ) : device && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-5">
            <div className="vms-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white font-mono">设备状态</h3>
                <DeviceStatusBadge status={device.status} />
              </div>
              <div className="relative w-full aspect-square max-w-[240px] mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#343c54" strokeWidth="8" fill="none" />
                  <circle
                    cx="50" cy="50" r="42"
                    stroke="#3b82f6" strokeWidth="8" fill="none"
                    strokeDasharray={`${gaugePct * 2.64} 264`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold font-mono text-white">{health?.cpu.toFixed(1) || 0}%</div>
                  <div className="text-xs text-vms-text-muted mt-1">CPU 使用率</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-vms-surface-2 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-vms-text-muted text-xs mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-red-400" /> 温度
                  </div>
                  <div className="text-lg font-semibold text-white font-mono">{health?.temperature.toFixed(1) || 0}°C</div>
                </div>
                <div className="bg-vms-surface-2 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-vms-text-muted text-xs mb-1">
                    <Wifi className="w-3.5 h-3.5 text-green-400" /> 延迟
                  </div>
                  <div className="text-lg font-semibold text-white font-mono">{health?.networkLatency || 0} ms</div>
                </div>
              </div>
              <div className="mt-3 bg-vms-surface-2 rounded-lg p-3">
                <div className="flex items-center gap-2 text-vms-text-muted text-xs mb-1">
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> 运行时间
                </div>
                <div className="text-sm font-semibold text-white font-mono">{formatUptime(health?.uptime || 0)}</div>
              </div>
            </div>

            <div className="vms-card p-5">
              <h3 className="font-semibold text-white font-mono mb-4">基本信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">设备名称</span>
                  <span className="text-vms-text">{device.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">设备ID</span>
                  <span className="font-mono text-vms-text">{device.device_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">接入协议</span>
                  <ProtocolBadge status={device.protocol} />
                </div>
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">P2P 状态</span>
                  <P2PStatusBadge status={device.p2p_status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">IP 地址</span>
                  <span className="font-mono text-vms-text">{device.ip}:{device.port || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">所属组织</span>
                  <span className="text-vms-text">{device.org_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">固件版本</span>
                  <span className="font-mono text-vms-text">{device.firmware_version || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vms-text-muted">最后心跳</span>
                  <span className="text-vms-text text-xs">{formatDateTime(device.last_heartbeat)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="vms-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white font-mono">实时视频流</h3>
                <P2PStatusBadge status={device.p2p_status} />
              </div>
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-vms-border">
                <div className="absolute inset-0 bg-vms-grid bg-vms-grid opacity-30" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-vms-surface/80 flex items-center justify-center mb-3">
                    <div className="w-8 h-8 border-4 border-vms-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-sm text-vms-text-muted">P2P 连接中...</div>
                  <div className="text-xs text-vms-text-muted mt-1 font-mono">设备: {device.device_id}</div>
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-white font-medium">LIVE</span>
                </div>
                <div className="absolute bottom-3 left-3 text-xs text-white/80 font-mono">
                  {formatDateTime(new Date().toISOString())}
                </div>
                <div className="absolute bottom-3 right-3 text-xs text-white/80 font-mono">
                  1080P · 25fps · 4Mbps
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="vms-card p-5">
                <div className="flex items-center gap-2 text-vms-text-muted text-xs mb-3">
                  <Cpu className="w-4 h-4" /> CPU 趋势
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={1.5} fill="url(#cpuGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="vms-card p-5">
                <div className="flex items-center gap-2 text-vms-text-muted text-xs mb-3">
                  <Thermometer className="w-4 h-4 text-red-400" /> 温度趋势
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={1.5} fill="url(#tempGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="vms-card p-5">
                <div className="flex items-center gap-2 text-vms-text-muted text-xs mb-3">
                  <Wifi className="w-4 h-4 text-green-400" /> 网络延迟
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="lat" stroke="#10b981" strokeWidth={1.5} fill="url(#latGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
