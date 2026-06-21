import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { MarketPrice } from '../../../shared/types';
import { cn } from '@/lib/utils';

interface PriceCardProps {
  data: MarketPrice;
  onClick?: () => void;
  selected?: boolean;
}

export const PriceCard: React.FC<PriceCardProps> = ({ data, onClick, selected }) => {
  const isUp = data.change > 0;
  const isDown = data.change < 0;

  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN');
  };

  return (
    <Card 
      hoverable 
      onClick={onClick}
      className={cn(
        'p-5 transition-all duration-300',
        selected && 'ring-2 ring-green-500 bg-green-50/50'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{data.categoryName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{data.unit}</p>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          isUp ? 'bg-orange-100 text-orange-600' : isDown ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
        )}>
          {isUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : isDown ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          <span>{isUp ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold font-mono text-slate-900">
            ¥{formatNumber(data.price)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isUp ? '+' : ''}{formatNumber(data.change)} {data.unit}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">
            {new Date(data.recordedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {data.region && (
            <p className="text-xs text-slate-500 mt-0.5">{data.region}</p>
          )}
        </div>
      </div>

      <div className="mt-4 h-12">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${data.categoryId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isUp ? '#f97316' : isDown ? '#ef4444' : '#64748b'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isUp ? '#f97316' : isDown ? '#ef4444' : '#64748b'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M 0 ${20 + Math.random() * 10} 
                Q 25 ${10 + Math.random() * 20}, 
                  50 ${15 + Math.random() * 15} 
                T 100 ${5 + Math.random() * 25}`}
            fill={`url(#gradient-${data.categoryId})`}
            stroke={isUp ? '#f97316' : isDown ? '#ef4444' : '#64748b'}
            strokeWidth="1.5"
            fillOpacity="0.2"
          />
        </svg>
      </div>
    </Card>
  );
};
