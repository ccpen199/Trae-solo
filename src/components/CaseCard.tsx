import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, Home, Wallet, Check, Camera, Tag } from 'lucide-react';
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

const MiniFloorPlan = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <rect x="2" y="2" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <line x1="2" y1="18" x2="40" y2="18" stroke="currentColor" strokeWidth="1" />
    <line x1="22" y1="2" x2="22" y2="18" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="30" x2="22" y2="30" stroke="currentColor" strokeWidth="1" />
    <line x1="12" y1="18" x2="12" y2="38" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const MiniElectricPlan = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <rect x="2" y="2" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,1" />
    <circle cx="10" cy="10" r="3" fill="currentColor" />
    <circle cx="30" cy="10" r="3" fill="currentColor" />
    <circle cx="10" cy="30" r="3" fill="currentColor" />
    <circle cx="30" cy="30" r="3" fill="currentColor" />
    <rect x="18" y="18" width="4" height="4" fill="currentColor" />
  </svg>
);

const EvidenceThumb = ({
  icon,
  label,
  verified = true,
}: {
  icon: React.ReactNode;
  label: string;
  verified?: boolean;
}) => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white overflow-hidden">
      {icon}
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </div>
      )}
    </div>
    <span className="text-[9px] text-white/80 whitespace-nowrap">{label}</span>
  </div>
);

const CompletenessIndicator = ({ percentage }: { percentage: number }) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let colorClass = 'text-gray-400';
  if (percentage >= 80) colorClass = 'text-green-500';
  else if (percentage >= 50) colorClass = 'text-yellow-500';

  let bgClass = 'stroke-gray-200';
  if (percentage >= 80) bgClass = 'stroke-green-100';
  else if (percentage >= 50) bgClass = 'stroke-yellow-100';

  return (
    <div className="relative w-10 h-10">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="white"
          strokeWidth="3"
          className={bgClass}
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-500`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-bold ${colorClass}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
};

const TimelineNode = ({
  label,
  status,
  isLast,
}: {
  label: string;
  status: 'done' | 'current' | 'pending';
  isLast: boolean;
}) => {
  const dotColor =
    status === 'done'
      ? 'bg-green-500'
      : status === 'current'
      ? 'bg-yellow-500 animate-pulse'
      : 'bg-gray-300';
  const lineColor =
    status === 'done' ? 'bg-green-500' : 'bg-gray-200';
  const textColor =
    status === 'done'
      ? 'text-green-600'
      : status === 'current'
      ? 'text-yellow-600'
      : 'text-gray-400';

  return (
    <div className="flex items-center flex-1 last:flex-none">
      <div className="flex flex-col items-center gap-1">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className={`text-[9px] font-medium ${textColor} whitespace-nowrap`}>{label}</span>
      </div>
      {!isLast && (
        <div className={`flex-1 h-0.5 mx-1 ${lineColor} mt-[-14px]`} />
      )}
    </div>
  );
};

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
  const hasMaterials = materialCount > 0;
  const photoCount = caseData.acceptancePhotos?.length ?? 0;
  const hasPhotos = photoCount > 0;
  const acceptanceStages = caseData.acceptancePhotos
    ? new Set(caseData.acceptancePhotos.map((p) => p.stage)).size
    : 0;

  const completenessScore = Math.round(
    ((hasFloorPlan ? 1 : 0) +
      (hasElectricPlan ? 1 : 0) +
      Math.min(acceptanceStages, 3) / 3 +
      (hasMaterials ? 1 : 0) +
      (hasPhotos ? 1 : 0)) /
      4 *
      100
  );

  const stageNames: Record<string, string> = {
    concealed: '隐蔽工程',
    'mud-wood': '泥木',
    paint: '油漆',
  };

  const stagePhotoCounts: Record<string, number> = {};
  caseData.acceptancePhotos?.forEach((p) => {
    stagePhotoCounts[p.stage] = (stagePhotoCounts[p.stage] || 0) + 1;
  });

  const completedStages = caseData.acceptancePhotos
    ? Array.from(new Set(caseData.acceptancePhotos.map((p) => p.stage)))
    : [];

  const allBrands = caseData.materials?.map((m) => m.brand).filter(Boolean) as string[];
  const uniqueBrands = Array.from(new Set(allBrands));
  const topBrands = uniqueBrands.slice(0, 2).join(' · ') || '';
  const moreBrandsText = uniqueBrands.length > 2 ? ` 等${uniqueBrands.length}个品牌` : '';

  const badgeBase = isCompact
    ? 'px-2 py-0.5 text-[10px] font-medium rounded'
    : 'px-2.5 py-1 text-[11px] font-medium rounded';

  const stageOrder = ['concealed', 'mud-wood', 'paint'];
  const timelineStages = [
    { key: 'design', label: '设计' },
    { key: 'concealed', label: '水电' },
    { key: 'mud-wood', label: '泥木' },
    { key: 'paint', label: '油漆' },
    { key: 'complete', label: '竣工' },
  ];

  const getTimelineStatus = (key: string): 'done' | 'current' | 'pending' => {
    if (key === 'design') return 'done';
    if (key === 'complete') {
      return completedStages.length >= 3 ? 'done' : 'pending';
    }
    const stageIdx = stageOrder.indexOf(key);
    const completedIdx = completedStages.length - 1;
    if (stageIdx < completedIdx) return 'done';
    if (stageIdx === completedIdx) return 'done';
    if (stageIdx === completedStages.length) return 'current';
    return 'pending';
  };

  const communityName = caseData.title.split('·')[0] || '阳光城市花园';

  const totalEvidenceCount =
    (hasFloorPlan ? 1 : 0) +
    (hasElectricPlan ? 1 : 0) +
    photoCount +
    materialCount;

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

        <div className="absolute top-14 right-3">
          <CompletenessIndicator percentage={completenessScore} />
        </div>

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

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 transition-all duration-300 ${
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-around">
            <EvidenceThumb
              icon={<MiniFloorPlan />}
              label="户型图"
              verified={hasFloorPlan}
            />
            <EvidenceThumb
              icon={<MiniElectricPlan />}
              label="水电点位"
              verified={hasElectricPlan}
            />
            <EvidenceThumb
              icon={
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Camera className="w-5 h-5" />
                  {photoCount > 0 && (
                    <span className="text-[8px] font-medium leading-none mt-0.5">
                      {photoCount}张
                    </span>
                  )}
                </div>
              }
              label="验收照片"
              verified={hasPhotos}
            />
            <EvidenceThumb
              icon={
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Tag className="w-5 h-5" />
                  {uniqueBrands.slice(0, 2).map((b) => (
                    <span key={b} className="text-[7px] leading-none">
                      {b}
                    </span>
                  ))}
                </div>
              }
              label="建材品牌"
              verified={hasMaterials}
            />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
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
          <span className="truncate">
            施工城市：{caseData.city} · {caseData.district || caseData.title.split('·')[0]}
            {hovered && (
              <span className="text-gray-500 dark:text-gray-400">
                {' '}| 小区：{communityName}
              </span>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-gray-300 mb-3">
          <div className="flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">
              {`${caseData.rooms || caseData.bedrooms || 3}室${(caseData.houseType?.match(/厅(\d)/) || ['', '1'])[1]}厅${caseData.bathrooms || 1}卫`}
              <span className="mx-1 text-gray-300 dark:text-gray-500">·</span>
              {caseData.area}㎡
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent font-medium">{formatBudget(caseData.budget)}</span>
          </div>
        </div>

        {(topBrands || hovered) && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span className="text-gray-500 dark:text-gray-400">品牌：</span>
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {hovered ? uniqueBrands.join(' · ') + moreBrandsText : topBrands}
            </span>
          </div>
        )}

        {completedStages.length > 0 && (
          <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
            <span className="text-gray-500 dark:text-gray-400 mr-1.5">已验收：</span>
            {completedStages.map((stage, idx) => (
              <span key={stage} className="inline-flex items-center">
                <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-medium">
                  {stageNames[stage] || stage}
                  {hovered && stagePhotoCounts[stage] && (
                    <span className="text-purple-500 dark:text-purple-300 text-xs">
                      ({stagePhotoCounts[stage]}张)
                    </span>
                  )}
                  <Check className="w-3 h-3" />
                </span>
                {idx < completedStages.length - 1 && <span className="text-gray-300 dark:text-gray-500 mx-1">/</span>}
              </span>
            ))}
          </div>
        )}

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            {timelineStages.map((stage, idx) => (
              <TimelineNode
                key={stage.key}
                label={stage.label}
                status={getTimelineStatus(stage.key)}
                isLast={idx === timelineStages.length - 1}
              />
            ))}
          </div>
          <div className="text-center text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            已核验 {totalEvidenceCount} 项证据
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={`${badgeBase} ${hasFloorPlan ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
            户型SVG {hasFloorPlan ? '✓' : '✗'}
          </span>
          <span className={`${badgeBase} ${hasElectricPlan ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
            水电点位 {hasElectricPlan ? '✓' : '✗'}
          </span>
          <span className={`${badgeBase} ${materialCount > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'} inline-flex items-center gap-1`}>
            建材 {materialCount > 0 ? `${materialCount}项` : '✗'}
            {materialCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500 text-white font-medium">
                OCR✓
              </span>
            )}
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
