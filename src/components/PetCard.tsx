import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Syringe, Bug, ChevronRight, PawPrint, Calendar, Thermometer,
  AlertCircle, Stethoscope, MapPin, FileText, Pill, Activity,
  CheckCircle2, Clock, ArrowRight, ShoppingCart,
} from 'lucide-react';
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

interface TimelineEntry {
  id: string;
  date: string;
  type: 'vaccine' | 'deworm' | 'checkup' | 'consultation' | 'prescription' | 'followup' | 'template';
  title: string;
  detail: string;
  status: 'completed' | 'overdue' | 'scheduled' | 'active';
  linkedId?: string;
  linkedLabel?: string;
  linkedRoute?: string;
}

const petTimelines: Record<string, TimelineEntry[]> = {
  '1': [
    { id: 'tl-1-1', date: '2025-01-15', type: 'vaccine', title: '狂犬疫苗接种', detail: '接种狂犬疫苗（瑞比克）· 爱宠动物医院总院 · 医师王建国签名', status: 'completed', linkedId: 'RX-20250115', linkedLabel: '查看处方', linkedRoute: '/products' },
    { id: 'tl-1-2', date: '2025-03-01', type: 'deworm', title: '体内驱虫', detail: '拜宠清口服 · 体重28.2kg · 下次到期2025-06-01', status: 'completed', linkedId: 'd1', linkedLabel: '购药记录', linkedRoute: '/products' },
    { id: 'tl-1-3', date: '2025-06-01', type: 'deworm', title: '体内驱虫（已逾期381天）', detail: '拜宠清 · 到期日2025-06-01 · 长期未驱虫风险', status: 'overdue', linkedLabel: '立即购药', linkedRoute: '/products' },
    { id: 'tl-1-4', date: '2025-03-10', type: 'checkup', title: '年度健康体检', detail: '血常规/生化/DR胸部正位 · 体温38.6°C · 心率102/min · 体重28.5kg', status: 'completed', linkedId: 'HT-000001', linkedLabel: '查看健康模板', linkedRoute: `/pets/1` },
    { id: 'tl-1-5', date: '2026-01-15', type: 'vaccine', title: '狂犬疫苗加强', detail: '年度加强免疫 · 到期接种', status: 'scheduled', linkedLabel: '预约接种', linkedRoute: '/hospitals' },
  ],
  '2': [
    { id: 'tl-2-1', date: '2025-06-10', type: 'checkup', title: '新宠入户体检', detail: '基础体检+猫瘟检测 · 体温38.8°C · 心率140/min · 体重4.2kg', status: 'completed', linkedId: 'HT-000002', linkedLabel: '查看健康模板', linkedRoute: '/pets/2' },
  ],
  '3': [
    { id: 'tl-3-1', date: '2026-06-10', type: 'consultation', title: '在线问诊 · 急性肠胃炎', detail: '主诉：腹泻、精神萎靡 · 诊断：急性肠胃炎 · 医师王建国签名 ✓ · 宠主确认 ✓', status: 'completed', linkedId: 'CS-20260610-001', linkedLabel: '问诊详情', linkedRoute: '/hospitals' },
    { id: 'tl-3-2', date: '2026-06-10', type: 'prescription', title: '处方开具 · 肠胃炎用药', detail: '蒙脱石散+益生菌+消炎药 · 医生签名 ✓ · 宠主确认 ✓ · 已发货', status: 'completed', linkedId: 'RX-20260610', linkedLabel: '查看处方', linkedRoute: '/products' },
    { id: 'tl-3-3', date: '2026-06-22', type: 'followup', title: '复诊预约 · 肠胃炎复查', detail: '爱宠动物医院总院 · 医师王建国 · 已预约', status: 'scheduled', linkedLabel: '查看预约', linkedRoute: '/calendar' },
    { id: 'tl-3-4', date: '2026-06-10', type: 'template', title: '健康模板更新', detail: '体温39.5°C（发热）· 心率125/min（偏高）· 体重2.1kg · 体重趋势 -0.2kg', status: 'active', linkedId: 'HT-000003', linkedLabel: '模板维护', linkedRoute: '/pets/3' },
  ],
};

const typeConfig: Record<TimelineEntry['type'], { color: string; bgColor: string; Icon: React.ComponentType<{ className?: string }> }> = {
  vaccine: { color: 'text-forest-600', bgColor: 'bg-forest-100', Icon: Syringe },
  deworm: { color: 'text-warm-600', bgColor: 'bg-warm-100', Icon: Bug },
  checkup: { color: 'text-blue-600', bgColor: 'bg-blue-100', Icon: Thermometer },
  consultation: { color: 'text-purple-600', bgColor: 'bg-purple-100', Icon: Stethoscope },
  prescription: { color: 'text-rose-600', bgColor: 'bg-rose-100', Icon: Pill },
  followup: { color: 'text-sky-600', bgColor: 'bg-sky-100', Icon: Calendar },
  template: { color: 'text-teal-600', bgColor: 'bg-teal-100', Icon: FileText },
};

const statusBadge: Record<TimelineEntry['status'], { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-forest-100 text-forest-700' },
  overdue: { label: '已逾期', className: 'bg-red-100 text-red-700' },
  scheduled: { label: '已预约', className: 'bg-blue-100 text-blue-700' },
  active: { label: '进行中', className: 'bg-warm-100 text-warm-700' },
};

export default function PetCard({ pet, compact }: PetCardProps) {
  const navigate = useNavigate();
  const [showTimeline, setShowTimeline] = useState(false);
  const status = healthStatusMap[pet.healthStatus];
  const timeline = petTimelines[pet.id] || [];

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
    <div className="card">
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
            <p className={cn('text-[11px] font-semibold', pet.healthStatus === 'sick' ? 'text-red-600' : 'text-gray-800')}>
              {pet.healthStatus === 'sick' ? '39.5°C' : '38.6°C'}
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">心率</p>
            <p className={cn('text-[11px] font-semibold', pet.healthStatus === 'sick' ? 'text-warm-600' : 'text-gray-800')}>
              {pet.healthStatus === 'sick' ? '125/min' : '102/min'}
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">体重趋势</p>
            <p className={cn('text-[11px] font-semibold', pet.healthStatus === 'sick' ? 'text-red-600' : 'text-forest-600')}>
              {pet.healthStatus === 'sick' ? '-0.2kg' : '+0.3kg'}
            </p>
          </div>
        </div>
      </div>

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
              <Pill className="w-3 h-3 text-warm-600" />
              处方：<span className="font-semibold">蒙脱石散+益生菌+消炎药</span> · 双签 ✓
            </p>
            <p className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-warm-600" />
              复诊：<span className="font-semibold text-warm-700">2026-06-22</span> · 已预约
            </p>
          </div>
        </div>
      )}

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
            <span className="font-semibold text-red-600 ml-1">已逾期381天</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/products'); }}
            className="px-2 py-0.5 rounded-md bg-warm-500 text-white text-[10px] font-semibold hover:bg-warm-600 transition-colors inline-flex items-center gap-1"
          >
            <ShoppingCart className="w-3 h-3" /> 去购药
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

      <button
        onClick={(e) => { e.stopPropagation(); setShowTimeline(!showTimeline); }}
        className="w-full mb-3 py-2 rounded-xl bg-gradient-to-r from-forest-50 to-cream-50 hover:from-forest-100 hover:to-cream-100 border border-forest-100 transition-colors inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-forest-700"
      >
        <Activity className="w-3.5 h-3.5" />
        {showTimeline ? '收起生命周期记录' : `展开生命周期记录 (${timeline.length}条)`}
        <ChevronRight className={cn('w-3 h-3 transition-transform', showTimeline && 'rotate-90')} />
      </button>

      {showTimeline && timeline.length > 0 && (
        <div className="space-y-0 mb-3">
          {timeline.map((entry, idx) => {
            const config = typeConfig[entry.type];
            const badge = statusBadge[entry.status];
            return (
              <div key={entry.id} className="flex gap-2.5">
                <div className="flex flex-col items-center">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', config.bgColor)}>
                    <config.Icon className={cn('w-3.5 h-3.5', config.color)} />
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-200 to-gray-100 my-0.5" />
                  )}
                </div>
                <div className={cn('flex-1 pb-3', idx === timeline.length - 1 && 'pb-0')}>
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-900">{entry.title}</span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', badge.className)}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mb-0.5">{entry.date}</p>
                  <p className="text-[10px] text-gray-600 leading-relaxed">{entry.detail}</p>
                  {entry.linkedLabel && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(entry.linkedRoute || '/'); }}
                      className={cn('mt-1 text-[9px] font-bold inline-flex items-center gap-0.5 hover:underline', config.color)}
                    >
                      {entry.linkedLabel} <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showTimeline && (
        <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 text-[10px] text-purple-700 space-y-1">
          <p className="font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> 生命周期记录说明</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-forest-700">疫苗/驱虫</p>
              <p className="text-gray-500">接种/用药 → 下次到期 → 逾期追踪</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-purple-700">问诊处方</p>
              <p className="text-gray-500">问诊 → 处方 → 双签确认 → 购药</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-sky-700">复诊提醒</p>
              <p className="text-gray-500">复诊日 → 提醒推送 → 预约确认</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-teal-700">健康模板</p>
              <p className="text-gray-500">体检数据 → 模板更新 → 趋势对比</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-forest-50">
        <div className="ml-auto flex items-center gap-1 text-forest-600 group-hover:text-forest-500 transition-colors cursor-pointer" onClick={() => navigate(`/pets/${pet.id}`)}>
          <Heart className="w-4 h-4" />
          <span className="text-xs font-medium">查看完整健康档案</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
