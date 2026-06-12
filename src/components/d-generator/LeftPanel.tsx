import { useDGeneratorStore, StyleType, LightMode, ViewMode } from '@/store/dGeneratorStore';
import { styleConfigs, lightConfigs } from '@/config/styleConfigs';
import {
  ChevronLeft,
  ChevronRight,
  Settings2,
  Home,
  Maximize2,
  Sun,
  Eye,
  Palette,
  Layers,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<any>; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-4 h-4 text-terracotta-600" />
        <h4 className="font-semibold text-carbon-700 text-sm">{title}</h4>
      </div>
      <div className="space-y-2.5 pl-6">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-carbon-500">{label}</span>
      <span className="text-xs font-medium text-carbon-700">{value}</span>
    </div>
  );
}

export default function LeftPanel() {
  const {
    step,
    panelCollapsed,
    togglePanel,
    rooms,
    selectedStyle,
    lightMode,
    isDay,
    viewMode,
    autoArranged,
    selectedMaterials,
    materials,
  } = useDGeneratorStore();

  const style = styleConfigs[selectedStyle as StyleType];
  const light = isDay ? lightConfigs[lightMode as LightMode] : { ambientIntensity: 0.15, directionalIntensity: 0.3 };
  void light;

  const totalArea = rooms.reduce((s, r) => s + r.width * r.height, 0);

  const viewModeLabel: Record<ViewMode, string> = {
    top: '俯视图',
    front: '正视图',
    roam: '漫游视角',
  };

  const lightModeLabel: Record<LightMode, string> = {
    natural: '自然白光',
    warm: '暖黄灯光',
    cool: '冷白灯光',
  };

  const floorMat = materials.floor.find((m) => m.id === selectedMaterials.floor);
  const wallMat = materials.wall.find((m) => m.id === selectedMaterials.wall);
  const furnMat = materials.furniture.find((m) => m.id === selectedMaterials.furniture);

  return (
    <>
      <button
        onClick={togglePanel}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 z-30 w-6 h-16 flex items-center justify-center transition-all duration-300',
          'bg-white/90 backdrop-blur border border-wood-200 hover:bg-white hover:shadow-md',
          panelCollapsed
            ? 'left-0 rounded-r-xl'
            : 'left-[280px] rounded-r-xl shadow-sm'
        )}
        title={panelCollapsed ? '展开参数面板' : '收起参数面板'}
      >
        {panelCollapsed ? (
          <ChevronRight className="w-4 h-4 text-carbon-500" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-carbon-500" />
        )}
      </button>

      <div
        className={cn(
          'absolute top-0 left-0 h-full z-20 transition-all duration-500 ease-out',
          panelCollapsed ? 'w-0 pointer-events-none' : 'w-[280px]'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-white/85 backdrop-blur-xl border-r border-wood-200 shadow-xl transition-opacity duration-300 overflow-hidden',
            panelCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          <div className="w-[280px] h-full flex flex-col">
            <div className="px-5 py-4 border-b border-wood-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 flex items-center justify-center shadow-md shadow-terracotta-500/20">
                  <Settings2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-carbon-800">参数面板</h3>
                  <p className="text-[11px] text-carbon-500">当前步骤 {step}/3</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-5 space-y-6">
              <Section title="户型总览" icon={Home}>
                <Row label="房间总数" value={`${rooms.length} 间`} />
                <Row label="总面积" value={`${totalArea.toFixed(1)} m²`} />
                <div className="pt-2 space-y-1.5">
                  {rooms.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-ivory-50 border border-wood-100"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: style.accent }}
                      />
                      <span className="text-xs text-carbon-600 flex-1">{r.name}</span>
                      <span className="text-xs text-carbon-400 font-mono">
                        {r.width}×{r.height}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              {step === 3 && (
                <>
                  <Section title="风格设置" icon={Palette}>
                    <Row label="当前风格" value={style.name} />
                    <div className="flex gap-1.5 pt-1">
                      <span
                        className="flex-1 h-8 rounded-lg shadow-inner"
                        style={{ background: style.floor }}
                        title="地板色"
                      />
                      <span
                        className="flex-1 h-8 rounded-lg shadow-inner"
                        style={{ background: style.wall }}
                        title="墙面色"
                      />
                      <span
                        className="flex-1 h-8 rounded-lg shadow-inner"
                        style={{ background: style.furniture }}
                        title="家具色"
                      />
                      <span
                        className="flex-1 h-8 rounded-lg shadow-inner"
                        style={{ background: style.accent }}
                        title="强调色"
                      />
                    </div>
                  </Section>

                  <Section title="相机视角" icon={Eye}>
                    <Row label="当前视角" value={viewModeLabel[viewMode as ViewMode]} />
                    <Row label="视角高度" value={viewMode === 'top' ? '15m (鸟瞰)' : viewMode === 'front' ? '2.5m' : '8m (45°)'} />
                  </Section>

                  <Section title="光照环境" icon={Sun}>
                    <Row label="时段" value={isDay ? '☀️ 白天' : '🌙 夜晚'} />
                    <Row label="光照类型" value={isDay ? lightModeLabel[lightMode as LightMode] : '室内照明'} />
                    <Row label="辅助灯" value={isDay ? '半球光 + 方向光' : '多点光源'} />
                  </Section>

                  <Section title="材质状态" icon={Layers}>
                    <div className="space-y-1.5 pt-1">
                      {[
                        { name: '地板', mat: floorMat },
                        { name: '墙面', mat: wallMat },
                        { name: '家具', mat: furnMat },
                      ].map(({ name, mat }) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 p-2 rounded-lg bg-ivory-50 border border-wood-100"
                        >
                          <span
                            className="w-6 h-6 rounded-md shadow-sm border border-wood-200 flex-shrink-0"
                            style={{ background: mat?.color }}
                          />
                          <span className="text-xs text-carbon-500 flex-1">{name}</span>
                          <span className="text-xs font-medium text-carbon-700">{mat?.name}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="布置状态" icon={Maximize2}>
                    <Row label="自动布置" value={autoArranged ? '✅ 已完成' : '⏳ 待执行'} />
                    <Row label="家具数量" value="14 件" />
                    <Row label="后期特效" value="SSAO + Bloom + Vignette" />
                  </Section>
                </>
              )}

              {step < 3 && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-ivory-100 to-ivory-50 border border-wood-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-haze-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-carbon-600 leading-relaxed">
                      {step === 1
                        ? '请上传清晰的户型图，AI 将自动识别墙体结构、门窗位置和房间功能分区。'
                        : '调整房间尺寸和门窗数量，平面预览图将实时同步更新。'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-wood-100 bg-ivory-50/50">
              <div className="flex items-center justify-between text-[10px] text-carbon-400">
                <span>D-Generator v1.0</span>
                <span>3D Real-time Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
