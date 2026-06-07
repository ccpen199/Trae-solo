import { useEffect, useState } from 'react';
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Maximize2, LayoutGrid, Settings, Settings2 } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { DeviceStatusBadge } from '@/components/Badges';
import type { Device } from '@/types';
import { cn } from '@/lib/utils';

const GRID_OPTIONS = [1, 4, 9, 16];

export default function LivePreview() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [gridSize, setGridSize] = useState(4);
  const [selected, setSelected] = useState<number | null>(null);
  const [ptzSpeed, setPtzSpeed] = useState(50);
  const [fullscreen, setFullscreen] = useState<number | null>(null);

  useEffect(() => {
    document.title = '实时预览 - 云瞳视频监控';
    api.get('/devices?pageSize=50&status=online').then(res => {
      if (res.data.success) setDevices(res.data.list);
    });
  }, []);

  const gridCols = {
    1: 'grid-cols-1',
    4: 'grid-cols-2',
    9: 'grid-cols-3',
    16: 'grid-cols-4',
  }[gridSize] || 'grid-cols-2';

  const displayed = devices.slice(0, gridSize);

  const handlePTZ = async (action: string) => {
    if (selected == null) return;
    try {
      await api.post(`/devices/${selected}/ptz`, { action, speed: ptzSpeed });
    } catch (e) {
      console.warn('PTZ control failed', e);
    }
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="实时预览"
        subtitle={`共 ${devices.filter(d => d.status === 'online').length} 路在线视频`}
        breadcrumbs={[{ label: '实时预览' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-vms-surface border border-vms-border rounded-lg overflow-hidden">
              {GRID_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setGridSize(n)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors",
                    gridSize === n ? "bg-vms-primary text-white" : "text-vms-text-muted hover:text-vms-text"
                  )}
                >
                  <span className="font-mono">{n}画面</span>
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className={cn("lg:col-span-3", "relative", fullscreen ? "lg:col-span-4" : "")}>
          <div className={cn("grid gap-3", gridCols)} style={{ aspectRatio: fullscreen ? '16/9' : '' }}>
            {displayed.map((d, i) => (
              <div
                key={d.id}
                onClick={() => setSelected(d.id)}
                className={cn(
                  "relative aspect-video bg-black rounded-xl overflow-hidden border transition-all cursor-pointer group",
                  selected === d.id
                    ? "border-vms-primary shadow-vms-glow"
                    : "border-vms-border hover:border-vms-primary/50",
                  fullscreen === d.id && "fixed inset-4 z-50 w-auto h-auto z-50"
                )}
              >
                <div className="absolute inset-0 bg-vms-grid bg-vms-grid opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60">
                  <img
                  src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`security camera view of ${d.name} monitoring area, night vision style with infrared lighting, low light blue tint`)}&image_size=square_hd`}
                  alt={d.name}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-white font-medium">LIVE</span>
                  <DeviceStatusBadge status={d.status} className="text-[10px]" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                  <div className="text-xs text-white/80 font-mono">{d.name}</div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setFullscreen(fullscreen === d.id ? null : d.id); }}
                      className="p-1.5 rounded bg-black/40 hover:bg-black/60 text-white/80 hover:text-white"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {fullscreen === d.id && (
                  <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFullscreen(null); }}
                    className="px-3 py-1.5 bg-vms-danger text-white text-xs rounded-lg"
                  >
                    退出全屏
                  </button>
                </div>
                )}
              </div>
            ))}
            {Array.from({ length: gridSize - displayed.length }).map((_, i) => (
              <div key={`empty-${i}`} className="relative aspect-video bg-vms-surface/50 rounded-xl border border-vms-border border-dashed flex items-center justify-center">
                <div className="text-vms-text-muted text-sm">空闲窗口</div>
              </div>
            ))}
          </div>
        </div>

        {!fullscreen && (
          <div className="space-y-5">
            <div className="vms-card p-5">
              <h3 className="font-semibold text-white font-mono mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> 云台控制
            </h3>
            {selected ? (
              <div className="space-y-5">
                <div className="relative w-36 h-36 mx-auto">
                <div className="absolute inset-0 bg-vms-surface-2 rounded-full border border-vms-border" />
                <button
                  onClick={() => handlePTZ('up')}
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-vms-primary/20 hover:bg-vms-primary/40 flex items-center justify-center text-vms-text hover:text-white transition-colors"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePTZ('down')}
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-vms-primary/20 hover:bg-vms-primary/40 flex items-center justify-center text-vms-text hover:text-white transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePTZ('left')}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-vms-primary/20 hover:bg-vms-primary/40 flex items-center justify-center text-vms-text hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePTZ('right')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-vms-primary/20 hover:bg-vms-primary/40 flex items-center justify-center text-vms-text hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-vms-primary border border-vms-primary/50 flex items-center justify-center text-white text-xs font-mono">
                  PTZ
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-vms-text-muted">
                  <span>云台速度</span>
                  <span className="font-mono">{ptzSpeed}</span>
                </div>
                <input
                  type="range" min="10" max="100" step="10"
                  value={ptzSpeed}
                  onChange={(e) => setPtzSpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-vms-surface-2 rounded-lg appearance-none cursor-pointer accent-vms-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handlePTZ('zoomIn')} className="vms-btn-secondary text-xs py-2 flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> 放大
                </button>
                <button onClick={() => handlePTZ('zoomOut')} className="vms-btn-secondary text-xs py-2 flex items-center justify-center gap-1">
                  <Minus className="w-4 h-4" /> 缩小
                </button>
              </div>

              <div className="text-xs text-vms-text-muted p-3 bg-vms-surface-2 rounded-lg">
                当前控制: <span className="text-white">{devices.find(d => d.id === selected)?.name || '-'}</span>
              </div>
              </div>
            ) : (
              <div className="text-center py-8 text-vms-text-muted text-sm">
                点击左侧视频窗口以选中设备
              </div>
            )}
          </div>

          <div className="vms-card p-5 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-white font-mono mb-3">在线设备</h3>
            <div className="space-y-2">
              {devices.filter(d => d.status === 'online').map(d => (
                <div
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={cn(
                    "p-2.5 rounded-lg cursor-pointer transition-all",
                    selected === d.id
                      ? "bg-vms-primary/15 border border-vms-primary/30"
                      : "hover:bg-vms-surface-2"
                  )}
                >
                  <div className="text-sm text-white truncate">{d.name}</div>
                  <div className="text-xs text-vms-text-muted font-mono mt-0.5">{d.device_id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
