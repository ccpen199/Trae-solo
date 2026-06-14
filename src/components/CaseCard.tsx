import { useState } from 'react';
import { Heart, Star, MapPin, Home, Ruler, Wallet } from 'lucide-react';
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

  return (
    <div
      className="card group cursor-pointer"
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
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 ${isCompact ? 'text-sm' : 'text-base'}`}>
          {caseData.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{caseData.city} · {caseData.district || caseData.title.split('·')[0]}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
          <div className="flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-primary" />
            <span>{caseData.houseType || caseData.layout || `${caseData.rooms || caseData.bedrooms || 3}室${caseData.bathrooms || 1}卫`}</span>
          </div>
          <div className="flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5 text-primary" />
            <span>{caseData.area}㎡</span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent font-medium">{formatBudget(caseData.budget)}</span>
          </div>
        </div>

        {!isCompact && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
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
      </div>
    </div>
  );
}
