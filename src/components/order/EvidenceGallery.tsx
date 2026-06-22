import { useState } from 'react';
import { Plus, X, ZoomIn, Receipt, FileSignature, FileImage } from 'lucide-react';
import { OrderEvidence } from '../../types';

interface EvidenceGalleryProps {
  evidences: OrderEvidence[];
  onAddClick?: () => void;
}

const typeMeta: Record<string, { label: string; icon: React.ReactNode; tint: string }> = {
  receipt: { label: '购物小票', icon: <Receipt size={14} />, tint: 'from-emerald-500/80 to-teal-500/80' },
  signature: { label: '签收凭证', icon: <FileSignature size={14} />, tint: 'from-accent/80 to-orange-500/80' },
  other: { label: '其他凭证', icon: <FileImage size={14} />, tint: 'from-primary/80 to-indigo-500/80' },
};

export default function EvidenceGallery({ evidences, onAddClick }: EvidenceGalleryProps) {
  const [preview, setPreview] = useState<OrderEvidence | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {evidences.map((ev) => {
          const meta = typeMeta[ev.type] || typeMeta.other;
          return (
            <div
              key={ev.id}
              className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer"
            >
              <img
                src={ev.imageUrl}
                alt={meta.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />

              <div className={`absolute inset-x-0 top-0 p-2 bg-gradient-to-b ${meta.tint} to-transparent`}>
                <div className="flex items-center gap-1 text-white text-[11px] font-medium drop-shadow">
                  {meta.icon}
                  <span>{meta.label}</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={() => setPreview(ev)}
                  className="w-11 h-11 rounded-full bg-white/95 text-dark flex items-center justify-center shadow-xl hover:scale-110 hover:bg-white transition-all"
                >
                  <ZoomIn size={20} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          );
        })}

        {onAddClick && (
          <button
            onClick={onAddClick}
            className="group relative aspect-square rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] hover:bg-primary/10 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 text-white/40 hover:text-primary"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
              <Plus size={22} strokeWidth={2} />
            </div>
            <div className="text-xs font-medium">新增凭证</div>
          </button>
        )}

        {evidences.length === 0 && !onAddClick && (
          <div className="col-span-3 aspect-[3/1] rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-white/30">
            <FileImage size={32} strokeWidth={1.5} />
            <div className="text-sm">暂无凭证</div>
          </div>
        )}
      </div>

      {preview && <PreviewModal evidence={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

function PreviewModal({ evidence, onClose }: { evidence: OrderEvidence; onClose: () => void }) {
  const meta = typeMeta[evidence.type] || typeMeta.other;
  const date = evidence.uploadedAt instanceof Date ? evidence.uploadedAt : new Date(evidence.uploadedAt);
  const dateText = isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
        .getDate()
        .toString()
        .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] bg-dark rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.tint} flex items-center justify-center text-white`}
            >
              {meta.icon}
            </div>
            <div>
              <div className="font-semibold text-white">{meta.label}</div>
              <div className="text-xs text-white/50">{dateText}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-black/30 flex items-center justify-center max-h-[calc(90vh-80px)] overflow-auto">
          <img
            src={evidence.imageUrl}
            alt={meta.label}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
