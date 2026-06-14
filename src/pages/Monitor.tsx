import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, useMap } from 'react-leaflet';
import { Search, X, Car, Gauge, Navigation, User, Clock, Route, Bell, Crosshair, Cpu, Eye, Check, Radio, Server, Archive, RefreshCw, Activity } from 'lucide-react';
import OrgTree from '@/components/OrgTree';
import VehicleMarker from '@/components/VehicleMarker';
import MapTileLayer from '@/components/MapTileLayer';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useAlertStore } from '@/stores/alertStore';
import { useWsStore } from '@/stores/wsStore';
import type { Vehicle } from '@/stores/vehicleStore';
import type { Alert } from '@/stores/alertStore';
import type { OrgNode } from '@/components/OrgTree';
import { api } from '@/utils/api';

const BEIJING: [number, number] = [39.9042, 116.4074];

const ALERT_TYPE_LABELS: Record<string, string> = {
  fence_violation: '围栏告警', overspeed: '超速告警', abnormal_stop: '异常停车',
  fatigue: '疲劳驾驶', harsh_accel: '急加速', harsh_brake: '急刹车',
};

const ALERT_STATUS_LABELS: Record<string, string> = {
  pending: '待处理', acknowledged: '已确认', resolved: '已解决', dismissed: '已忽略',
};

function FlyToVehicle({ vehicle }: { vehicle: Vehicle | null }) {
  const map = useMap();
  useEffect(() => {
    if (vehicle) {
      map.flyTo([vehicle.lat, vehicle.lng], 14, { duration: 1 });
    }
  }, [vehicle, map]);
  return null;
}

export default function Monitor() {
  const { vehicles, fetchVehicles, selectedVehicle, selectVehicle } = useVehicleStore();
  const { alerts, fetchAlerts, processAlert } = useAlertStore();
  const { connect, disconnect, connected, protocolStats, archiveStats, messageQueue, reconnectAttempts } = useWsStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [orgData, setOrgData] = useState<OrgNode[]>([]);
  const [vehicleAlerts, setVehicleAlerts] = useState<Alert[]>([]);
  const [processNote, setProcessNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sysConnected, setSysConnected] = useState<number>(0);
  const [sysTotal, setSysTotal] = useState<number>(0);

  const vehicleIdParam = searchParams.get('vehicleId');

  useEffect(() => {
    fetchVehicles({ pageSize: 100 });
    fetchAlerts({ pageSize: 50 });
    connect();
    api.get<OrgNode[]>('/api/orgs/tree').then(setOrgData).catch(() => {});
    api.get<{ connectedTerminals: number; totalTerminals: number }>('/api/system/status').then((d) => {
      setSysConnected(d.connectedTerminals);
      setSysTotal(d.totalTerminals);
    }).catch(() => {});
    return () => disconnect();
  }, [fetchVehicles, fetchAlerts, connect, disconnect]);

  useEffect(() => {
    if (vehicleIdParam && vehicles.length > 0) {
      const v = vehicles.find((v) => String(v.id) === vehicleIdParam);
      if (v) {
        selectVehicle(v);
        setDrawerOpen(true);
        const vAlerts = alerts.filter((a) => String(a.vehicle_id) === String(v.id)).slice(0, 5);
        setVehicleAlerts(vAlerts);
      }
    }
  }, [vehicleIdParam, vehicles, alerts, selectVehicle]);

  const filteredVehicles = vehicles.filter((v) => {
    if (keyword && !v.plate_number.includes(keyword) && !v.driver_name?.includes(keyword) && !v.device_sn?.includes(keyword)) return false;
    if (selectedOrg && String(v.org_id) !== selectedOrg) return false;
    return true;
  });

  const handleVehicleClick = useCallback((vehicle: Vehicle) => {
    selectVehicle(vehicle);
    setDrawerOpen(true);
    setFollowing(false);
    const vAlerts = alerts.filter((a) => String(a.vehicle_id) === String(vehicle.id)).slice(0, 5);
    setVehicleAlerts(vAlerts);
  }, [selectVehicle, alerts]);

  const handleProcessAlert = async (alertId: number, action: 'acknowledge' | 'resolve' | 'dismiss') => {
    setProcessing(true);
    try {
      await processAlert(alertId, action, processNote || undefined);
      setProcessNote('');
      const vAlerts = alerts.filter((a) => String(a.vehicle_id) === String(selectedVehicle?.id) && a.status === 'pending').slice(0, 5);
      setVehicleAlerts(vAlerts);
    } catch {}
    setProcessing(false);
  };

  const statusColor = (status: Vehicle['status']) => {
    if (status === 'online') return 'bg-success';
    if (status === 'alarm') return 'bg-danger';
    return 'bg-gray-500';
  };

  const statusLabel = (status: Vehicle['status']) => {
    if (status === 'online') return '在线';
    if (status === 'alarm') return '告警';
    return '离线';
  };

  const pendingQueue = messageQueue.filter((m) => m.status === 'pending').length;

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-surface-border bg-surface flex flex-col overflow-hidden">
        <div className="p-3 border-b border-surface-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索车牌/司机/终端"
              className="w-full rounded-md border border-surface-border bg-surface-dark py-2 pl-9 pr-8 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
            />
            {keyword && (
              <button onClick={() => setKeyword('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="p-3 border-b border-surface-border">
          <div className="text-xs text-gray-500 mb-2">组织筛选</div>
          {orgData.length > 0 && (
            <OrgTree data={orgData} selectedId={selectedOrg ? String(selectedOrg) : undefined} onSelect={(n) => setSelectedOrg(n.id ? Number(n.id) : undefined)} />
          )}
        </div>

        <div className="p-3 border-b border-surface-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity size={12} className="text-primary" />
            <span className="text-xs text-gray-400">平台状态</span>
            <span className={`ml-auto h-1.5 w-1.5 rounded-full ${connected ? 'bg-success' : 'bg-danger'}`} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded bg-surface-dark px-2 py-1">
              <div className="text-[10px] text-gray-500">在线终端</div>
              <div className="text-xs font-mono text-white">{sysConnected}/{sysTotal}</div>
            </div>
            <div className="rounded bg-surface-dark px-2 py-1">
              <div className="text-[10px] text-gray-500">消息队列</div>
              <div className="text-xs font-mono text-white">{protocolStats.totalMessages}</div>
            </div>
            <div className="rounded bg-surface-dark px-2 py-1">
              <div className="text-[10px] text-gray-500">JT/T 808</div>
              <div className="text-xs font-mono text-primary">{protocolStats.jtt808}</div>
            </div>
            <div className="rounded bg-surface-dark px-2 py-1">
              <div className="text-[10px] text-gray-500">GB/T 35658</div>
              <div className="text-xs font-mono text-info">{protocolStats.gbt35658}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 px-3">车辆列表 ({filteredVehicles.length})</div>
          {filteredVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => handleVehicleClick(v)}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-surface-light ${
                selectedVehicle?.id === v.id ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'
              }`}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor(v.status)}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate font-mono">{v.plate_number}</div>
                <div className="text-xs text-gray-500 truncate">{v.driver_name || '未分配'} · {v.org_name}</div>
              </div>
              <span className="text-xs font-mono text-gray-400">{v.speed}km/h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={BEIJING} zoom={11} className="h-full w-full">
          <MapTileLayer />
          <FlyToVehicle vehicle={following && selectedVehicle ? selectedVehicle : (drawerOpen ? selectedVehicle : null)} />
          {filteredVehicles.map((v) => (
            <VehicleMarker key={v.id} vehicle={v} onClick={handleVehicleClick} />
          ))}
        </MapContainer>

        {drawerOpen && selectedVehicle && (
          <div className="absolute top-4 right-4 w-80 dark-card animate-slide-in-right z-[1000] max-h-[calc(100%-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Car size={18} className="text-primary" />
                <span className="font-mono text-lg font-bold text-white">{selectedVehicle.plate_number}</span>
                <span className={`h-2 w-2 rounded-full ${statusColor(selectedVehicle.status)}`} />
                <span className={`text-xs ${selectedVehicle.status === 'online' ? 'text-success' : selectedVehicle.status === 'alarm' ? 'text-danger' : 'text-gray-500'}`}>
                  {statusLabel(selectedVehicle.status)}
                </span>
              </div>
              <button onClick={() => { setDrawerOpen(false); setFollowing(false); }} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Cpu size={14} className="text-gray-500" />
                <span className="text-gray-400">终端</span>
                <span className="ml-auto font-mono text-white text-xs">{selectedVehicle.device_sn || '-'}</span>
                <span className="text-[10px] text-gray-500">({selectedVehicle.device_protocol || '-'})</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Gauge size={14} className="text-gray-500" />
                <span className="text-gray-400">速度</span>
                <span className="ml-auto font-mono text-white">{selectedVehicle.speed} km/h</span>
                <span className={`text-xs ${selectedVehicle.speed > 0 ? 'text-success' : 'text-gray-500'}`}>
                  {selectedVehicle.speed > 0 ? '运行中' : '停驻'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Navigation size={14} className="text-gray-500" />
                <span className="text-gray-400">方向</span>
                <span className="ml-auto font-mono text-white">{selectedVehicle.heading}°</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User size={14} className="text-gray-500" />
                <span className="text-gray-400">司机</span>
                <span className="ml-auto text-white">{selectedVehicle.driver_name || '未分配'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={14} className="text-gray-500" />
                <span className="text-gray-400">定位时间</span>
                <span className="ml-auto font-mono text-xs text-gray-300">
                  {selectedVehicle.last_location_time ? new Date(selectedVehicle.last_location_time).toLocaleString() : '-'}
                </span>
              </div>
              {selectedVehicle.org_path && (
                <div className="flex items-center gap-3 text-sm">
                  <Car size={14} className="text-gray-500" />
                  <span className="text-gray-400">组织</span>
                  <span className="ml-auto text-xs text-gray-300 max-w-[180px] truncate" title={selectedVehicle.org_path}>
                    {selectedVehicle.org_path}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate(`/trajectory?vehicleId=${selectedVehicle.id}`)}
                className="flex-1 flex items-center justify-center gap-1 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary hover:bg-primary/20 transition-colors"
              >
                <Route size={12} /> 历史轨迹
              </button>
              <button
                onClick={() => navigate(`/alerts?vehicleId=${selectedVehicle.id}`)}
                className="flex-1 flex items-center justify-center gap-1 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning hover:bg-warning/20 transition-colors"
              >
                <Bell size={12} /> 告警记录
              </button>
              <button
                onClick={() => setFollowing(!following)}
                className={`flex-1 flex items-center justify-center gap-1 rounded-md px-3 py-2 text-xs transition-colors ${
                  following ? 'bg-success/20 text-success' : 'bg-surface-light text-gray-400 hover:text-white'
                }`}
              >
                <Crosshair size={12} /> {following ? '追踪中' : '实时追踪'}
              </button>
            </div>

            {vehicleAlerts.length > 0 && (
              <div className="mt-4 border-t border-surface-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">关联告警</span>
                  <button
                    onClick={() => navigate(`/alerts?vehicleId=${selectedVehicle.id}`)}
                    className="text-[10px] text-primary hover:underline"
                  >查看全部 →</button>
                </div>
                <div className="space-y-2">
                  {vehicleAlerts.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-dark/50 px-3 py-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${
                        a.level === 'critical' ? 'bg-danger' : a.level === 'warning' ? 'bg-warning' : 'bg-info'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate">{ALERT_TYPE_LABELS[a.type] || a.type}</div>
                        <div className="text-[10px] text-gray-500">
                          {ALERT_STATUS_LABELS[a.status]} · {new Date(a.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {a.status === 'pending' && (
                        <button
                          onClick={() => handleProcessAlert(a.id, 'acknowledge')}
                          disabled={processing}
                          className="shrink-0 rounded p-1 text-success hover:bg-success/10 disabled:opacity-50 transition-colors"
                          title="确认告警"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/trajectory?vehicleId=${a.vehicle_id}`)}
                        className="shrink-0 rounded p-1 text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="查看轨迹"
                      >
                        <Route size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
