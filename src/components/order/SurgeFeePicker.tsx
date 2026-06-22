import { useState } from 'react';
import { Zap, ChevronRight } from 'lucide-react';

interface SurgeFeePickerProps {
  value: number;
  onChange: (v: number) => void;
}

const presets = [
  { label: '不加价', value: 0, boost: 0 },
  { label: '+5 元', value: 5, boost: 25 },
  { label: '+10 元', value: 10, boost: 55 },
  { label: '+20 元', value: 20, boost: 85 },
];

export default function SurgeFeePicker({ value, onChange }: SurgeFeePickerProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const isPreset = presets.some((p) => p.value === value);
  const isCustom = value > 0 && !isPreset;

  const boostPct = isPreset
    ? presets.find((p) => p.value === value)!.boost
    : isCustom
    ? Math.min(95, Math.round(20 + value * 3.5))
    : 0;

  const handleCustomApply = () => {
    const n = Math.max(0, Math.min(200, parseInt(customInput || '0', 10) || 0));
    onChange(n);
    setCustomOpen(false);
    setCustomInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <Zap size={16} className="text-accent" fill="#FF6B1A" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">加急小费</div>
            <div className="text-xs text-white/50">适当加价提升接单速度</div>
          </div>
        </div>
        {boostPct > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30 text-accent text-xs font-bold animate-[boost_2s_ease-in-out_infinite]">
            <Zap size={12} fill="#FF6B1A" />
            <span>预计响应速度提升 {boostPct}%</span>
            <ChevronRight size={12} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {presets.map((p) => {
          const active = value === p.value;
          return (
            <button
              key={p.value}
              onClick={() => onChange(p.value)}
              className={`relative py-3 rounded-xl border text-sm font-semibold transition-all duration-200 overflow-hidden ${
                active
                  ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30 scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {active && (
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background:
                      'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                    animation: 'shimmer 1.8s linear infinite',
                  }}
                />
              )}
              <span className="relative z-10">{p.label}</span>
              {p.value > 0 && (
                <div
                  className={`relative z-10 mt-0.5 text-[10px] font-medium ${
                    active ? 'text-white/90' : 'text-accent/80'
                  }`}
                >
                  提速 {p.boost}%
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!customOpen ? (
        <button
          onClick={() => {
            setCustomOpen(true);
            setCustomInput(isCustom ? String(value) : '');
          }}
          className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all ${
            isCustom
              ? 'bg-accent/10 border-accent/40 text-accent'
              : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
          }`}
        >
          {isCustom ? `✓ 自定义 ¥${value}` : '自定义金额'}
        </button>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-primary/30">
          <span className="pl-2 text-white/60 text-sm font-semibold">¥</span>
          <input
            type="number"
            min={0}
            max={200}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="输入金额 (0-200)"
            className="flex-1 bg-transparent outline-none text-white text-sm font-semibold placeholder:text-white/30"
            autoFocus
          />
          <button
            onClick={() => {
              setCustomOpen(false);
              setCustomInput('');
            }}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:bg-white/10"
          >
            取消
          </button>
          <button
            onClick={handleCustomApply}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
          >
            确定
          </button>
        </div>
      )}

      {value > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-accent/10 to-orange-500/10 border border-accent/20">
          <div className="text-xs text-white/60">加价金额</div>
          <div className="text-lg font-bold bg-gradient-to-r from-accent to-orange-300 bg-clip-text text-transparent">
            +¥{value.toFixed(2)}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes boost {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
      `}</style>
    </div>
  );
}
