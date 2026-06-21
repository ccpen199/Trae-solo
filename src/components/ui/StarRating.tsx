import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export const StarRating = ({ rating, size = 16, className = '' }: StarRatingProps) => {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < full ? (
          <Star key={i} size={size} className="fill-accent text-accent" />
        ) : i === full && hasHalf ? (
          <StarHalf key={i} size={size} className="fill-accent text-accent" />
        ) : (
          <Star key={i} size={size} className="text-gray-300" />
        )
      )}
    </div>
  );
};
