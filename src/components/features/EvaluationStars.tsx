import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvaluationStarsProps {
  rating: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export default function EvaluationStars({
  rating,
  readonly = false,
  onChange,
  size = 'md',
}: EvaluationStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  const handleClick = (index: number, isHalf: boolean) => {
    if (readonly) return;
    const newRating = isHalf ? index - 0.5 : index;
    onChange?.(newRating);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    setHoverRating(isLeftHalf ? index - 0.5 : index);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', !readonly && 'cursor-pointer')}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = displayRating >= index;
        const isHalfFilled = !isFilled && displayRating >= index - 0.5;

        return (
          <div
            key={index}
            className="relative"
            onMouseMove={(e) => handleMouseMove(e, index)}
            onClick={(e) => {
              if (readonly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const isLeftHalf = e.clientX - rect.left < rect.width / 2;
              handleClick(index, isLeftHalf);
            }}
          >
            <motion.div whileTap={readonly ? {} : { scale: 0.9 }} className="relative">
              <Star
                className={cn(
                  sizeMap[size],
                  'text-primary-200 transition-colors',
                  !readonly && 'cursor-pointer'
                )}
              />

              {isFilled && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute inset-0"
                >
                  <Star
                    className={cn(sizeMap[size], 'fill-amber-400 text-amber-400')}
                  />
                </motion.div>
              )}

              {isHalfFilled && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    className={cn(sizeMap[size], 'fill-amber-400 text-amber-400')}
                  />
                </div>
              )}
            </motion.div>
          </div>
        );
      })}

      {readonly && (
        <span className="ml-2 text-sm font-medium text-primary-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
