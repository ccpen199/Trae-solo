import {
  Wind,
  Gauge,
  Sun,
  Thermometer,
  Shirt,
  Car,
  Dumbbell,
  Heart,
  Sun as SunIcon,
  Plane,
  Bus,
  Smile,
  Info,
} from 'lucide-react';
import type { LifeIndex, LifeIndexType } from '../../shared/types';
import { cn } from '../lib/utils';

interface LifeIndexGridProps {
  data: LifeIndex[];
  loading?: boolean;
  className?: string;
}

const indexConfig: Record<LifeIndexType, { icon: React.FC<{ className?: string }>; label: string }> = {
  aqi: { icon: Wind, label: '空气质量' },
  pm25: { icon: Gauge, label: 'PM2.5' },
  uv: { icon: Sun, label: '紫外线' },
  feels_like: { icon: Thermometer, label: '体感温度' },
  dressing: { icon: Shirt, label: '穿衣指数' },
  car_wash: { icon: Car, label: '洗车指数' },
  sports: { icon: Dumbbell, label: '运动指数' },
  cold: { icon: Heart, label: '感冒指数' },
  drying: { icon: SunIcon, label: '晾晒指数' },
  travel: { icon: Plane, label: '旅游指数' },
  traffic: { icon: Bus, label: '交通指数' },
  comfort: { icon: Smile, label: '舒适度' },
};

function getLevelColor(levelCode: number): { bg: string; text: string; border: string; dot: string } {
  if (levelCode <= 1) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' };
  if (levelCode <= 2) return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' };
  if (levelCode <= 3) return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400' };
  if (levelCode <= 4) return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400' };
  return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' };
}

function IndexCard({ index }: { index: LifeIndex }) {
  const config = indexConfig[index.type as LifeIndexType] || { icon: Info, label: index.name };
  const Icon = config.icon;
  const colors = getLevelColor(index.levelCode);

  return (
    <div
      className={cn(
        'glass-card p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group',
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', colors.dot)}></span>
          <span className={cn('text-xs font-medium', colors.text)}>{index.level}</span>
        </div>
      </div>
      
      <p className="text-slate-400 text-sm mb-1">{config.label}</p>
      <p className={cn('text-xl font-bold', colors.text)}>
        {index.value}
      </p>
      <p className="text-xs text-slate-500 mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {index.description}
      </p>
    </div>
  );
}

export default function LifeIndexGrid({ data, loading, className }: LifeIndexGridProps) {
  if (loading || data.length === 0) {
    return (
      <div className={cn('glass-card p-6', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-700/50"></div>
          <div>
            <div className="h-5 w-32 bg-slate-700/50 rounded-lg mb-1"></div>
            <div className="h-4 w-24 bg-slate-700/30 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-700/30 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const sortedIndices = (Object.keys(indexConfig) as LifeIndexType[]).map((type) => 
    data.find((item) => item.type === type) || {
      type,
      name: indexConfig[type].label,
      value: '--',
      level: '未知',
      levelCode: 0,
      description: '暂无数据',
      updateTime: '',
    }
  );

  return (
    <div className={cn('glass-card p-6', className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-400/20 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">生活指数</h3>
          <p className="text-xs text-slate-400">12项生活健康指数</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {sortedIndices.map((index) => (
          <IndexCard key={index.type} index={index as LifeIndex} />
        ))}
      </div>
    </div>
  );
}
