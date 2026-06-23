import { Sparkles } from 'lucide-react';

interface AITagBadgeProps {
  tags: string[];
  isLoading?: boolean;
  className?: string;
}

const AITagBadge = ({ tags, isLoading = false, className = '' }: AITagBadgeProps) => {
  if (isLoading) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="ai-tag animate-pulse">
            <div className="w-12 h-3 bg-zinc-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => (
        <span
          key={tag}
          className="ai-tag"
          style={{
            animation: 'fadeInUp 0.3s ease-out forwards',
            animationDelay: `${index * 80}ms`,
            opacity: 0,
          }}
        >
          <Sparkles className="w-3 h-3 text-gold-500" />
          {tag}
        </span>
      ))}
    </div>
  );
};

export default AITagBadge;
