import { Link } from 'react-router-dom';
import { Eye, Users, Clock, Plus, Check, AlertTriangle, Shield, Camera, Calculator, FileSearch } from 'lucide-react';
import type { Property } from '@/types';
import { formatPrice, getAuctionStatusLabel, getAuctionStatusClass, getCountdown, cn, getRiskLevelLabel, getRiskLevelClass } from '@/utils';
import { useCompareStore } from '@/store';
import { useState, useEffect } from 'react';
import { getPropertyReport } from '@/mock/data';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured';
}

export default function PropertyCard({ property, variant = 'default' }: PropertyCardProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const inCompare = isInCompare(property.id);
  const [countdown, setCountdown] = useState(getCountdown(property.auctionStartTime));

  useEffect(() => {
    if (property.status === 'bidding' || property.status === 'deposit') {
      const timer = setInterval(() => {
        setCountdown(getCountdown(property.auctionStartTime));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [property.auctionStartTime, property.status]);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(property.id);
    } else {
      addToCompare(property);
    }
  };

  const discount = Math.round((1 - property.startingPrice / property.appraisalPrice) * 100);

  return (
    <Link
      to={`/detail/${property.id}`}
      className={cn(
        'group block overflow-hidden bg-white rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        variant === 'featured'
          ? 'border-2 border-gold-300 shadow-lg shadow-gold-100/50'
          : 'border border-ink-200'
      )}
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden bg-ink-100">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="absolute top-3 left-3 flex gap-2">
          <span className={cn('tag', getAuctionStatusClass(property.status))}>
            {getAuctionStatusLabel(property.status)}
          </span>
          {variant === 'featured' && (
            <span className="tag bg-gradient-to-r from-gold-500 to-gold-400 text-white border-0">
              精选标的
            </span>
          )}
        </div>

        {property.riskTags.length > 0 && (
          <div className="absolute top-3 right-3">
            <span className={cn('tag', property.riskLevel === 'high' ? 'tag-danger risk-pulse' : 'tag-warning')}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {getRiskLevelLabel(property.riskLevel)}
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-white/80">起拍价</span>
              <div className="text-xl font-bold text-white font-serif">
                ¥{formatPrice(property.startingPrice)}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 bg-gold-500 text-white text-xs font-medium rounded">
                省{discount}%
              </span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60"></div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-ink-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>

        <p className="text-sm text-ink-500 mb-3 line-clamp-1">
          {property.address}
        </p>

        <div className="flex items-center gap-4 text-sm text-ink-600 mb-3">
          <span>{property.rooms}室{property.halls}厅</span>
          <span className="text-ink-300">|</span>
          <span>{property.area}㎡</span>
          <span className="text-ink-300">|</span>
          <span>{property.orientation}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {property.viewerCount}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {property.bidCount}人报名
            </span>
          </div>
          <span>{property.court.slice(0, 6)}...</span>
        </div>

        <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-4 gap-1">
          {[
            { icon: Shield, label: '产权报告', color: getPropertyReport(property.id) ? 'text-primary-600 bg-primary-50' : 'text-ink-400 bg-ink-50', href: `/detail/${property.id}?tab=report` },
            { icon: Camera, label: 'VR全景', color: 'text-gold-600 bg-gold-50', href: `/detail/${property.id}?tab=vr` },
            { icon: Calculator, label: '税费测算', color: 'text-success-600 bg-success-50', href: `/detail/${property.id}?tab=tax` },
            { icon: FileSearch, label: '尽调文档', color: 'text-ink-600 bg-ink-50', href: `/detail/${property.id}?tab=docs` },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1.5 rounded-md text-xs transition-colors',
                  item.color,
                  'hover:opacity-80'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {(property.status === 'bidding' || property.status === 'deposit') && !countdown.isEnded && (
          <div className="mt-3 pt-3 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {property.status === 'bidding' ? '距结束' : '距开拍'}
              </span>
              <div className="flex items-center gap-1 font-mono text-sm">
                <span className="bg-ink-800 text-white px-1.5 py-0.5 rounded">
                  {String(countdown.days).padStart(2, '0')}
                </span>
                <span className="text-ink-400">天</span>
                <span className="bg-ink-800 text-white px-1.5 py-0.5 rounded">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-ink-400">:</span>
                <span className="bg-ink-800 text-white px-1.5 py-0.5 rounded">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleCompareClick}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-md border transition-all',
              inCompare
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-ink-200 text-ink-600 hover:border-primary-400 hover:text-primary-600'
            )}
          >
            {inCompare ? (
              <>
                <Check className="w-4 h-4" />
                已加入对比
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                加入对比
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
