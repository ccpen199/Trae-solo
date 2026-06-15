import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Factory, Lightbulb, Shirt, Sofa, Wrench, Zap, Utensils, Bot, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TownshipCode, IndustryTag } from '@shared/types';
import { getTownshipByCode } from '@/mock/townships';

export interface TownshipTagProps {
  code: TownshipCode;
  size?: 'sm' | 'md';
  clickable?: boolean;
  showIcon?: boolean;
  className?: string;
}

const INDUSTRY_ICONS: Record<IndustryTag, React.ReactNode> = {
  [IndustryTag.HARDWARE]: <Wrench size={12} />,
  [IndustryTag.LIGHTING]: <Lightbulb size={12} />,
  [IndustryTag.CASUALWEAR]: <Shirt size={12} />,
  [IndustryTag.FURNITURE]: <Sofa size={12} />,
  [IndustryTag.ELECTRONICS]: <Zap size={12} />,
  [IndustryTag.MACHINERY]: <Factory size={12} />,
  [IndustryTag.APPLIANCE]: <Building2 size={12} />,
  [IndustryTag.FOOD]: <Utensils size={12} />,
  [IndustryTag.NEWENERGY]: <TrendingUp size={12} />,
  [IndustryTag.ROBOTICS]: <Bot size={12} />,
};

const INDUSTRY_COLORS: Record<IndustryTag, { bg: string; text: string; border: string }> = {
  [IndustryTag.HARDWARE]: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  [IndustryTag.LIGHTING]: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  [IndustryTag.CASUALWEAR]: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  [IndustryTag.FURNITURE]: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  [IndustryTag.ELECTRONICS]: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  [IndustryTag.MACHINERY]: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  [IndustryTag.APPLIANCE]: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  [IndustryTag.FOOD]: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  [IndustryTag.NEWENERGY]: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  [IndustryTag.ROBOTICS]: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
};

export default function TownshipTag({
  code,
  size = 'md',
  clickable = false,
  showIcon = true,
  className,
}: TownshipTagProps) {
  const navigate = useNavigate();
  const township = getTownshipByCode(code);

  if (!township) {
    return null;
  }

  const primaryIndustry = township.industryTags[0] || IndustryTag.MACHINERY;
  const colorScheme = INDUSTRY_COLORS[primaryIndustry];
  const icon = INDUSTRY_ICONS[primaryIndustry];

  const handleClick = () => {
    if (clickable) {
      navigate(`/township/${code}`);
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium transition-all',
        colorScheme.bg,
        colorScheme.text,
        colorScheme.border,
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs',
        clickable ? 'cursor-pointer hover:shadow-sm hover:-translate-y-0.5' : '',
        className
      )}
      onClick={handleClick}
    >
      {showIcon && icon}
      <span>{township.name}</span>
    </span>
  );
}
