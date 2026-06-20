import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Heart, TrendingUp, Shield, Wifi, Coffee, Dumbbell, Utensils, Car } from 'lucide-react';
import { HotelSearchResult, Currency } from '@shared/types';
import { Badge } from '../ui/Badge';
import { cn } from '../lib/utils';
import { useAuthStore, selectMember } from '../../store/authStore';
import { useSearchStore, selectSearchParams } from '../../store/searchStore';

interface HotelCardProps {
  hotel: HotelSearchResult;
  featured?: boolean;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, featured = false }) => {
  const navigate = useNavigate();
  const member = useAuthStore(selectMember);
  const searchParams = useSearchStore(selectSearchParams);
  const [isFavorite, setIsFavorite] = React.useState(false);

  const memberDiscount = member?.tier === 'GOLD' ? 0.10 : member?.tier === 'SILVER' ? 0.05 : 0;
  const discountedPrice = hotel.lowestPrice.amount * (1 - memberDiscount);

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < Math.floor(rating) ? 'text-gold-foil fill-gold-foil' : 'text-cloud-300'
            )}
          />
        ))}
      </div>
    );
  };

  const facilityIcons: Record<string, React.ReactNode> = {
    'Free WiFi': <Wifi className="w-4 h-4" />,
    'Breakfast Included': <Coffee className="w-4 h-4" />,
    'Fitness Center': <Dumbbell className="w-4 h-4" />,
    'Restaurant': <Utensils className="w-4 h-4" />,
    'Parking': <Car className="w-4 h-4" />,
  };

  const handleClick = () => {
    navigate(`/hotels/${hotel.id}`, {
      state: {
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        adults: searchParams.adults,
        children: searchParams.children,
        rooms: searchParams.rooms,
      },
    });
  };

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbols: Record<Currency, string> = {
      [Currency.CNY]: '¥',
      [Currency.USD]: '$',
      [Currency.EUR]: '€',
      [Currency.GBP]: '£',
      [Currency.JPY]: '¥',
      [Currency.AED]: 'AED ',
      [Currency.SGD]: 'S$',
      [Currency.THB]: '฿',
    };
    return `${symbols[currency] || ''}${amount.toLocaleString()}`;
  };

  return (
    <div
      className={cn(
        'card card-hover cursor-pointer overflow-hidden group',
        featured && 'ring-2 ring-gold-foil'
      )}
      onClick={handleClick}
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={hotel.thumbnail}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              isFavorite ? 'text-red-500 fill-red-500' : 'text-graphite-400'
            )}
          />
        </button>
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {featured && (
            <Badge variant="gold" size="sm" dot>
              精选推荐
            </Badge>
          )}
          {hotel.isVIPAccess && (
            <Badge variant="gold" size="sm">
              VIP Access
            </Badge>
          )}
          {memberDiscount > 0 && (
            <Badge variant="accent" size="sm">
              会员 {Math.round(memberDiscount * 100)}% OFF
            </Badge>
          )}
        </div>
        {hotel.compositeScore && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-deep-blue" />
              <span className="text-sm font-bold text-deep-blue">
                {hotel.compositeScore.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-display font-bold text-graphite-900 line-clamp-1">
              {hotel.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(hotel.starRating)}
              <span className="text-sm text-graphite-500">{hotel.starRating}星酒店</span>
            </div>
          </div>
          <div className="ml-3 text-right">
            <div className="flex items-center gap-1 bg-deep-blue/10 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-deep-blue fill-deep-blue" />
              <span className="font-bold text-deep-blue">{hotel.overallRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-graphite-500">{hotel.reviewCount} 条评价</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-graphite-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">
            {hotel.address.city}, {hotel.address.country}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {hotel.facilities.slice(0, 4).map((facility) => (
            <div
              key={facility}
              className="flex items-center gap-1 px-2 py-1 bg-cloud-100 rounded-full text-xs text-graphite-600"
              title={facility}
            >
              {facilityIcons[facility] || null}
              <span className="hidden sm:inline">{facility}</span>
            </div>
          ))}
          {hotel.facilities.length > 4 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-cloud-100 rounded-full text-xs text-graphite-600">
              +{hotel.facilities.length - 4}
            </div>
          )}
        </div>

        {hotel.tags && hotel.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hotel.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="primary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-cloud-200">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                {memberDiscount > 0 && (
                  <span className="text-sm text-graphite-400 line-through">
                    {formatCurrency(hotel.lowestPrice.amount, hotel.lowestPrice.currency)}
                  </span>
                )}
                <span className="text-2xl font-display font-bold text-coral-orange">
                  {formatCurrency(
                    memberDiscount > 0 ? discountedPrice : hotel.lowestPrice.amount,
                    hotel.lowestPrice.currency
                  )}
                </span>
                <span className="text-sm text-graphite-500">
                  / {hotel.lowestPriceNight}晚
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {hotel.isFreeCancellation && (
                  <Badge variant="success" size="sm" dot>
                    免费取消
                  </Badge>
                )}
                {hotel.includesBreakfast && (
                  <Badge variant="info" size="sm" dot>
                    含早餐
                  </Badge>
                )}
                {hotel.isPayAtHotel && (
                  <Badge variant="warning" size="sm" dot>
                    到店支付
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              {hotel.priceComparison && (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <Shield className="w-3 h-3" />
                  <span>比{hotel.priceComparison.bestCompetitor}省 {hotel.priceComparison.savingPercent}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
