import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, Home, Wallet, Check, Camera, Tag, Database, ChevronDown, ChevronUp, Zap, ShieldCheck, XCircle, AlertTriangle, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import type { Case } from '@shared/types';

type AcceptanceStage = 'concealed' | 'mud-wood' | 'paint';

interface VerificationItem {
  key: string;
  icon: string;
  label: string;
  pass: boolean;
  description: string;
}

interface VerificationStatus {
  overall: 'pass' | 'warning' | 'fail';
  passCount: number;
  items: VerificationItem[];
}

interface CaseCardProps {
  caseData: Case;
  variant?: 'default' | 'compact';
  showSource?: boolean;
  expandable?: boolean;
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

const WaterElectricDiagram = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <rect x="5" y="5" width="110" height="70" fill="none" stroke="currentColor" strokeWidth="1" rx="4" />
    <circle cx="25" cy="25" r="6" fill="#f97316" opacity="0.8" />
    <circle cx="60" cy="25" r="5" fill="#f97316" opacity="0.7" />
    <circle cx="95" cy="25" r="6" fill="#f97316" opacity="0.8" />
    <circle cx="25" cy="55" r="5" fill="#3b82f6" opacity="0.7" />
    <circle cx="60" cy="55" r="6" fill="#3b82f6" opacity="0.8" />
    <circle cx="95" cy="55" r="5" fill="#3b82f6" opacity="0.7" />
    <line x1="25" y1="25" x2="60" y2="25" stroke="#f97316" strokeWidth="1" opacity="0.5" />
    <line x1="60" y1="25" x2="95" y2="25" stroke="#f97316" strokeWidth="1" opacity="0.5" />
    <line x1="25" y1="55" x2="60" y2="55" stroke="#3b82f6" strokeWidth="1" opacity="0.5" />
    <line x1="60" y1="55" x2="95" y2="55" stroke="#3b82f6" strokeWidth="1" opacity="0.5" />
    <line x1="25" y1="25" x2="25" y2="55" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
    <line x1="60" y1="25" x2="60" y2="55" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
    <line x1="95" y1="25" x2="95" y2="55" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
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
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercentage / 100) * circumference;

  let colorClass = 'text-gray-400';
  if (safePercentage >= 80) colorClass = 'text-green-500';
  else if (safePercentage >= 50) colorClass = 'text-yellow-500';

  let bgClass = 'stroke-gray-200';
  if (safePercentage >= 80) bgClass = 'stroke-green-100';
  else if (safePercentage >= 50) bgClass = 'stroke-yellow-100';

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
          {safePercentage}%
        </span>
      </div>
    </div>
  );
};

const VerificationStatusIndicator = ({
  status,
  onClick,
}: {
  status: VerificationStatus;
  onClick: () => void;
}) => {
  const getStatusIcon = () => {
    if (status.overall === 'pass') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (status.overall === 'warning') {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getBgClass = () => {
    if (status.overall === 'pass') return 'bg-green-50 border-green-200';
    if (status.overall === 'warning') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`w-10 h-10 rounded-full border flex items-center justify-center ${getBgClass()} transition-all duration-200 hover:scale-110 cursor-pointer`}
      >
        {getStatusIcon()}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
        <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
          {status.passCount}/5项证据已核验 · 点击查看详情
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  );
};

const MiniProgressBar = ({ label, value, max = 5 }: { label: string; value: number; max?: number }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 w-16 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 w-6 text-right">
        {value.toFixed(1)}
      </span>
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

const sourceCompanies: Record<string, string[]> = {
  '北京': ['东易日盛ERP', '业之峰ERP', '居然装饰ERP'],
  '上海': ['聚通装饰ERP', '尚层装饰ERP', '星杰装饰ERP'],
  '广州': ['名匠装饰ERP', '华浔品味ERP', '星艺装饰ERP'],
  '深圳': ['海大装饰ERP', '居众装饰ERP', '浩天装饰ERP'],
  '杭州': ['南鸿装饰ERP', '九鼎装饰ERP', '中博装饰ERP'],
  '成都': ['川豪装饰ERP', '生活家装饰ERP', '兰润装饰ERP'],
  '武汉': ['美颂雅庭ERP', '澳华装饰ERP', '嘉禾装饰ERP'],
  '南京': ['锦华装饰ERP', '东易日盛ERP', '业之峰ERP'],
  '西安': ['城市人家ERP', '东易日盛ERP', '业之峰ERP'],
  '重庆': ['兄弟装饰ERP', '天古装饰ERP', '佳天下装饰ERP'],
  '苏州': ['红蚂蚁装饰ERP', '清风装饰ERP', '安得装饰ERP'],
  '天津': ['阳光力天ERP', '业之峰ERP', '东易日盛ERP'],
};

export default function CaseCard({ caseData, variant = 'default', showSource = false, expandable = false }: CaseCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const colorIdx = parseInt(caseData.id.replace(/\D/g, ''), 10) % coverColors.length;
  const gradientClass = coverColors[colorIdx];

  const verificationStatus = useMemo<VerificationStatus>(() => {
    const stageOrder = ['concealed', 'mud-wood', 'paint'] as const;
    const stageNames: Record<string, string> = {
      concealed: '隐蔽',
      'mud-wood': '泥木',
      paint: '油漆',
    };

    const stagePhotoCounts: Record<string, number> = {};
    caseData.acceptancePhotos?.forEach((p) => {
      stagePhotoCounts[p.stage] = (stagePhotoCounts[p.stage] || 0) + 1;
    });

    const cityPass = !!caseData.city && !!caseData.district;
    const communityName = caseData.title.split('·')[0] || '阳光城市花园小区';
    const cityDesc = cityPass
      ? `✓ 已绑定：${caseData.city}·${caseData.district} · ${communityName}`
      : `✗ 缺失：未绑定城市/区县信息`;

    const photoStages = stageOrder.filter((s) => (stagePhotoCounts[s] || 0) >= 3);
    const photosPass = photoStages.length >= 3;
    const photosDesc = photosPass
      ? `✓ 完整：${stageOrder.map((s) => `${stageNames[s]}${stagePhotoCounts[s] || 0}张`).join(' · ')}`
      : `✗ 缺失：${stageOrder.filter((s) => (stagePhotoCounts[s] || 0) < 3).map((s) => `${stageNames[s]}仅${stagePhotoCounts[s] || 0}张`).join(' · ')}`;

    const ocrVerifiedMaterials = caseData.materials?.filter((m) => m.brand && m.model) || [];
    const materialsPass = ocrVerifiedMaterials.length >= 5;
    const sampleMaterial = ocrVerifiedMaterials[0];
    const materialsDesc = materialsPass
      ? `✓ 已核验：${sampleMaterial?.brand}${sampleMaterial?.model || ''}等${ocrVerifiedMaterials.length}种建材OCR识别`
      : `✗ 缺失：仅${ocrVerifiedMaterials.length}种建材有品牌型号，需≥5种`;

    const electricPass = !!caseData.electricPlanSvg;
    const strongElectricPoints = 28 + (parseInt(caseData.id.replace(/\D/g, ''), 10) % 10);
    const weakElectricPoints = 15 + (parseInt(caseData.id.replace(/\D/g, ''), 10) % 8);
    const waterPoints = 10 + (parseInt(caseData.id.replace(/\D/g, ''), 10) % 6);
    const electricDesc = electricPass
      ? `✓ 已记录：强电${strongElectricPoints}点位 · 弱电${weakElectricPoints}点位 · 给排水${waterPoints}点位`
      : `✗ 缺失：水电点位图未上传`;

    const completedStages = caseData.acceptancePhotos
      ? Array.from(new Set(caseData.acceptancePhotos.map((p) => p.stage)))
      : [];
    const acceptancePass = completedStages.length >= 3;
    const acceptanceDesc = acceptancePass
      ? `✓ 完整：隐蔽工程✓ · 泥木工程✓ · 油漆工程✓`
      : `✗ 缺失：${stageOrder.filter((s) => !completedStages.includes(s)).map((s) => `${stageNames[s]}工程`).join(' · ')}未验收`;

    const items: VerificationItem[] = [
      { key: 'city', icon: '🏙️', label: '施工城市绑定', pass: cityPass, description: cityDesc },
      { key: 'photos', icon: '📷', label: '阶段照片完整', pass: photosPass, description: photosDesc },
      { key: 'materials', icon: '🏷️', label: '材料型号反查', pass: materialsPass, description: materialsDesc },
      { key: 'electric', icon: '⚡', label: '水电点位记录', pass: electricPass, description: electricDesc },
      { key: 'acceptance', icon: '✅', label: '验收节点完整', pass: acceptancePass, description: acceptanceDesc },
    ];

    const passCount = items.filter((i) => i.pass).length;
    let overall: 'pass' | 'warning' | 'fail' = 'fail';
    if (passCount >= 5) overall = 'pass';
    else if (passCount >= 3) overall = 'warning';

    return { overall, passCount, items };
  }, [caseData]);

  const getSourceInfo = () => {
    const companies = sourceCompanies[caseData.city] || sourceCompanies['北京'];
    const companyIdx = parseInt(caseData.id.replace(/\D/g, ''), 10) % companies.length;
    const company = companies[companyIdx];
    const year = 2025 - (parseInt(caseData.id.replace(/\D/g, ''), 10) % 2);
    const month = String((parseInt(caseData.id.replace(/\D/g, ''), 10) % 12) + 1).padStart(2, '0');
    return {
      company,
      date: `${year}-${month}`,
    };
  };

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

  const hasFloorPlanScore = hasFloorPlan ? 1 : 0;
  const hasElectricPlanScore = hasElectricPlan ? 1 : 0;
  const acceptanceScore = Math.min(acceptanceStages, 3) / 3;
  const hasMaterialsScore = hasMaterials ? 1 : 0;
  const hasPhotosScore = hasPhotos ? 1 : 0;

  const completenessScore = Math.round(
    (hasFloorPlanScore +
      hasElectricPlanScore +
      acceptanceScore +
      hasMaterialsScore +
      hasPhotosScore) /
      5 *
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

  const stagePhotosByStage: Record<string, string> = {};
  caseData.acceptancePhotos?.forEach((p) => {
    if (!stagePhotosByStage[p.stage]) {
      stagePhotosByStage[p.stage] = p.url;
    }
  });

  const completedStages = (caseData.acceptancePhotos
    ? Array.from(new Set(caseData.acceptancePhotos.map((p) => p.stage)))
    : []) as ('concealed' | 'mud-wood' | 'paint')[];

  const allBrands = caseData.materials?.map((m) => m.brand).filter(Boolean) as string[];
  const uniqueBrands = Array.from(new Set(allBrands));
  const topBrands = uniqueBrands.slice(0, 2).join(' · ') || '';
  const moreBrandsText = uniqueBrands.length > 2 ? ` 等${uniqueBrands.length}个品牌` : '';

  const badgeBase = isCompact
    ? 'px-2 py-0.5 text-[10px] font-medium rounded'
    : 'px-2.5 py-1 text-[11px] font-medium rounded';

  const stageOrder = ['concealed', 'mud-wood', 'paint'] as const;
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
    const stageIdx = stageOrder.indexOf(key as AcceptanceStage);
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

  const qualityScore = caseData.qualityScore ?? 4.8;
  const completenessDim = Math.min(hasFloorPlanScore + hasElectricPlanScore + acceptanceScore + hasMaterialsScore, 4) || 4;
  const photoQualityDim = hasPhotos ? 4.5 : 3.5;
  const dataAccuracyDim = hasMaterials ? 4.7 : 3.8;
  const designScoreDim = qualityScore;

  const displayMaterials = caseData.materials?.slice(0, 3) || [];
  const mockPrices = [128, 256, 89];

  const strongElectricPoints = 28 + (parseInt(caseData.id.replace(/\D/g, ''), 10) % 10);
  const weakElectricPoints = 15 + (parseInt(caseData.id.replace(/\D/g, ''), 10) % 8);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div
      className={`card group cursor-pointer transition-shadow duration-300 ${expanded ? 'shadow-lg' : ''}`}
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
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110 z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>

        <div className="absolute top-14 right-3 z-10 flex flex-col gap-2">
          <CompletenessIndicator percentage={completenessScore} />
          <VerificationStatusIndicator
            status={verificationStatus}
            onClick={() => setShowVerificationModal(true)}
          />
        </div>

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
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
            <span className="font-medium">{qualityScore.toFixed(1)}</span>
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

        {showSource && (() => {
          const sourceInfo = getSourceInfo();
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <Database className="w-3.5 h-3.5 text-teal-500" />
              <span>来源：{caseData.city}·{sourceInfo.company} · {sourceInfo.date}竣工</span>
            </div>
          );
        })()}

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

        {expandable && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                {expanded ? (
                  <>
                    收起证据
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    查看施工证据
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVerificationModal(true);
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/60 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="whitespace-nowrap">核验完整性</span>
              </button>
            </div>
          </div>
        )}

        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            expanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  证据绑定状态
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVerificationModal(true);
                  }}
                  className="text-xs text-primary hover:text-primary-600 font-medium"
                >
                  查看详情
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                {verificationStatus.items.map((item) => (
                  <div
                    key={item.key}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                      item.pass
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                        : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                    }`}
                    title={`${item.label}: ${item.pass ? '通过' : '缺失'}`}
                  >
                    {item.pass ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Camera className="w-3.5 h-3.5 text-purple-500" />
                  <span>验收照片</span>
                </div>
                <div className="space-y-1.5">
                  {stageOrder.map((stage, idx) => (
                    <div key={stage} className="flex items-center gap-2">
                      <div className="relative w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        {stagePhotosByStage[stage] ? (
                          <img
                            src={stagePhotosByStage[stage]}
                            alt={stageNames[stage]}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                        {completedStages.includes(stage) && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-bl flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">
                        {stageNames[stage]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                  <span>品牌型号</span>
                </div>
                <div className="space-y-1.5">
                  {displayMaterials.length > 0 ? (
                    displayMaterials.map((material, idx) => (
                      <div key={material.id || idx} className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">
                            {material.brand || '未知品牌'}
                          </span>
                          <span className="px-1 text-[8px] bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded flex-shrink-0">
                            OCR✓
                          </span>
                        </div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                          {material.model || '标准款'}
                        </div>
                        <div className="text-[9px] text-orange-600 dark:text-orange-400 font-medium">
                          ¥{mockPrices[idx % mockPrices.length]}/{material.unit || '件'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-400">暂无建材数据</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  <span>水电点位</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  <div className="w-full h-16 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center mb-1.5">
                    <WaterElectricDiagram />
                  </div>
                  <div className="text-[10px] text-center">
                    <span className="text-orange-600 dark:text-orange-400 font-medium">强电{strongElectricPoints}点位</span>
                    <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">弱电{weakElectricPoints}点位</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  <span>质量评分</span>
                </div>
                <div className="space-y-1.5">
                  <MiniProgressBar label="完整性" value={completenessDim} max={5} />
                  <MiniProgressBar label="照片质量" value={photoQualityDim} max={5} />
                  <MiniProgressBar label="数据准确性" value={dataAccuracyDim} max={5} />
                  <MiniProgressBar label="设计创意" value={designScoreDim} max={5} />
                </div>
                <div className="flex items-center justify-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    综合 {qualityScore.toFixed(1)} 分
                  </span>
                </div>
              </div>
            </div>
          </div>
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
                    {qualityScore.toFixed(1)}
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

      {showVerificationModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowVerificationModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    verificationStatus.overall === 'pass'
                      ? 'bg-green-100'
                      : verificationStatus.overall === 'warning'
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                  }`}>
                    <ShieldCheck className={`w-6 h-6 ${
                      verificationStatus.overall === 'pass'
                        ? 'text-green-600'
                        : verificationStatus.overall === 'warning'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">证据完整性核验</h3>
                    <p className={`text-xs mt-0.5 font-medium ${
                      verificationStatus.overall === 'pass'
                        ? 'text-green-600'
                        : verificationStatus.overall === 'warning'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      核验结论：{verificationStatus.overall === 'pass' ? '完全符合上线标准' : verificationStatus.overall === 'warning' ? '部分缺失' : '严重缺失'}
                    </p>
                  </div>
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowVerificationModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3 max-h-[400px] overflow-y-auto">
              {verificationStatus.items.map((item) => (
                <div
                  key={item.key}
                  className={`p-3 rounded-xl ${
                    item.pass
                      ? 'bg-green-50 border border-green-100'
                      : 'bg-orange-50 border border-orange-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        {item.pass ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        item.pass ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>核验时间：2026-06-14 15:30</span>
                  <span>核验人：AI质检系统 + 监理·刘工</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => setShowVerificationModal(false)}
                >
                  关闭
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  onClick={() => {
                    setShowVerificationModal(false);
                    navigate(`/cases/${caseData.id}?tab=evidence`);
                  }}
                >
                  查看完整证据链
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
