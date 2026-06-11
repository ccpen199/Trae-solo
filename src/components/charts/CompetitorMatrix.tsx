import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, MapPin, Home, BedDouble, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { CompetitorItem } from '@/mock/data';

interface CompetitorMatrixProps {
  data: CompetitorItem[];
  basePrice?: number;
}

export default function CompetitorMatrix({
  data,
  basePrice,
}: CompetitorMatrixProps) {
  const { isDark } = useTheme();
  const [sortField, setSortField] = useState<keyof CompetitorItem>('distance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof CompetitorItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return sortDirection === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const getDeviationColor = (deviation: number) => {
    if (deviation > 10) return 'bg-red-500/20 text-red-600 dark:text-red-400';
    if (deviation > 5) return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
    if (deviation >= -5) return 'bg-green-500/20 text-green-600 dark:text-green-400';
    if (deviation >= -10) return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
    return 'bg-purple-500/20 text-purple-600 dark:text-purple-400';
  };

  const getDeviationIcon = (deviation: number) => {
    if (deviation > 0) return <ArrowUp className="w-3 h-3" />;
    if (deviation < 0) return <ArrowDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getPriceComparison = (price: number) => {
    if (!basePrice) return null;
    const diff = price - basePrice;
    const percent = ((diff / basePrice) * 100).toFixed(1);
    return {
      diff,
      percent: `${diff >= 0 ? '+' : ''}${percent}%`,
      isHigher: diff > 0,
    };
  };

  const textColor = isDark ? 'text-gray-200' : 'text-gray-800';
  const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const headerBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const rowHoverBg = isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50';

  const SortIcon = ({ field }: { field: keyof CompetitorItem }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className={headerBg}>
            <th
              className={cn(
                'px-4 py-3 text-left font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                房源
                <SortIcon field="title" />
              </div>
            </th>
            <th
              className={cn(
                'px-4 py-3 text-left font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('distance')}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                距离
                <SortIcon field="distance" />
              </div>
            </th>
            <th
              className={cn(
                'px-4 py-3 text-left font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('area')}
            >
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                面积
                <SortIcon field="area" />
              </div>
            </th>
            <th
              className={cn(
                'px-4 py-3 text-left font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('bedrooms')}
            >
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4" />
                户型
                <SortIcon field="bedrooms" />
              </div>
            </th>
            <th
              className={cn(
                'px-4 py-3 text-right font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('price')}
            >
              总价
              <SortIcon field="price" />
            </th>
            <th
              className={cn(
                'px-4 py-3 text-right font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('unitPrice')}
            >
              单价
              <SortIcon field="unitPrice" />
            </th>
            <th
              className={cn(
                'px-4 py-3 text-center font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('deviation')}
            >
              价格偏差
              <SortIcon field="deviation" />
            </th>
            <th
              className={cn(
                'px-4 py-3 text-left font-semibold text-sm cursor-pointer select-none',
                textColor,
                borderColor,
                'border-b'
              )}
              onClick={() => handleSort('source')}
            >
              来源
              <SortIcon field="source" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => {
            const comparison = getPriceComparison(item.price);
            return (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  'border-b transition-colors duration-200',
                  borderColor,
                  rowHoverBg
                )}
              >
                <td className={cn('px-4 py-3', textColor)}>
                  <div className="font-medium text-sm">{item.title}</div>
                </td>
                <td className={cn('px-4 py-3', subTextColor)}>
                  <span className="text-sm">{item.distance} km</span>
                </td>
                <td className={cn('px-4 py-3', subTextColor)}>
                  <span className="text-sm">{item.area} ㎡</span>
                </td>
                <td className={cn('px-4 py-3', subTextColor)}>
                  <span className="text-sm">{item.bedrooms}室</span>
                </td>
                <td className={cn('px-4 py-3 text-right', textColor)}>
                  <div className="font-semibold text-sm">
                    ¥{(item.price / 10000).toFixed(1)}万
                  </div>
                  {comparison && (
                    <div
                      className={cn(
                        'text-xs',
                        comparison.isHigher
                          ? 'text-red-500'
                          : 'text-green-500'
                      )}
                    >
                      {comparison.percent}
                    </div>
                  )}
                </td>
                <td className={cn('px-4 py-3 text-right', textColor)}>
                  <span className="text-sm font-medium">
                    ¥{item.unitPrice.toLocaleString()}/㎡
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      getDeviationColor(item.deviation)
                    )}
                  >
                    {getDeviationIcon(item.deviation)}
                    {item.deviation >= 0 ? '+' : ''}
                    {item.deviation}%
                  </span>
                </td>
                <td className={cn('px-4 py-3', subTextColor)}>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                    {item.source}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
