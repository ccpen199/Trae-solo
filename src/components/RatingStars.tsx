import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  valuePrecision?: number;
  className?: string;
}

const RatingStars = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  valuePrecision = 1,
  className,
}: RatingStarsProps) => {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= maxRating; i++) {
      let fillClass = 'fill-transparent stroke-zinc-300';
      
      if (i <= fullStars) {
        fillClass = 'fill-accent-500 stroke-accent-500';
      } else if (i === fullStars + 1 && hasHalfStar) {
        fillClass = 'fill-accent-500/50 stroke-accent-500';
      }

      stars.push(
        <Star
          key={i}
          className={cn(sizes[size], 'shrink-0 transition-colors duration-200', fillClass)}
        />
      );
    }
    return stars;
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {renderStars()}
      </div>
      {showValue && (
        <span className={cn(textSizes[size], 'font-medium text-zinc-700 ml-1')}>
          {rating.toFixed(valuePrecision)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
