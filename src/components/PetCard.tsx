import { useNavigate } from 'react-router-dom';
import { Heart, Syringe, Bug, ChevronRight, PawPrint, Calendar, Thermometer, AlertCircle, Stethoscope, MapPin } from 'lucide-react';
import type { Pet } from '@shared/types';
import { cn } from '@/lib/utils';

interface PetCardProps {
  pet: Pet;
  compact?: boolean;
}

const speciesMap: Record<Pet['species'], string> = {
  dog: '狗狗',
  cat: '猫咪',
  rabbit: '兔子',
  bird: '鸟类',
  other: '其他',
};

const healthStatusMap = {
  healthy: { label: '健康', className: 'tag-green' },
  sick: { label: '患病中', className: 'tag-orange' },
  chronic: { label: '慢性病', className: 'bg-gray-100 text-gray-600' },
};

export default function PetCard({ pet, compact }: PetCardProps) {
  const navigate = useNavigate();
  const status = healthStatusMap[pet.healthStatus];

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/pets/${pet.id}`)}
        className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-colors w-full text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {pet.avatar ? (
            <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <PawPrint className="w-6 h-6 text-forest-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{pet.name}</p>
          <p className="text-xs text-gray-500">{speciesMap[pet.species]} · {pet.breed}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  return (
    <div
      onClick={() => navigate(`/pets/${pet.id}`)}
      className="card cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-forest-100 flex items-center justify-center overflow-hidden">
            {pet.avatar ? (
              <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-8 h-8 text-forest-500" />
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900">{pet.name}</h3>
            <p className="text-sm text-gray-500">
              {speciesMap[pet.species]} · {pet.breed}
            </p>
          </div>
        </div>
        <span className={cn('tag', status.className)}>{status.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">年龄</p>
          <p className="font-semibold text-gray-900 text-sm">
            {Math.floor((Date.now() - new Date(pet.birthday).getTime()) / 31536000000)} 岁
          </p>
        </div>
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">体重</p>
          <p className="font-semibold text-gray-900 text-sm">{pet.weight} kg</p>
        </div>
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">性别</p>
          <p className="font-semibold text-gray-900 text-sm">
            {pet.gender === 'male' ? '公' : '母'}
          </p>
        </div>
      </div>

      {/* 健康数据概览模板 */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-forest-50 to-cream-50 border border-forest-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-forest-700">
            <Thermometer className="w-3.5 h-3.5" /> 健康数据模板
          </div>
          <span className="text-[10px] text-forest-600">模板ID: HT-{pet.id.padStart(6, '0')}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">体温</p>
            <p className="text-[11px] font-semibold text-gray-800">38.6°C</p>
          </div>
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">心率</p>
            <p className="text-[11px] font-semibold text-gray-800">102/min</p>
          </div>
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">体重趋势</p>
            <p className="text-[11px] font-semibold text-forest-600">+0.3kg</p>
          </div>
        </div>
      </div>

      {/* 病中状态跟踪 */}
      {pet.healthStatus === 'sick' && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-warm-700">
            <AlertCircle className="w-3.5 h-3.5" /> 病中状态跟踪
          </div>
          <div className="text-[11px] text-gray-700 space-y-0.5">
            <p className="flex items-center gap-1">
              <Stethoscope className="w-3 h-3 text-warm-600" />
              诊断：<span className="font-semibold">急性肠胃炎</span>
            </p>
            <p className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-warm-600" />
              复诊：<span className="font-semibold text-warm-700">2026-06-22</span> · 已预约
            </p>
          </div>
        </div>
      )}

      {/* 疫苗/驱虫/体检提醒联动 */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-forest-50/60">
          <Syringe className="w-3.5 h-3.5 text-forest-500 shrink-0" />
          <span className="text-[11px] text-gray-700 flex-1">
            疫苗 {pet.vaccineRecords.length} 次 · 下次加强
            <span className="font-semibold text-forest-700 ml-1">2026-01-15</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/hospitals'); }}
            className="px-2 py-0.5 rounded-md bg-forest-500 text-white text-[10px] font-semibold hover:bg-forest-600 transition-colors inline-flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" /> 预约接种
          </button>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-warm-50/60">
          <Bug className="w-3.5 h-3.5 text-warm-500 shrink-0" />
          <span className="text-[11px] text-gray-700 flex-1">
            驱虫 {pet.dewormingRecords.length} 次 · 下次驱虫
            <span className="font-semibold text-warm-700 ml-1">2025-06-01</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/products'); }}
            className="px-2 py-0.5 rounded-md bg-warm-500 text-white text-[10px] font-semibold hover:bg-warm-600 transition-colors"
          >
            去购药
          </button>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-pink-50/60">
          <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span className="text-[11px] text-gray-700 flex-1">
            年度体检 · 上次
            <span className="font-semibold text-pink-700 ml-1">2025-03-10</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/hospitals'); }}
            className="px-2 py-0.5 rounded-md bg-pink-500 text-white text-[10px] font-semibold hover:bg-pink-600 transition-colors inline-flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" /> 预约体检
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-forest-50">
        <div className="ml-auto flex items-center gap-1 text-forest-600 group-hover:text-forest-500 transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-xs font-medium">查看完整健康档案</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
