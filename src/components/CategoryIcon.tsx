import { Shirt, BookOpen, Smartphone } from 'lucide-react';
import { CATEGORY_LABELS } from '@/utils/constants';

const ICON_MAP: Record<string, { icon: typeof Shirt; bg: string; text: string }> = {
  clothing: { icon: Shirt, bg: 'bg-blue-50', text: 'text-blue-600' },
  book: { icon: BookOpen, bg: 'bg-amber-50', text: 'text-amber-600' },
  phone: { icon: Smartphone, bg: 'bg-purple-50', text: 'text-purple-600' },
};

interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function CategoryIcon({
  category,
  size = 'md',
  showLabel = true,
}: CategoryIconProps) {
  const config = ICON_MAP[category];
  if (!config) return null;

  const Icon = config.icon;
  const label = CATEGORY_LABELS[category] || category;

  const sizeClasses = {
    sm: { wrapper: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-xs' },
    md: { wrapper: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-sm' },
    lg: { wrapper: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-base' },
  };

  const s = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center rounded-xl ${config.bg} ${s.wrapper}`}
      >
        <Icon className={`${config.text} ${s.icon}`} />
      </div>
      {showLabel && <span className={`font-medium text-neutral-text ${s.text}`}>{label}</span>}
    </div>
  );
}
