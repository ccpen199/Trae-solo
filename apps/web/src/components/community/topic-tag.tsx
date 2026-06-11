import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Topic } from '@pet/shared/types';

interface TopicTagProps {
  topic: Topic;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const categoryColors: Record<string, string> = {
  discussion: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  health: 'bg-red-100 text-red-700 hover:bg-red-200',
  nutrition: 'bg-green-100 text-green-700 hover:bg-green-200',
  training: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  life: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  adoption: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  other: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-sm',
};

export function TopicTag({ topic, size = 'md', showCount = false }: TopicTagProps) {
  const colorClass = categoryColors[topic.category] || categoryColors.other;

  return (
    <Link href={`/community/topic/${topic.id}`}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full transition-colors cursor-pointer',
          colorClass,
          sizeClasses[size]
        )}
      >
        {topic.icon && <span>{topic.icon}</span>}
        <span className="font-medium">{topic.name}</span>
        {showCount && (
          <span className="opacity-70">{topic.postCount}</span>
        )}
        {topic.isHot && (
          <span className="text-pet-orange">🔥</span>
        )}
        {topic.isOfficial && (
          <span className="text-pet-teal">✓</span>
        )}
      </span>
    </Link>
  );
}
