import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, X } from 'lucide-react';
import type { POIPoint } from '@/types';

interface POIConfigPanelProps {
  scenicName: string;
  pois: POIPoint[];
  tourOrder: string[];
  pendingLatLng: { lat: number; lng: number } | null;
  selectedPOIId: string | null;
  onAddPOI: (name: string, description: string, triggerRadius: number) => void;
  onDeletePOI: (id: string) => void;
  onSelectPOI: (id: string | null) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onCancelPending: () => void;
}

export default function POIConfigPanel({
  scenicName,
  pois,
  tourOrder,
  pendingLatLng,
  selectedPOIId,
  onAddPOI,
  onDeletePOI,
  onSelectPOI,
  onMoveUp,
  onMoveDown,
  onCancelPending,
}: POIConfigPanelProps) {
  const [form, setForm] = useState({ name: '', description: '', triggerRadius: 50 });

  const handleSubmit = () => {
    if (!form.name.trim() || !pendingLatLng) return;
    onAddPOI(form.name, form.description, form.triggerRadius);
    setForm({ name: '', description: '', triggerRadius: 50 });
  };

  const orderedPOIs = tourOrder
    .map((id, idx) => {
      const poi = pois.find((p) => p.id === id);
      return poi ? { ...poi, displayOrder: idx + 1 } : null;
    })
    .filter((p): p is POIPoint & { displayOrder: number } => !!p);

  const unmatchedPOIs = pois.filter((p) => !tourOrder.includes(p.id));

  return (
    <div className="flex w-[30%] min-w-[320px] flex-col border-l border-[var(--border)] bg-[var(--bg-card)]">
      <div className="border-b border-[var(--border)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">POI点位管理</h2>
        {scenicName && <p className="mt-1 text-sm text-amber-400">{scenicName}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">点位列表</h3>
        <div className="space-y-2">
          {orderedPOIs.map((poi, idx) => (
            <POIItem
              key={poi.id}
              poi={poi}
              displayOrder={poi.displayOrder}
              selected={poi.id === selectedPOIId}
              onSelect={() => onSelectPOI(poi.id)}
              onDelete={() => onDeletePOI(poi.id)}
              onMoveUp={idx > 0 ? () => onMoveUp(idx) : undefined}
              onMoveDown={idx < orderedPOIs.length - 1 ? () => onMoveDown(idx) : undefined}
            />
          ))}
          {unmatchedPOIs.map((poi) => (
            <POIItem
              key={poi.id}
              poi={poi}
              displayOrder={0}
              selected={poi.id === selectedPOIId}
              onSelect={() => onSelectPOI(poi.id)}
              onDelete={() => onDeletePOI(poi.id)}
            />
          ))}
          {pois.length === 0 && (
            <p className="py-4 text-center text-xs text-[var(--text-muted)]">点击地图添加POI点位</p>
          )}
        </div>

        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">导览动线顺序</h3>
          <div className="space-y-1">
            {orderedPOIs.map((poi, idx) => (
              <div key={poi.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-[var(--text-primary)]">
                <span className="text-xs text-amber-400">{idx + 1}.</span>
                <span className="flex-1 truncate">{poi.name}</span>
                <button onClick={idx > 0 ? () => onMoveUp(idx) : undefined} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30" disabled={idx === 0}>
                  <ChevronUp size={14} />
                </button>
                <button onClick={idx < orderedPOIs.length - 1 ? () => onMoveDown(idx) : undefined} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30" disabled={idx >= orderedPOIs.length - 1}>
                  <ChevronDown size={14} />
                </button>
              </div>
            ))}
            {orderedPOIs.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">暂无动线数据</p>
            )}
          </div>
        </div>
      </div>

      {pendingLatLng && (
        <div className="border-t border-[var(--border)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-amber-400">添加POI</h3>
            <button onClick={onCancelPending} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="点位名称"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-amber-600"
            />
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="点位描述"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-amber-600"
            />
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-xs text-[var(--text-secondary)]">触发半径</label>
              <input
                type="number"
                value={form.triggerRadius}
                onChange={(e) => setForm((p) => ({ ...p, triggerRadius: Number(e.target.value) }))}
                className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-amber-600"
              />
              <span className="text-xs text-[var(--text-muted)]">米</span>
            </div>
            <button
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
            >
              <Plus size={15} />
              确认添加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function POIItem({
  poi,
  displayOrder,
  selected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  poi: POIPoint;
  displayOrder: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
        selected
          ? 'border-amber-600/50 bg-amber-600/10'
          : 'border-[var(--border)] bg-white/[0.02] hover:bg-white/5'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {displayOrder > 0 && (
              <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                {displayOrder}
              </span>
            )}
            <span className="text-sm font-medium text-[var(--text-primary)]">{poi.name}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {poi.lat?.toFixed(5)}, {poi.lng?.toFixed(5)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <ChevronUp size={14} />
            </button>
          )}
          {onMoveDown && (
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <ChevronDown size={14} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded p-0.5 text-red-400/60 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
