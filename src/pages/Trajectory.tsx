import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, Polyline, useMap, CircleMarker, Popup } from 'react-leaflet';
import { Search, Play, Pause, SkipBack, SkipForward, Calendar, Car, Wifi, WifiOff, Radio, Server, Archive, Activity, MapPin, Gauge, Clock, Pause as PauseIcon, AlertTriangle } from 'lucide-react';
import { useWsStore } from '@/stores/wsStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import MapTileLayer from '@/components/MapTileLayer';
import { api } from '@/utils/api';

const BEIJING: [number, number] = [39.9042, 116.4074];

interface TrajectoryPoint {
  id: number;
  vehicleId: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

interface ParkingSegment {
  startIndex: number;
  endIndex: number;
  startPoint: TrajectoryPoint;
  endPoint: TrajectoryPoint;
  durationMin: number;
}

function getSpeedColor(speed: number): string {
  if (speed > 60) return '#ff6b35';
  if (speed > 40) return '#ffab00';
  if (speed > 0) return '#00e676';
  return '#666666';
}

function getSpeedLabel(speed: number): string {
  if (speed > 60) return '超速';
  if (speed > 40) return '正常';
  if (speed > 0) return '低速';
  return '停驻';
}

function TrajectoryMap({ points, progress, currentPoint }: { points: TrajectoryPoint[]; progress: number; currentPoint: TrajectoryPoint | null }) {
  const map = useMap();
  const prevLenRef = useRef(0);
  const visiblePoints = points.slice(0, Math.max(2, Math.floor(points.length * progress)));

  useEffect(() => {
    if (points.length > 0 && prevLenRef.current === 0) {
      const bounds = points.map((p) => [p.lat, p.lng] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }
    prevLenRef.current = points.length;
  }, [points, map]);

  const segments = useMemo(() => {
    const segs: { positions: [number, number][]; color: string }[] = [];
    for (let i = 0; i < visiblePoints.length - 1; i++) {
      const p1 = visiblePoints[i];
      const p2 = visiblePoints[i + 1];
      const avgSpeed = (p1.speed + p2.speed) / 2;
      segs.push({
        positions: [[p1.lat, p1.lng], [p2.lat, p2.lng]],
        color: getSpeedColor(avgSpeed),
      });
    }
    return segs;
  }, [visiblePoints]);

  return (
    <>
      {segments.map((seg, i) => (
        <Polyline key={i} positions={seg.positions} pathOptions={{ color: seg.color, weight: 4, opacity: 0.9 }} />
      ))}
      {points.filter((p) => p.speed === 0).map((p, i) => (
        <CircleMarker key={`park-${i}`} center={[p.lat, p.lng]} radius={5} pathOptions={{ color: '#888', fillColor: '#aaa', fillOpacity: 0.7 }}>
          <Popup>停驻点 · {new Date(p.timestamp).toLocaleString()}</Popup>
        </CircleMarker>
      ))}
      {currentPoint && (
        <CircleMarker center={[currentPoint.lat, currentPoint.lng]} radius={8} pathOptions={{ color: '#00d4ff', fillColor: '#00d4ff', fillOpacity: 1, weight: 3 }}>
          <Popup>
            <div className="text-xs">
              <div className="font-bold">{currentPoint.speed} km/h</div>
              <div className="text-gray-500">{new Date(currentPoint.timestamp).toLocaleString()}</div>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
}

export default function Trajectory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleIdParam = searchParams.get('vehicleId');
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { connect, disconnect, connected, protocolStats, archiveStats, messageQueue } = useWsStore();

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [points, setPoints] = useState<TrajectoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchVehicles({ pageSize: 100 });
    connect();
    return () => disconnect();
  }, [fetchVehicles, connect, disconnect]);

  useEffect(() => {
    if (vehicleIdParam && vehicles.length > 0 && !selectedVehicleId) {
      const v = vehicles.find((v) => String(v.id) === vehicleIdParam);
      if (v) setSelectedVehicleId(v.id);
    }
  }, [vehicleIdParam, vehicles, selectedVehicleId]);

  useEffect(() => {
    if (!startDate) {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [startDate]);

  useEffect(() => {
    if (playing && points.length > 0) {
      const interval = 200 / speed;
      playTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            setPlaying(false);
            return 1;
          }
          return Math.min(1, prev + 1 / Math.max(1, points.length));
        });
      }, interval);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [playing, speed, points.length]);

  const handleQuery = async () => {
    if (!selectedVehicleId) return;
    setLoading(true);
    setProgress(0);
    setPlaying(false);
    setQueried(true);
    try {
      let url = `/api/trajectory/${selectedVehicleId}/trajectory`;
      const params = new URLSearchParams();
      if (startDate) params.set('startTime', `${startDate}T00:00:00.000Z`);
      if (endDate) params.set('endTime', `${endDate}T23:59:59.999Z`);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await api.get<{ points: TrajectoryPoint[] }>(url);
      setPoints(res.points || []);
    } catch {
      setPoints([]);
    }
    setLoading(false);
  };

  const currentIndex = Math.floor(progress * Math.max(1, points.length - 1));
  const currentPoint = points.length > 0 ? points[currentIndex] : null;

  const parkingSegments = useMemo<ParkingSegment[]>(() => {
    const segments: ParkingSegment[] = [];
    let i = 0;
    while (i < points.length) {
      if (points[i].speed === 0) {
        const startIdx = i;
        while (i < points.length && points[i].speed === 0) i++;
        const endIdx = i - 1;
        if (endIdx > startIdx) {
          const start = points[startIdx];
          const end = points[endIdx];
          const durationMin = (new Date(end.timestamp).getTime() - new Date(start.timestamp).getTime()) / 60000;
          if (durationMin >= 1) {
            segments.push({ startIndex: startIdx, endIndex: endIdx, startPoint: start, endPoint: end, durationMin });
          }
        }
      } else {
        i++;
      }
    }
    return segments;
  }, [points]);

  const totalDistance = useMemo(() => {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const R = 6371000;
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return (dist / 1000).toFixed(2);
  }, [points]);

  const avgSpeed = useMemo(() => {
    if (points.length === 0) return 0;
    const sum = points.reduce((s, p) => s + p.speed, 0);
    return Math.round(sum / points.length);
  }, [points]);

  const maxSpeed = useMemo(() => (points.length > 0 ? Math.max(...points.map((p) => p.speed)) : 0), [points]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const pendingQueue = messageQueue.filter((m) => m.status === 'pending').length;

  const handlePlay = () => {
    if (progress >= 1) setProgress(0);
    setPlaying(!playing);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 border-r border-surface-border bg-surface flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">轨迹回放</h3>
            <div className="flex items-center gap-1" title={connected ? '实时连接' : '连接断开'}>
              {connected ? <Wifi size={12} className="text-success" /> : <WifiOff size={12} className="text-danger" />}
              <span className={`text-[10px] ${connected ? 'text-success' : 'text-danger'}`}>
                {connected ? '连接' : '断开'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">选择车辆</label>
              <div className="relative">
                <Car size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select
                  value={selectedVehicleId || ''}
                  onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-md border border-surface-border bg-surface-dark py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary appearance-none"
                >
                  <option value="">请选择车辆</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} · {v.driver_name || '未分配'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-400">开始日期</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface-dark py-2 pl-9 pr-2 text-sm text-white outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">结束日期</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface-dark py-2 pl-9 pr-2 text-sm text-white outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleQuery}
              disabled={!selectedVehicleId || loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-surface-dark hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              <Search size={14} />
              {loading ? '查询中...' : '查询轨迹'}
            </button>
          </div>
        </div>

        {points.length > 0 && (
          <div className="p-4 border-b border-surface-border">
            <div className="text-xs text-gray-400 mb-2">行驶统计</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-surface-dark px-2.5 py-1.5">
                <div className="text-[10px] text-gray-500">总里程</div>
                <div className="text-sm font-mono text-white">{totalDistance} km</div>
              </div>
              <div className="rounded bg-surface-dark px-2.5 py-1.5">
                <div className="text-[10px] text-gray-500">平均速度</div>
                <div className="text-sm font-mono text-white">{avgSpeed} km/h</div>
              </div>
              <div className="rounded bg-surface-dark px-2.5 py-1.5">
                <div className="text-[10px] text-gray-500">最高速度</div>
                <div className="text-sm font-mono text-warning">{maxSpeed} km/h</div>
              </div>
              <div className="rounded bg-surface-dark px-2.5 py-1.5">
                <div className="text-[10px] text-gray-500">轨迹点数</div>
                <div className="text-sm font-mono text-white">{points.length}</div>
              </div>
            </div>
          </div>
        )}

        {parkingSegments.length > 0 && (
          <div className="p-4 border-b border-surface-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400">停驻片段</div>
              <span className="text-[10px] text-gray-500">{parkingSegments.length} 处</span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {parkingSegments.slice(0, 5).map((seg, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                  <PauseIcon size={12} className="text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 truncate">
                      {new Date(seg.startPoint.timestamp).toLocaleTimeString()} - {new Date(seg.endPoint.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-white">{seg.durationMin.toFixed(0)} 分钟</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity size={12} className="text-primary" />
            <span className="text-xs text-gray-400">平台可靠性</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 rounded bg-surface-dark px-2 py-1">
              <Radio size={10} className="text-primary" />
              <div>
                <div className="text-[9px] text-gray-500">JT/T 808</div>
                <div className="text-[11px] font-mono text-white">{protocolStats.jtt808}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded bg-surface-dark px-2 py-1">
              <Server size={10} className="text-info" />
              <div>
                <div className="text-[9px] text-gray-500">GB/T 35658</div>
                <div className="text-[11px] font-mono text-white">{protocolStats.gbt35658}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded bg-surface-dark px-2 py-1">
              <Car size={10} className="text-warning" />
              <div>
                <div className="text-[9px] text-gray-500">消息队列</div>
                <div className="text-[11px] font-mono text-white">{pendingQueue || protocolStats.totalMessages}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded bg-surface-dark px-2 py-1">
              <Archive size={10} className="text-warning" />
              <div>
                <div className="text-[9px] text-gray-500">已归档</div>
                <div className="text-[11px] font-mono text-white">{archiveStats.archivedMonths}月</div>
              </div>
            </div>
          </div>
        </div>

        {points.length > 0 && (
          <div className="flex-1 overflow-auto p-4">
            <div className="text-xs text-gray-400 mb-2">速度明细</div>
            <div className="space-y-1">
              {[...points].reverse().slice(0, 15).map((p, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                  <span className={`h-2 w-2 rounded-full shrink-0`} style={{ backgroundColor: getSpeedColor(p.speed) }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(p.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs flex items-center gap-1.5">
                      <span className="font-mono text-white">{p.speed} km/h</span>
                      <span className={`text-[9px] ${
                        p.speed > 60 ? 'text-danger' : p.speed > 40 ? 'text-success' : p.speed > 0 ? 'text-info' : 'text-gray-500'
                      }`}>{getSpeedLabel(p.speed)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 relative">
          <MapContainer center={BEIJING} zoom={12} className="h-full w-full">
            <MapTileLayer />
            <TrajectoryMap points={points} progress={progress} currentPoint={currentPoint} />
          </MapContainer>

          {!queried && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-dark/70 pointer-events-none z-[400]">
              <div className="text-center">
                <MapPin size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-400">请选择车辆并点击"查询轨迹"</p>
              </div>
            </div>
          )}

          {queried && points.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-dark/70 pointer-events-none z-[400]">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto mb-3 text-warning" />
                <p className="text-sm text-gray-400">该时间段内没有轨迹数据</p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-surface-border bg-surface p-4">
          {selectedVehicle && (
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-surface-border">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                <Car size={16} className="text-primary" />
              </div>
              <div>
                <div className="text-sm text-white font-mono">{selectedVehicle.plate_number}</div>
                <div className="text-xs text-gray-500">
                  {selectedVehicle.driver_name || '未分配司机'} · {selectedVehicle.org_path || selectedVehicle.org_name || ''}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <Gauge size={11} className="text-gray-500" />
                  <span className="font-mono text-white">{currentPoint?.speed ?? 0} km/h</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-gray-500" />
                  <span className="font-mono text-gray-300">
                    {currentPoint ? new Date(currentPoint.timestamp).toLocaleTimeString() : '--'}
                  </span>
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button onClick={() => { setProgress(Math.max(0, progress - 0.05)); setPlaying(false); }}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-white hover:bg-surface-light transition-colors" disabled={!queried || points.length === 0}>
              <SkipBack size={16} />
            </button>
            <button onClick={handlePlay} disabled={!queried || points.length === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-surface-dark hover:bg-primary-light transition-colors disabled:opacity-30">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={() => { setProgress(Math.min(1, progress + 0.05)); setPlaying(false); }}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-white hover:bg-surface-light transition-colors" disabled={!queried || points.length === 0}>
              <SkipForward size={16} />
            </button>
            <button onClick={() => { setPlaying(false); setProgress(0); }} className="text-xs text-gray-500 hover:text-white transition-colors">
              重置
            </button>

            <div className="flex-1 mx-4">
              <input
                type="range"
                min={0}
                max={100}
                value={progress * 100}
                onChange={(e) => { setProgress(Number(e.target.value) / 100); setPlaying(false); }}
                className="w-full accent-primary"
                disabled={!queried || points.length === 0}
              />
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`rounded px-2 py-1 text-xs font-mono transition-colors ${
                    speed === s ? 'bg-primary text-surface-dark' : 'text-gray-400 hover:text-white hover:bg-surface-light'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="font-mono text-sm text-gray-300 min-w-[140px] text-right">
              {Math.floor(progress * points.length)}/{points.length} 点
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-surface-border/50">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded bg-success" />
              <span className="text-[10px] text-gray-500">0-40 km/h 正常</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded bg-warning" />
              <span className="text-[10px] text-gray-500">40-60 km/h 中速</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded bg-danger" />
              <span className="text-[10px] text-gray-500">60+ km/h 超速</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-500" />
              <span className="text-[10px] text-gray-500">停驻点</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
