import { StarRating } from '@/components/ui/StarRating';
import { cn } from '@/lib/utils';
import type { ServiceProvider } from '@/types';
import { formatDistance } from '@/utils/lbs';
import { Award, Clock, MapPin, ShoppingCart, ThumbsUp, User } from 'lucide-react';

interface ProviderCardProps {
  provider: ServiceProvider;
  rank: number;
  distance?: number;
}

export const ProviderCard = ({ provider, rank, distance }: ProviderCardProps) => {
  const rankStyles: Record<number, string> = {
    1: 'bg-accent text-white',
    2: 'bg-brand-300 text-white',
    3: 'bg-mint text-white',
  };

  const previewReviews = provider.reviews.slice(0, 2);

  return (
    <div className="relative bg-white rounded-3xl2 shadow-card p-6 border border-warm-card overflow-hidden">
      <div
        className={cn(
          'absolute -top-2 -left-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg',
          rankStyles[rank] || 'bg-gray-200 text-gray-600'
        )}
      >
        {rank}
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-16 h-16 rounded-2xl2 object-cover border-2 border-warm-card"
          />
          <div className="absolute -bottom-1 -right-1 bg-mint text-white rounded-full p-0.5">
            <Award size={12} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-brand text-lg truncate">{provider.name}</h3>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-brand-50 text-brand text-xs rounded-full">
                {provider.category}
              </span>
            </div>
            <StarRating rating={provider.starLevel} size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex flex-col items-center bg-warm-bg rounded-xl2 py-2">
          <ShoppingCart size={14} className="text-accent mb-0.5" />
          <span className="text-xs text-gray-500">接单量</span>
          <span className="text-sm font-bold text-brand">{provider.orderCount}</span>
        </div>
        <div className="flex flex-col items-center bg-warm-bg rounded-xl2 py-2">
          <ThumbsUp size={14} className="text-mint mb-0.5" />
          <span className="text-xs text-gray-500">好评率</span>
          <span className="text-sm font-bold text-brand">{(provider.goodRate * 100).toFixed(0)}%</span>
        </div>
        <div className="flex flex-col items-center bg-warm-bg rounded-xl2 py-2">
          <Clock size={14} className="text-brand-400 mb-0.5" />
          <span className="text-xs text-gray-500">响应</span>
          <span className="text-sm font-bold text-brand">{provider.responseSpeed}秒</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin size={14} className="text-accent" />
          <span>{distance !== undefined ? formatDistance(distance) : '—'}</span>
        </div>
        <span className="text-accent font-bold">{provider.priceRange}</span>
      </div>

      <div className="space-y-2 mb-5">
        {previewReviews.map((review) => (
          <div key={review.id} className="bg-warm-bg rounded-xl2 p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
                <User size={10} className="text-brand" />
              </div>
              <span className="text-xs font-medium text-brand">{review.userName}</span>
              <StarRating rating={review.rating} size={10} />
            </div>
            <p className="text-xs text-gray-600 line-clamp-1">{review.content}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-2.5 rounded-xl2 border border-brand text-brand text-sm font-medium hover:bg-brand-50 transition-colors">
          查看详情
        </button>
        <button className="flex-1 py-2.5 rounded-xl2 bg-accent text-white text-sm font-medium hover:bg-accent-600 transition-colors shadow-soft">
          立即下单
        </button>
      </div>
    </div>
  );
};
