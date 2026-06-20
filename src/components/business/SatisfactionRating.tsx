import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Input } from 'antd';
import { cn } from '@/utils/cn';

const { TextArea } = Input;

export interface RatingTag {
  key: string;
  label: string;
  category: 'positive' | 'neutral' | 'negative';
}

export const defaultRatingTags: RatingTag[] = [
  { key: 'fast', label: '响应迅速', category: 'positive' },
  { key: 'professional', label: '专业负责', category: 'positive' },
  { key: 'friendly', label: '态度友好', category: 'positive' },
  { key: 'patient', label: '耐心细致', category: 'positive' },
  { key: 'clean', label: '现场整洁', category: 'positive' },
  { key: 'satisfied', label: '非常满意', category: 'positive' },
  { key: 'normal', label: '一般般', category: 'neutral' },
  { key: 'slow', label: '响应较慢', category: 'negative' },
  { key: 'unprofessional', label: '不够专业', category: 'negative' },
  { key: 'attitude', label: '态度有待改进', category: 'negative' },
];

const ratingLabels = ['非常差', '较差', '一般', '满意', '非常满意'];

interface SatisfactionRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  comment?: string;
  onCommentChange?: (value: string) => void;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  tags?: RatingTag[];
  onSubmit?: (data: { rating: number; comment: string; tags: string[] }) => void;
  disabled?: boolean;
  showComment?: boolean;
  showTags?: boolean;
  showSubmit?: boolean;
  className?: string;
}

export function SatisfactionRating({
  value = 0,
  onChange,
  comment = '',
  onCommentChange,
  selectedTags = [],
  onTagsChange,
  tags = defaultRatingTags,
  onSubmit,
  disabled = false,
  showComment = true,
  showTags = true,
  showSubmit = true,
  className,
}: SatisfactionRatingProps) {
  const [hovered, setHovered] = useState(0);

  const displayRating = hovered || value;
  const currentLabel = displayRating > 0 ? ratingLabels[displayRating - 1] : '';

  const handleStarClick = (rating: number) => {
    if (disabled) return;
    onChange?.(rating);
  };

  const handleTagClick = (tagKey: string) => {
    if (disabled) return;
    const newTags = selectedTags.includes(tagKey)
      ? selectedTags.filter((t) => t !== tagKey)
      : [...selectedTags, tagKey];
    onTagsChange?.(newTags);
  };

  const tagCategoryClass = (category: RatingTag['category'], selected: boolean) => {
    if (!selected) return 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10';

    if (category === 'positive') {
      return 'bg-success-500/15 text-success-400 border-success-500/30';
    }
    if (category === 'negative') {
      return 'bg-danger-500/15 text-danger-400 border-danger-500/30';
    }
    return 'bg-primary-500/15 text-primary-400 border-primary-500/30';
  };

  const canSubmit = value > 0 && onSubmit;

  return (
    <div className={cn('glass-card p-5', className)}>
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-neutral-400 font-medium">服务评分：</span>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= displayRating;
            return (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => !disabled && setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                disabled={disabled}
                className={cn(
                  'p-1 transition-all duration-200',
                  !disabled && 'hover:scale-110',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                <Star
                  className={cn(
                    'w-7 h-7 transition-colors duration-200',
                    isActive
                      ? 'fill-warning-400 text-warning-400'
                      : 'fill-none text-neutral-600'
                  )}
                />
              </button>
            );
          })}
        </div>

        {currentLabel && (
          <span
            className={cn(
              'text-sm font-medium',
              displayRating >= 4 && 'text-success-400',
              displayRating === 3 && 'text-warning-400',
              displayRating <= 2 && 'text-danger-400'
            )}
          >
            {currentLabel}
          </span>
        )}
      </div>

      {showTags && (
        <div className="mt-5">
          <span className="text-sm text-neutral-400 font-medium block mb-3">
            评价标签（可多选）：
          </span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.key);
              return (
                <button
                  key={tag.key}
                  onClick={() => handleTagClick(tag.key)}
                  disabled={disabled}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200',
                    tagCategoryClass(tag.category, isSelected),
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showComment && (
        <div className="mt-5">
          <span className="text-sm text-neutral-400 font-medium block mb-2">
            您的建议（选填）：
          </span>
          <TextArea
            value={comment}
            onChange={(e) => onCommentChange?.(e.target.value)}
            placeholder="请告诉我们您的真实感受，帮助我们改进服务..."
            rows={3}
            maxLength={500}
            showCount
            disabled={disabled}
            className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0 resize-none"
          />
        </div>
      )}

      {showSubmit && canSubmit && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={() =>
              onSubmit?.({
                rating: value,
                comment,
                tags: selectedTags,
              })
            }
            disabled={disabled || value === 0}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200',
              value > 0 && !disabled
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 hover:shadow-glow active:scale-[0.98]'
                : 'bg-white/5 text-neutral-500 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            提交评价
          </button>
        </div>
      )}
    </div>
  );
}
