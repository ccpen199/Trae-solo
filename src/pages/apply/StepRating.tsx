import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

const ratingTags = ['效率高', '态度好', '流程简', '响应快'];

interface StepRatingProps {
  rating: number;
  ratingTags: string[];
  comment: string;
  onUpdate: (data: { rating?: number; ratingTags?: string[]; comment?: string }) => void;
  onSubmit: () => void;
}

export default function StepRating({ rating, ratingTags: selectedTags, comment, onUpdate, onSubmit }: StepRatingProps) {
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onUpdate({ ratingTags: selectedTags.filter((t) => t !== tag) });
    } else {
      onUpdate({ ratingTags: [...selectedTags, tag] });
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit();
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <ThumbsUp className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-gov-text mb-1">感谢您的评价</h3>
        <p className="text-sm text-gov-text-secondary">您的反馈是我们改进服务的动力</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-sm font-semibold text-gov-text mb-3">服务评分</h3>
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} onClick={() => onUpdate({ rating: i + 1 })} className="p-1">
              <Star
                className={`w-8 h-8 transition-colors ${
                  i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gov-text-secondary mt-2">
            {['', '非常差', '较差', '一般', '满意', '非常满意'][rating]}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gov-text mb-3">服务标签</h3>
        <div className="flex flex-wrap gap-2">
          {ratingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                selectedTags.includes(tag)
                  ? 'border-gov-blue bg-blue-50 text-gov-blue'
                  : 'border-gov-border text-gov-text-secondary hover:border-gov-blue/50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gov-text mb-3">补充说明</h3>
        <textarea
          value={comment}
          onChange={(e) => onUpdate({ comment: e.target.value })}
          className="gov-input min-h-[80px] resize-none"
          placeholder="请输入您的建议或意见（选填）"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="gov-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        提交评价
      </button>
    </div>
  );
}
