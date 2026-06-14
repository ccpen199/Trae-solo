import { useState } from 'react';
import { MapContainer, Circle, Polygon, useMapEvents } from 'react-leaflet';
import { Plus, Edit3, Trash2, Shield, Save, X } from 'lucide-react';
import MapTileLayer from '@/components/MapTileLayer';

const BEIJING: [number, number] = [39.9042, 116.4074];

interface FenceItem {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: [number, number];
  radius?: number;
  positions?: [number, number][];
  alertType: 'enter' | 'leave' | 'both';
  bindVehicles: string[];
  enabled: boolean;
}

const mockFences: FenceItem[] = [
  { id: '1', name: '一车队停车场', type: 'circle', center: [39.9042, 116.3974], radius: 500, alertType: 'both', bindVehicles: ['京A12345'], enabled: true },
  { id: '2', name: '二车队运营区', type: 'polygon', positions: [[39.8950, 116.4150], [39.8950, 116.4350], [39.9100, 116.4350], [39.9100, 116.4150]], alertType: 'leave', bindVehicles: ['京B67890'], enabled: true },
  { id: '3', name: '禁行区域', type: 'circle', center: [39.9200, 116.4100], radius: 300, alertType: 'enter', bindVehicles: [], enabled: false },
];

const alertTypeLabels: Record<string, string> = { enter: '进区告警', leave: '出区告警', both: '进出告警' };

function DrawHandler({ drawMode, onCirclePlace, onPolygonPoint }: {
  drawMode: 'circle' | 'polygon' | null;
  onCirclePlace: (center: [number, number]) => void;
  onPolygonPoint: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      const point: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (drawMode === 'circle') {
        onCirclePlace(point);
      } else if (drawMode === 'polygon') {
        onPolygonPoint(point);
      }
    },
  });
  return null;
}

export default function Fence() {
  const [fences] = useState<FenceItem[]>(mockFences);
  const [selectedFence, setSelectedFence] = useState<FenceItem | null>(null);
  const [drawMode, setDrawMode] = useState<'circle' | 'polygon' | null>(null);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [editingFence, setEditingFence] = useState<FenceItem | null>(null);

  const handleCirclePlace = (center: [number, number]) => {
    const newFence: FenceItem = {
      id: String(Date.now()),
      name: '新围栏',
      type: 'circle',
      center,
      radius: 500,
      alertType: 'both',
      bindVehicles: [],
      enabled: true,
    };
    setEditingFence(newFence);
    setDrawMode(null);
  };

  const handlePolygonPoint = (point: [number, number]) => {
    const newPoints = [...drawPoints, point];
    setDrawPoints(newPoints);
    if (newPoints.length >= 3) {
      const newFence: FenceItem = {
        id: String(Date.now()),
        name: '新围栏',
        type: 'polygon',
        positions: newPoints,
        alertType: 'both',
        bindVehicles: [],
        enabled: true,
      };
      setEditingFence(newFence);
      setDrawPoints([]);
      setDrawMode(null);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0 border-r border-surface-border bg-surface flex flex-col overflow-hidden">
        <div className="p-3 border-b border-surface-border flex items-center justify-between">
          <span className="text-sm font-medium text-white">围栏列表</span>
          <div className="flex gap-1">
            <button
              onClick={() => setDrawMode('circle')}
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                drawMode === 'circle' ? 'bg-primary text-surface-dark' : 'text-gray-400 hover:bg-surface-light hover:text-white'
              }`}
              title="绘制圆形围栏"
            >
              <Shield size={14} />
            </button>
            <button
              onClick={() => setDrawMode('polygon')}
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                drawMode === 'polygon' ? 'bg-primary text-surface-dark' : 'text-gray-400 hover:bg-surface-light hover:text-white'
              }`}
              title="绘制多边形围栏"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {fences.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFence(f)}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-surface-light ${
                selectedFence?.id === f.id ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'
              }`}
            >
              <Shield size={14} className={f.enabled ? 'text-primary' : 'text-gray-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{f.name}</div>
                <div className="text-xs text-gray-500">{f.type === 'circle' ? '圆形' : '多边形'} · {alertTypeLabels[f.alertType]}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditingFence(f); }} className="text-gray-500 hover:text-primary"><Edit3 size={12} /></button>
                <button className="text-gray-500 hover:text-danger"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
        {drawMode && (
          <div className="p-3 border-t border-surface-border bg-primary/10 text-xs text-primary">
            {drawMode === 'circle' ? '点击地图设置圆形围栏中心' : `点击地图添加多边形顶点 (${drawPoints.length}/3+)`}
          </div>
        )}
      </div>

      <div className="flex-1">
        <MapContainer center={BEIJING} zoom={12} className="h-full w-full">
          <MapTileLayer />
          <DrawHandler drawMode={drawMode} onCirclePlace={handleCirclePlace} onPolygonPoint={handlePolygonPoint} />
          {fences.map((f) => {
            if (f.type === 'circle' && f.center && f.radius) {
              return (
                <Circle
                  key={f.id}
                  center={f.center}
                  radius={f.radius}
                  pathOptions={{ color: f.enabled ? '#00d4ff' : '#5a6a7e', fillColor: f.enabled ? '#00d4ff' : '#5a6a7e', fillOpacity: 0.1, weight: 2 }}
                />
              );
            }
            if (f.type === 'polygon' && f.positions) {
              return (
                <Polygon
                  key={f.id}
                  positions={f.positions}
                  pathOptions={{ color: f.enabled ? '#00d4ff' : '#5a6a7e', fillColor: f.enabled ? '#00d4ff' : '#5a6a7e', fillOpacity: 0.1, weight: 2 }}
                />
              );
            }
            return null;
          })}
        </MapContainer>
      </div>

      {(editingFence || selectedFence) && (
        <div className="w-72 shrink-0 border-l border-surface-border bg-surface p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white">围栏属性</span>
            <button onClick={() => { setEditingFence(null); setSelectedFence(null); }} className="text-gray-500 hover:text-white"><X size={16} /></button>
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <label className="mb-1 block text-xs text-gray-400">名称</label>
              <input defaultValue={(editingFence || selectedFence)?.name} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">类型</label>
              <div className="text-sm text-white">{(editingFence || selectedFence)?.type === 'circle' ? '圆形' : '多边形'}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">告警类型</label>
              <select defaultValue={(editingFence || selectedFence)?.alertType} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary">
                <option value="enter">进区告警</option>
                <option value="leave">出区告警</option>
                <option value="both">进出告警</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">绑定车辆</label>
              <input placeholder="输入车牌号" className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-surface-dark hover:bg-primary-light transition-colors">
            <Save size={14} />
            保存
          </button>
        </div>
      )}
    </div>
  );
}
