import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, useMap } from 'react-leaflet';
import { Car, WifiOff, Bell, Clock, ChevronLeft, ChevronRight, Route, Eye, Radio, Server, Archive, RefreshCw, Cpu, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import VehicleMarker from '@/components/VehicleMarker';
import MapTileLayer from '@/components/MapTileLayer';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useAlertStore } from '@/stores/alertStore';
import { useWsStore } from '@/stores/wsStore';
import type { Vehicle } from '@/stores/vehicleStore';
import type { Alert } from '@/stores/alertStore';
import { api } from '@/utils/api';

const BEIJING: [number, number] = [39.9042, 116.4074];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  online: { label: '在线', color: 'bg-success text-success' },
  offline: { label: '离线', color: 'bg-gray-500 text-gray-500' },
  alarm: { label: '告警', color: 'bg-danger text-danger' },
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  fence_violation: '🚧', overspeed: '⚡', abnormal_stop: '🅿️',
  fatigue: '😴', harsh_accel: '🚀', harsh_brake: '🔴',
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  fence_violation: '围栏告警', overspeed: '超速告警', abnormal_stop: '异常停车',
  fatigue: '疲劳驾驶', harsh_accel: '急加速', harsh_brake: '急刹车',
};

const ALERT_LEVEL_STYLES: Record<string, string> = {
  critical: 'bg-danger/10 text-danger border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
};

const ALERT_LEVEL_LABELS: Record<string, string> = { critical: '紧急', warning: '警告', info: '提示' };

const ALERT_STATUS_LABELS: Record<string, string> = {
  pending: '待处理', acknowledged: '已确认', resolved: '已解决', dismissed: '已忽略',
};

interface SystemStatus {
  connectedTerminals: number;
  totalTerminals: number;
  messageQueueDepth: number;
  protocolBreakdown: { jtt808: number; gbt35658: number };
  reconnection: { offlineCount: number; upgradingCount: number; reconnectionRate: number; recentlyReconnected: number };
  archive: { lastArchiveTime: string; archivedMonths: number; todayDataPoints: number };
  vehicles: { online: number; offline: number; alarm: number };
  uptime: { seconds: number; formatted: string };
}

function MapUpdater() {
  const map = useMap();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (vehicles.length > 0 && prevCountRef.current === 0) {
      const bounds = vehicles
        .filter((v) => v.status !== 'offline')
        .map((v) => [v.lat, v.lng] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    prevCountRef.current = vehicles.length;
  }, [vehicles, map]);

  return null;
}

export default function Dashboard() {
  const { vehicles, total, fetchVehicles } = useVehicleStore();
  const { alerts, total: alertTotal, fetchAlerts, processAlert } = useAlertStore();
  const { connect, disconnect, connected, protocolStats, archiveStats, messageQueue, reconnectAttempts } = useWsStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [alertPage, setAlertPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchVehicles({ page: 1, pageSize: 100 });
    fetchAlerts({ page: 1, pageSize: 50, startTime: new Date(new Date().setHours(0, 0, 0, 0)).toISOString() });
    connect();
    api.get<SystemStatus>('/api/system/status').then(setSysStatus).catch(() => {});
    const interval = setInterval(() => {
      api.get<SystemStatus>('/api/system/status').then(setSysStatus).catch(() => {});
    }, 30000);
    return () => { disconnect(); clearInterval(interval); };
  }, [fetchVehicles, fetchAlerts, connect, disconnect]);

  const onlineCount = vehicles.filter((v) => v.status === 'online').length;
  const offlineCount = vehicles.filter((v) => v.status === 'offline').length;
  const onTimeRate = total > 0 ? Math.round(((total - offlineCount) / total) * 1000) / 10 : 0;

  const totalPages = Math.ceil(total / pageSize);
  const pagedVehicles = vehicles.slice((page - 1) * pageSize, page * pageSize);

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const alertPageSize = 3;
  const alertTotalPages = Math.ceil(pendingAlerts.length / alertPageSize);
  const visibleAlerts = pendingAlerts.slice(alertPage * alertPageSize, (alertPage + 1) * alertPageSize);

  const handleVehicleClick = (v: Vehicle) => {
    navigate(`/monitor?vehicleId=${v.id}`);
  };

  const handleAlertAck = async (e: React.MouseEvent, alertId: number) => {
    e.stopPropagation();
    try {
      await processAlert(alertId, 'acknowledge');
    } catch {}
  };

  const handleAlertNav = (alert: Alert) => {
    navigate(`/alerts?highlight=${alert.id}`);
  };

  const pendingQueue = messageQueue.filter((m) => m.status === 'pending').length;
  const failedQueue = messageQueue.filter((m) => m.status === 'failed').length;
  const jtt = sysStatus?.protocolBreakdown.jtt808 ?? protocolStats.jtt808;
  const gbt = sysStatus?.protocolBreakdown.gbt35658 ?? protocolStats.gbt35658;

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<Car size={24} />} label="在线车辆" value={onlineCount} color="success" suffix="辆" />
        <StatCard icon={<WifiOff size={24} />} label="离线车辆" value={offlineCount} color="danger" suffix="辆" />
        <StatCard icon={<Bell size={24} />} label="今日告警" value={alertTotal} color="warning" suffix="条" />
        <StatCard icon={<Clock size={24} />} label="在线率" value={onTimeRate} color="info" suffix="%" />
      </div>

      <div className="flex flex-1 min-h-0 gap-3">
        <div className="flex-[3] flex flex-col gap-3 min-h-0">
          <div className="flex-1 rounded-lg border border-surface-border overflow-hidden">
            <MapContainer center={BEIJING} zoom={11} className="h-full w-full" zoomControl={true}>
              <MapTileLayer />
              <MapUpdater />
              {vehicles.map((v) => (
                <VehicleMarker key={v.id} vehicle={v} onClick={handleVehicleClick} />
              ))}
            </MapContainer>
          </div>

          <div className="dark-card overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-primary" />
                <span className="text-sm font-medium text-white">平台可靠性</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                <span className="text-xs text-gray-400">{connected ? '实时连接正常' : '连接断开'}</span>
                {reconnectAttempts > 0 && <span className="text-xs text-warning ml-1">({reconnectAttempts}次重连)</span>}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                <Radio size={12} className="text-primary" />
                <div>
                  <div className="text-[10px] text-gray-500">JT/T 808</div>
                  <div className="text-sm font-mono text-white">{jtt.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                <Server size={12} className="text-info" />
                <div>
                  <div className="text-[10px] text-gray-500">GB/T 35658</div>
                  <div className="text-sm font-mono text-white">{gbt.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                <Cpu size={12} className="text-warning" />
                <div>
                  <div className="text-[10px] text-gray-500">消息队列</div>
                  <div className="text-sm font-mono text-white">
                    {sysStatus?.messageQueueDepth ?? pendingQueue}
                    {failedQueue > 0 && <span className="text-danger text-[10px] ml-1">({failedQueue}失败)</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                <Archive size={12} className="text-warning" />
                <div>
                  <div className="text-[10px] text-gray-500">今日归档</div>
                  <div className="text-sm font-mono text-white">{(sysStatus?.archive.todayDataPoints ?? archiveStats.totalPoints).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                <RefreshCw size={12} className="text-success" />
                <div>
                  <div className="text-[10px] text-gray-500">续传率</div>
                  <div className="text-sm font-mono text-white">{(sysStatus?.reconnection.reconnectionRate ?? 98.5).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-[2] flex flex-col gap-3 min-h-0">
          <div className="flex-1 flex flex-col dark-card overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">车辆清单</span>
              <span className="text-xs text-gray-500">共 {total} 辆</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="dark-table">
                <thead>
                  <tr>
                    <th>车牌号</th>
                    <th>终端编号</th>
                    <th>定位时间</th>
                    <th>速度</th>
                    <th>状态</th>
                    <th>运行/停驻</th>
                    <th>组织路径</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedVehicles.map((v: Vehicle) => (
                    <tr
                      key={v.id}
                      onClick={() => handleVehicleClick(v)}
                      className="cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                      <td className="font-mono text-white text-xs">{v.plate_number}</td>
                      <td className="text-xs text-gray-400 font-mono">{v.device_sn || '-'}</td>
                      <td className="text-xs text-gray-400 font-mono">
                        {v.last_location_time ? new Date(v.last_location_time).toLocaleTimeString() : '-'}
                      </td>
                      <td className="text-xs font-mono text-white">{v.speed} km/h</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                          v.status === 'online' ? 'bg-success/10 text-success' :
                          v.status === 'alarm' ? 'bg-danger/10 text-danger' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_MAP[v.status]?.color.split(' ')[0]}`} />
                          {STATUS_MAP[v.status]?.label}
                        </span>
                      </td>
                      <td>
                        <span className={`text-xs ${v.speed > 0 ? 'text-success' : 'text-gray-500'}`}>
                          {v.speed > 0 ? '运行' : '停驻'}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500 max-w-[120px] truncate" title={v.org_path}>
                        {v.org_path || v.org_name || '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/monitor?vehicleId=${v.id}`); }}
                            className="text-gray-400 hover:text-primary transition-colors" title="监控定位"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/trajectory?vehicleId=${v.id}`); }}
                            className="text-gray-400 hover:text-primary transition-colors" title="历史轨迹"
                          >
                            <Route size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-surface-border pt-2 mt-1">
                <span className="text-xs text-gray-500">第 {page}/{totalPages} 页</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-surface-light disabled:opacity-30">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-surface-light disabled:opacity-30">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="dark-card overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-danger" />
                <span className="text-sm font-medium text-white">待处理告警</span>
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">{pendingAlerts.length}</span>
              </div>
              <button onClick={() => navigate('/alerts?status=pending')} className="text-xs text-primary hover:underline">
                查看全部 →
              </button>
            </div>
            <div className="space-y-1.5">
              {visibleAlerts.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleAlertNav(a)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors hover:border-primary/40 ${
                    ALERT_LEVEL_STYLES[a.level] || 'border-surface-border'
                  }`}
                >
                  <span className="text-base shrink-0">{ALERT_TYPE_ICONS[a.type] || '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white">{a.vehicle_plate}</span>
                      <span className="text-xs text-gray-300">{ALERT_TYPE_LABELS[a.type] || a.type}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                        a.level === 'critical' ? 'bg-danger/20 text-danger' :
                        a.level === 'warning' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'
                      }`}>{ALERT_LEVEL_LABELS[a.level]}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {ALERT_STATUS_LABELS[a.status]} · {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/trajectory?vehicleId=${a.vehicle_id}`); }}
                      className="rounded p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors" title="查看轨迹"
                    >
                      <Route size={12} />
                    </button>
                    <button
                      onClick={(e) => handleAlertAck(e, a.id)}
                      className="rounded p-1.5 text-gray-400 hover:text-success hover:bg-success/10 transition-colors" title="确认告警"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {pendingAlerts.length === 0 && (
                <div className="py-3 text-center text-xs text-gray-500">暂无待处理告警</div>
              )}
            </div>
            {alertTotalPages > 1 && (
              <div className="flex items-center justify-end gap-1 mt-2">
                <button onClick={() => setAlertPage(Math.max(0, alertPage - 1))} disabled={alertPage <= 0}
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-surface-light disabled:opacity-30">
                  <ChevronLeft size={12} />
                </button>
                <span className="text-[10px] text-gray-500">{alertPage + 1}/{alertTotalPages}</span>
                <button onClick={() => setAlertPage(Math.min(alertTotalPages - 1, alertPage + 1))} disabled={alertPage >= alertTotalPages - 1}
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-surface-light disabled:opacity-30">
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
