import { StyleType, useDGeneratorStore } from '@/store/dGeneratorStore';
import { styleConfigs } from '@/config/styleConfigs';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

const styleKeys: StyleType[] = ['modern', 'nordic', 'chinese', 'luxury', 'industrial', 'japanese', 'mediterranean'];

export default function StyleSelector() {
  const { selectedStyle, setSelectedStyle } = useDGeneratorStore();

  return (
    <div className="px-6 py-4 bg-white/80 backdrop-blur border-b border-wood-200">
      <div className="flex items-center gap-3 mb-3">
        <Sparkles className="w-5 h-5 text-terracotta-500" />
        <h3 className="font-semibold text-carbon-800">选择风格</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {styleKeys.map((key) => {
          const cfg = styleConfigs[key];
          const isSelected = selectedStyle === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedStyle(key)}
              className={cn(
                'flex-shrink-0 relative rounded-card p-3 border-2 transition-all duration-300 group',
                'w-36 text-left',
                isSelected
                  ? 'scale-105 border-transparent'
                  : 'border-wood-200 hover:border-wood-300 bg-white hover:shadow-card-hover'
              )}
            >
              {isSelected && (
                <>
                  <div className="absolute inset-0 rounded-card animate-pulse-slow" style={{
                    boxShadow: '0 0 20px rgba(203, 163, 86, 0.3), inset 0 0 12px rgba(203, 163, 86, 0.15)'
                  }} />
                  <div className="absolute inset-0 rounded-card border-2" style={{ borderColor: '#CBA356' }} />
                </>
              )}
              <div
                className="relative w-full h-14 rounded-lg mb-2 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${cfg.wall} 0%, ${cfg.floor} 60%, ${cfg.accent} 100%)` }}
              >
                <div className="absolute top-2 right-2 text-lg">{cfg.icon}</div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <span className="w-3 h-3 rounded-full border border-white/50" style={{ background: cfg.accent }} />
                  <span className="w-3 h-3 rounded-full border border-white/50" style={{ background: cfg.furniture }} />
                </div>
              </div>
              <p className={cn(
                'relative text-sm font-medium transition-colors',
                isSelected ? 'text-terracotta-700' : 'text-carbon-700 group-hover:text-carbon-800'
              )}>
                {cfg.name}
              </p>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-terracotta-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
