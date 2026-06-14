import { motion } from 'framer-motion';
import {
  Home,
  BedDouble,
  Bath,
  MapPin,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  UserCheck,
  Eye,
  Link2,
} from 'lucide-react';
import type { Property } from '@/mock/data';
import { cn } from '@/lib/utils';
import PriceAlertBadge from './PriceAlertBadge';

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  className?: string;
}

export default function PropertyCard({
  property,
  onClick,
  className,
}: PropertyCardProps) {
  const priceChange = property.priceHistory.length >= 2
    ? ((property.price - property.priceHistory[property.priceHistory.length - 2].price) /
        property.priceHistory[property.priceHistory.length - 2].price) * 100
    : 0;

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return price.toLocaleString();
  };

  const unitText = '万';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'card cursor-pointer overflow-hidden p-0',
        className
      )}
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
          <img
            src={property.images[0] || '/api/ide/v1/text_to_image?prompt=modern%20luxury%20apartment%20exterior%20real%20estate%20property&image_size=square'}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        <div className="absolute left-3 top-3 flex gap-2">
          {property.isVerified && (
            <span className="badge-verified">
              <ShieldCheck className="h-3 w-3" />
              真房源
            </span>
          )}
          {Math.abs(priceChange) >= 5 && (
            <PriceAlertBadge deviation={priceChange} />
          )}
        </div>

        {priceChange !== 0 && (
          <div
            className={cn(
              'absolute right-3 top-3 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
              priceChange > 0
                ? 'bg-accent-up/10 text-accent-up'
                : 'bg-accent-down/10 text-accent-down'
            )}
          >
            {priceChange > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {priceChange > 0 ? '+' : ''}
            {priceChange.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-2 line-clamp-1 text-base font-semibold text-neutral-900">
          {property.title}
        </h3>

        <div className="mb-3 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-accent-up">
            {formatPrice(property.price)}
          </span>
          <span className="text-sm text-neutral-500">{unitText}</span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
          <span className="flex items-center gap-1">
            <Home className="h-4 w-4 text-primary-500" />
            {property.area}㎡
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-4 w-4 text-primary-500" />
            {property.bedrooms}室
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4 text-primary-500" />
            {property.bathrooms}卫
          </span>
        </div>

        <div className="mb-3 flex items-center gap-1 text-sm text-neutral-500">
          <MapPin className="h-4 w-4 text-primary-400" />
          <span className="line-clamp-1">{property.district}</span>
          <span className="mx-1">·</span>
          <span className="line-clamp-1">{property.city}</span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {property.orientation && (
            <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
              {property.orientation}
            </span>
          )}
          {property.decoration && (
            <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
              {property.decoration}
            </span>
          )}
          {property.floor && (
            <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
              {property.floor}
            </span>
          )}
        </div>

        {property.isVerified && property.verificationChain ? (
          <div className="mb-3">
            <div className="mb-1.5 text-xs font-medium text-neutral-500">核验链条</div>
            <div className="flex items-center">
              {[
                {
                  type: 'broker' as const,
                  label: '经纪人认证',
                  Icon: UserCheck,
                },
                {
                  type: 'owner' as const,
                  label: '业主授权',
                  Icon: ShieldCheck,
                },
                {
                  type: 'vr' as const,
                  label: 'VR水印',
                  Icon: Eye,
                },
                {
                  type: 'chain' as const,
                  label: '链上存证',
                  Icon: Link2,
                },
              ].map((step, idx) => {
                const node = property.verificationChain!.find(
                  (n) => n.type === step.type
                );
                const isVerified = node?.status === 'verified';

                return (
                  <div key={step.type} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full',
                          isVerified
                            ? 'bg-accent-verified/10 text-accent-verified'
                            : 'bg-neutral-100 text-neutral-300'
                        )}
                      >
                        <step.Icon className="h-3.5 w-3.5" />
                      </div>
                      <span
                        className={cn(
                          'mt-0.5 text-[10px] leading-tight',
                          isVerified
                            ? 'text-accent-verified'
                            : 'text-neutral-300'
                        )}
                      >
                        {step.label}
                      </span>
                      {step.type === 'broker' && property.brokerName && isVerified && (
                        <span className="text-[9px] text-neutral-400 leading-tight truncate max-w-[56px]">
                          {property.brokerName}
                        </span>
                      )}
                    </div>
                    {idx < 3 && (
                      <div
                        className={cn(
                          'mx-0.5 h-px w-3',
                          isVerified ? 'bg-accent-verified/40' : 'bg-neutral-200'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-3 text-xs text-neutral-400">待核验</div>
        )}

        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {property.source}
            {(() => {
              const sourceCount = Math.floor(Math.random() * 3) + 2;
              return property.source ? (
                <span className="text-neutral-300">· {sourceCount}个来源报价</span>
              ) : null;
            })()}
          </span>
          <span className="flex items-center gap-1.5">
            {(() => {
              const now = new Date();
              const listing = new Date(property.listingDate);
              const diffMs = now.getTime() - listing.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays < 1) return '挂牌今天';
              if (diffDays < 30) return `挂牌${diffDays}天`;
              const diffMonths = Math.floor(diffDays / 30);
              if (diffMonths < 12) return `挂牌${diffMonths}个月`;
              const diffYears = Math.floor(diffMonths / 12);
              return `挂牌${diffYears}年`;
            })()}
            <span className="text-neutral-200">|</span>
            {new Date(property.listingDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
