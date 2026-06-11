import React, { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, MapPin, Clock, CloudSun, Package, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FareItem {
  key: string;
  label: string;
  amount: number;
  description: string;
  icon?: React.ReactNode;
  dynamic?: boolean;
  dynamicRule?: string;
}

export interface FareBreakdownProps {
  basePrice?: number;
  distancePrice?: number;
  peakSurcharge?: number;
  weatherMultiplier?: number;
  goodsSurcharge?: number;
  totalAmount: number;
  items?: FareItem[];
  className?: string;
  compact?: boolean;
}

const defaultIcons: Record<string, React.ReactNode> = {
  base: <DollarSign className="w-3.5 h-3.5" />,
  distance: <MapPin className="w-3.5 h-3.5" />,
  peak: <Clock className="w-3.5 h-3.5" />,
  weather: <CloudSun className="w-3.5 h-3.5" />,
  goods: <Package className="w-3.5 h-3.5" />,
};

export const FareBreakdown: React.FC<FareBreakdownProps> = ({
  basePrice,
  distancePrice,
  peakSurcharge = 0,
  weatherMultiplier = 1,
  goodsSurcharge = 0,
  totalAmount,
  items,
  className,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const fareItems: FareItem[] = items || [
    {
      key: 'base',
      label: '基础配送费',
      amount: basePrice ?? Math.round(totalAmount * 0.35),
      description: '覆盖骑手取件、基础配送的保底费用，3公里内起送',
      dynamic: false,
    },
    {
      key: 'distance',
      label: '里程费',
      amount: distancePrice ?? Math.round(totalAmount * 0.4),
      description: '超出3公里部分按 ¥2.5/公里 计费，距离越远单价递减',
      dynamic: true,
      dynamicRule: '距离阶梯定价',
    },
    {
      key: 'peak',
      label: '时段溢价',
      amount: peakSurcharge,
      description: peakSurcharge > 0 ? '午高峰(11:00-13:00) / 晚高峰(17:00-19:00) 额外加收' : '非高峰时段，无溢价',
      dynamic: peakSurcharge > 0,
      dynamicRule: peakSurcharge > 0 ? '高峰时段 x1.3' : undefined,
    },
    {
      key: 'weather',
      label: '天气系数',
      amount: weatherMultiplier > 1 ? Math.round(totalAmount * (weatherMultiplier - 1)) : 0,
      description: weatherMultiplier > 1 ? '雨雪/极端天气动态调价，保障骑手激励' : '天气正常，无额外系数',
      dynamic: weatherMultiplier > 1,
      dynamicRule: weatherMultiplier > 1 ? `恶劣天气 x${weatherMultiplier.toFixed(1)}` : undefined,
    },
    {
      key: 'goods',
      label: '货品加价',
      amount: goodsSurcharge,
      description: goodsSurcharge > 0 ? '生鲜/易碎/超重货品特殊处理费' : '普通货品，无额外加价',
      dynamic: goodsSurcharge > 0,
      dynamicRule: goodsSurcharge > 0 ? '特殊货品 x1.2' : undefined,
    },
  ];

  const visibleItems = expanded ? fareItems : fareItems.slice(0, 2);
  const hasMore = fareItems.length > 2;

  return (
    <div className={cn(
      'bg-space-blue-700/50 border border-space-blue-600 rounded-xl overflow-hidden',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-space-blue-600 bg-space-blue-800/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-accent-400" />
          <span className="text-sm font-semibold text-gray-100">运费拆分明细</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">合计</span>
          <span className="text-lg font-bold text-amber-accent-400 font-mono-code">¥{totalAmount}</span>
        </div>
      </div>

      <div className="p-3 space-y-1">
        {visibleItems.map((item) => (
          <div
            key={item.key}
            className="group"
          >
            <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-space-blue-600/50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                  item.dynamic
                    ? 'bg-amber-accent-500/15 text-amber-accent-400'
                    : 'bg-space-blue-600 text-gray-400'
                )}>
                  {defaultIcons[item.key] || <DollarSign className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-200">{item.label}</span>
                    {item.dynamic && item.dynamicRule && (
                      <span className="px-1.5 py-0.5 bg-amber-accent-500/15 text-amber-accent-400 rounded text-[10px] font-medium">
                        {item.dynamicRule}
                      </span>
                    )}
                  </div>
                  {expanded && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                  )}
                </div>
              </div>
              <span className={cn(
                'text-sm font-mono-code font-medium flex-shrink-0 ml-2',
                item.amount > 0 ? 'text-gray-100' : 'text-gray-500'
              )}>
                {item.amount > 0 ? `+¥${item.amount}` : '¥0'}
              </span>
            </div>
          </div>
        ))}

        {compact && hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 py-2 mt-1 text-xs text-gray-400 hover:text-amber-accent-400 hover:bg-space-blue-600/30 rounded-lg transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                收起明细
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                展开全部 {fareItems.length} 项
              </>
            )}
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between pt-3 border-t border-dashed border-space-blue-500">
            <span className="text-sm text-gray-400">预估总价</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-500 line-through mr-2">
                ¥{Math.round(totalAmount * 1.15)}
              </span>
              <span className="text-xl font-bold text-amber-accent-400 font-mono-code">
                ¥{totalAmount}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-success-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              已享平台优惠
            </span>
            <span className="text-xs text-success-400 font-mono-code">
              省 ¥{Math.round(totalAmount * 0.15)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FareBreakdown;
