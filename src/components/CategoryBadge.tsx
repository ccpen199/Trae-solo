import { GarbageCategory } from '../../../shared/types';

interface CategoryBadgeProps {
  category: GarbageCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showGuidelines?: boolean;
}

export default function CategoryBadge({ category, size = 'md', showIcon = true, showGuidelines = false }: CategoryBadgeProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <div className="space-y-2">
      <div
        className={`${sizeClasses[size]} inline-flex items-center gap-2 rounded-full font-medium text-white shadow-lg transition-transform hover:scale-105`}
        style={{ backgroundColor: category.color }}
      >
        {showIcon && <span className="text-lg">{category.icon}</span>}
        <span>{category.name}</span>
      </div>
      {showGuidelines && category.guidelines && (
        <p className="text-sm text-gray-500 mt-2">{category.guidelines}</p>
      )}
    </div>
  );
}
