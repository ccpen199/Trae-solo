import { ViewMode, LightMode, useDGeneratorStore } from '@/store/dGeneratorStore';
import {
  LayoutGrid,
  Eye,
  Move3D,
  Sun,
  Lightbulb,
  Snowflake,
  Moon,
  Sunrise,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewBtn {
  mode: ViewMode;
  icon: React.ComponentType<any>;
  label: string;
}

const viewButtons: ViewBtn[] = [
  { mode: 'top', icon: LayoutGrid, label: '俯视' },
  { mode: 'front', icon: Eye, label: '正视' },
  { mode: 'roam', icon: Move3D, label: '漫游' },
];

interface LightBtn {
  mode: LightMode;
  icon: React.ComponentType<any>;
  label: string;
}

const lightButtons: LightBtn[] = [
  { mode: 'natural', icon: Sun, label: '自然光' },
  { mode: 'warm', icon: Lightbulb, label: '暖黄光' },
  { mode: 'cool', icon: Snowflake, label: '冷白光' },
];

function ToolGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-carbon-400 mr-1 font-medium">{title}</span>
      {children}
    </div>
  );
}

function IconButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 group',
        active
          ? 'bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white shadow-md shadow-terracotta-500/30'
          : 'bg-white/80 backdrop-blur text-carbon-600 hover:bg-white hover:text-carbon-800 border border-wood-200 hover:shadow-md'
      )}
    >
      <Icon className="w-4.5 h-4.5" strokeWidth={active ? 2.2 : 1.8} />
      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-carbon-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-white/90 px-1.5 py-0.5 rounded border border-wood-100">
        {label}
      </span>
    </button>
  );
}

export default function ControlToolbar() {
  const {
    viewMode,
    setViewMode,
    lightMode,
    setLightMode,
    isDay,
    toggleDayNight,
    triggerAutoArrange,
    autoArranged,
  } = useDGeneratorStore();

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
      <div className="bg-white/70 backdrop-blur-xl rounded-xl p-3 shadow-card border border-wood-100/50 flex flex-col gap-3">
        <ToolGroup title="视角">
          {viewButtons.map(({ mode, icon, label }) => (
            <IconButton
              key={mode}
              active={viewMode === mode}
              onClick={() => setViewMode(mode)}
              icon={icon}
              label={label}
            />
          ))}
        </ToolGroup>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-wood-200 to-transparent" />

        <ToolGroup title="光照">
          {lightButtons.map(({ mode, icon, label }) => (
            <IconButton
              key={mode}
              active={lightMode === mode}
              onClick={() => setLightMode(mode)}
              icon={icon}
              label={label}
            />
          ))}
        </ToolGroup>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-wood-200 to-transparent" />

        <ToolGroup title="昼夜">
          <button
            onClick={toggleDayNight}
            title={isDay ? '切换夜晚' : '切换白天'}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 group',
              isDay
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-400/30'
                : 'bg-gradient-to-br from-indigo-500 to-slate-700 text-white shadow-md shadow-indigo-500/30'
            )}
          >
            {isDay ? <Sunrise className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </ToolGroup>
      </div>

      <button
        onClick={triggerAutoArrange}
        className={cn(
          'group relative overflow-hidden rounded-xl p-3.5 shadow-lg transition-all duration-300',
          autoArranged
            ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30'
            : 'bg-gradient-to-br from-terracotta-500 via-terracotta-600 to-terracotta-700 hover:from-terracotta-600 hover:via-terracotta-700 hover:to-terracotta-800 shadow-terracotta-500/40 hover:shadow-terracotta-500/50 hover:scale-[1.02]'
        )}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-2.5 text-white">
          <Wand2 className={cn('w-5 h-5', autoArranged ? '' : 'animate-pulse-slow')} />
          <div className="text-left">
            <div className="text-sm font-bold leading-tight">
              {autoArranged ? '已布置' : '自动布置'}
            </div>
            <div className="text-[10px] opacity-80 leading-tight">
              {autoArranged ? '点击重新布置' : '一键生成方案'}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
