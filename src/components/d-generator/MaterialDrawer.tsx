import { useDGeneratorStore, MaterialCategory } from '@/store/dGeneratorStore';
import { X, Layers, PaintBucket, Sofa, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryConfig {
  key: MaterialCategory;
  label: string;
  icon: React.ComponentType<any>;
}

const categories: CategoryConfig[] = [
  { key: 'floor', label: '地板材质', icon: Layers },
  { key: 'wall', label: '墙面材质', icon: PaintBucket },
  { key: 'furniture', label: '家具材质', icon: Sofa },
];

export default function MaterialDrawer() {
  const { drawerOpen, toggleDrawer, materials, selectedMaterials, selectMaterial } = useDGeneratorStore();

  return (
    <>
      <button
        onClick={toggleDrawer}
        className={cn(
          'absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 shadow-card border border-wood-200',
          drawerOpen
            ? 'bg-white'
            : 'bg-white/90 backdrop-blur hover:bg-white hover:shadow-card-hover'
        )}
      >
        <Layers className="w-4.5 h-4.5 text-terracotta-600" />
        <span className="text-sm font-medium text-carbon-700">材质</span>
        <div className="flex -space-x-1">
          {categories.map(({ key }) => {
            const mat = materials[key].find(m => m.id === selectedMaterials[key]);
            return (
              <span
                key={key}
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ background: mat?.color || '#ccc' }}
              />
            );
          })}
        </div>
      </button>

      <div
        className={cn(
          'absolute top-0 right-0 h-full z-20 transition-all duration-500 ease-out',
          drawerOpen ? 'w-80' : 'w-0 pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-white/80 backdrop-blur-xl border-l border-wood-200 shadow-2xl transition-opacity duration-300 overflow-hidden',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="w-80 h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-wood-100">
              <div>
                <h3 className="font-bold text-carbon-800 text-lg">材质选择</h3>
                <p className="text-xs text-carbon-500 mt-0.5">点击替换场景中的材质</p>
              </div>
              <button
                onClick={toggleDrawer}
                className="p-2 rounded-lg hover:bg-wood-50 text-carbon-500 hover:text-carbon-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-6">
              {categories.map(({ key, label, icon: Icon }) => {
                const options = materials[key];
                const selected = selectedMaterials[key];

                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-terracotta-600" />
                      <h4 className="font-semibold text-carbon-700 text-sm">{label}</h4>
                      <span className="text-xs text-carbon-400 ml-auto">{options.length} 种</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {options.map((opt) => {
                        const isSelected = selected === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => selectMaterial(key, opt.id)}
                            className={cn(
                              'group relative rounded-xl p-2 transition-all duration-200 border-2',
                              isSelected
                                ? 'border-transparent shadow-md shadow-terracotta-500/20 bg-ivory-50'
                                : 'border-wood-100 hover:border-wood-300 bg-white hover:shadow-sm'
                            )}
                          >
                            {isSelected && (
                              <div
                                className="absolute inset-0 rounded-xl border-2"
                                style={{ borderColor: '#CBA356' }}
                              />
                            )}
                            <div
                              className={cn(
                                'w-full aspect-square rounded-lg mb-2 shadow-inner transition-transform group-hover:scale-95',
                                isSelected && 'ring-2 ring-offset-2'
                              )}
                              style={{
                                background: `linear-gradient(135deg, ${opt.color} 0%, ${adjustBrightness(opt.color, -20)} 100%)`,
                                boxShadow: `inset 0 2px 8px rgba(0,0,0,0.08)`,
                                // @ts-ignore
                                '--tw-ring-color': '#CBA356',
                              }}
                            />
                            <p className={cn(
                              'text-[11px] font-medium truncate text-center transition-colors',
                              isSelected ? 'text-terracotta-700' : 'text-carbon-600 group-hover:text-carbon-800'
                            )}>
                              {opt.name}
                            </p>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-sm">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-wood-100 bg-ivory-50/50">
              <div className="flex items-center justify-between text-xs text-carbon-500 mb-2">
                <span>当前方案已选材质</span>
                <button
                  onClick={() => {
                    selectMaterial('floor', 'f1');
                    selectMaterial('wall', 'w1');
                    selectMaterial('furniture', 'fu1');
                  }}
                  className="text-terracotta-600 hover:text-terracotta-700 font-medium"
                >
                  重置默认
                </button>
              </div>
              <div className="flex gap-2">
                {categories.map(({ key, label }) => {
                  const mat = materials[key].find(m => m.id === selectedMaterials[key]);
                  return (
                    <div key={key} className="flex-1 bg-white rounded-lg p-2 border border-wood-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-3 h-3 rounded-sm shadow-sm"
                          style={{ background: mat?.color }}
                        />
                        <span className="text-[10px] text-carbon-500">{label}</span>
                      </div>
                      <p className="text-xs font-medium text-carbon-700 truncate">{mat?.name || '-'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
