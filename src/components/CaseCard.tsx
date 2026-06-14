import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, Home, Ruler, Wallet, Check } from 'lucide-react';
import type { Case } from '@shared/types';

interface CaseCardProps {
  caseData: Case;
  variant?: 'default' | 'compact';
}

const coverColors = [
  'from-teal-400 to-cyan-600',
  'from-orange-400 to-rose-500',
  'from-violet-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-600',
  'from-pink-400 to-fuchsia-600',
  'from-lime-400 to-green-600',
];

export default function CaseCard({ caseData, variant = 'default' }: CaseCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const colorIdx = parseInt(caseData.id.replace(/\D/g, ''), 10) % coverColors.length;
  const gradientClass = coverColors[colorIdx];

  const formatBudget = (budget: number) => {
    if (budget >= 10000) {
      return `${(budget / 10000).toFixed(1)}万`;
    }
    return `${budget}元`;
  };

  const isCompact = variant === 'compact';

  const hasFloorPlan = !!caseData.floorPlanSvg;
  const hasElectricPlan = !!caseData.electricPlanSvg;
  const materialCount = caseData.materials?.length ?? 0;
  const acceptanceStages = caseData.acceptancePhotos
    ? new Set(caseData.acceptancePhotos.map((p) => p.stage)).size
    : 0;

  const stageNames: Record<string, string> = {
    'concealed': '隐蔽工程',
    'mud-wood': '泥木',
    'paint': '油漆',
  };
  const completedStages = caseData.acceptancePhotos
    ? Array.from(new Set(caseData.acceptancePhotos.map((p) => p.stage)))
    : [];

  const topBrands = caseData.materials?.slice(0, 2).map(m => `${m.brand}${m.name.slice(0, 2)}`).join(' · ') || '';

  const badgeBase = isCompact
    ? 'px-2 py-0.5 text-[10px] font-medium rounded'
    : 'px-2.5 py-1 text-[11px] font-medium rounded';

  return (
    <div
      className="card group cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/cases/${caseData.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/cases/${caseData.id}`);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative overflow-hidden ${isCompact ? 'h-40' : 'h-48'}`}>
        {caseData.coverImage ? (
          <img
            src={caseData.coverImage}
            alt={caseData.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${hovered ? 'scale-105' : ''}`}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <Home className="w-16 h-16 text-white/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {caseData.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium text-white bg-primary/90 backdrop-blur-sm rounded-full"
            >
              {tag}
            </span>
          ))}
          {!caseData.tags?.length && caseData.style && (
            <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary/90 backdrop-blur-sm rounded-full">
              {caseData.style}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-1 text-white text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{caseData.qualityScore?.toFixed(1) || '4.8'}</span>
          </div>
          <div className="text-white/90 text-sm">
            {caseData.views?.toLocaleString() || '0'} 浏览
          </div>
        </div>
      </div>

      <div className={`${isCompact ? 'p-4' : 'p-5'}`}>
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-1 ${isCompact ? 'text-sm' : 'text-base'}`}>
          {caseData.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
          <span className="truncate">施工城市：{caseData.city} · {caseData.district || caseData.title.split('·')[0]}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-gray-300 mb-3">
          <div className="flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">
              {`${caseData.rooms || caseData.bedrooms || 3}室${(caseData.houseType?.match(/厅(\d)/) || [, '1'])[1]}厅${caseData.bathrooms || 1}卫`}
              <span className="mx-1 text-gray-300 dark:text-gray-500">·</span>
              {caseData.area}㎡
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent font-medium">{formatBudget(caseData.budget)}</span>
          </div>
        </div>

        {topBrands && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span className="text-gray-500 dark:text-gray-400">品牌：</span>
            <span className="font-medium text-orange-600 dark:text-orange-400">{topBrands}</span>
          </div>
        )}

        {completedStages.length > 0 && (
          <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
            <span className="text-gray-500 dark:text-gray-400 mr-1.5">已验收：</span>
            {completedStages.map((stage, idx) => (
              <span key={stage} className="inline-flex items-center">
                <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-medium">
                  {stageNames[stage] || stage}
                  <Check className="w-3 h-3" />
                </span>
                {idx < completedStages.length - 1 && <span className="text-gray-300 dark:text-gray-500 mx-1">/</span>}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={`${badgeBase} ${hasFloorPlan ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
            户型SVG {hasFloorPlan ? '✓' : '✗'}
          </span>
          <span className={`${badgeBase} ${hasElectricPlan ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
            水电点位 {hasElectricPlan ? '✓' : '✗'}
          </span>
          <span className={`${badgeBase} ${materialCount > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
            建材 {materialCount > 0 ? `${materialCount}项` : '✗'}
          </span>
          <span className={`${badgeBase} ${acceptanceStages > 0 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
            验收 {acceptanceStages > 0 ? `${acceptanceStages}阶段` : '✗'}
          </span>
        </div>

        {!isCompact && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {caseData.designerAvatar ? (
                <img
                  src={caseData.designerAvatar}
                  alt={caseData.designerName}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {caseData.designerName?.[0] || '设'}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {caseData.designerName || '设计师'}
                </span>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {caseData.qualityScore?.toFixed(1) || '4.8'}
                  </span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
              {caseData.style}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/cases/${caseData.id}`);
          }}
          className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          查看详情
        </button>
      </div>
    </div>
  );
}
