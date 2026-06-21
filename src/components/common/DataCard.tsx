import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Sparkline from './Sparkline';

type TrendType = 'up' | 'down' | 'flat';
type ComparePeriod = 'week' | 'month' | 'quarter';

interface DataCardProps {
  title: string;
  value: number | string;
  unit?: string;
  prefix?: ReactNode;
  trend?: number;
  trendType?: TrendType;
  sparkline?: number[];
  comparedTo?: ComparePeriod;
  accentColor?: string;
  className?: string;
}

// 对比周期中文映射
const periodLabels: Record<ComparePeriod, string> = {
  week: '上周',
  month: '上月',
  quarter: '上季',
};

// 趋势颜色配置
const trendColors = {
  up: 'text-success-600 bg-success-50',
  down: 'text-danger-600 bg-danger-50',
  flat: 'text-ink-500 bg-ink-100',
};

export default function DataCard({
  title,
  value,
  unit,
  prefix,
  trend,
  trendType,
  sparkline,
  comparedTo,
  accentColor = '#0F4C81',
  className,
}: DataCardProps) {
  // 自动推断趋势类型
  const autoTrendType: TrendType =
    trendType || (trend === undefined ? 'flat' : trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat');

  // 趋势图标
  const TrendIcon =
    autoTrendType === 'up' ? TrendingUp : autoTrendType === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white p-5 shadow-card transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-cardHover',
        className
      )}
    >
      {/* 左侧品牌色边条 */}
      <div
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* 顶部标题区 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center">
          {prefix && (
            <div
              className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
            >
              {prefix}
            </div>
          )}
          <h3 className="text-sm font-medium text-ink-600">{title}</h3>
        </div>

        {/* 趋势徽章 */}
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
              trendColors[autoTrendType]
            )}
          >
            <TrendIcon className="mr-0.5 h-3 w-3" />
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* 中央数值 */}
      <div className="mb-4 flex items-baseline">
        <span className="font-mono text-3xl font-bold text-ink-800 animate-count-up tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('zh-CN') : value}
        </span>
        {unit && <span className="ml-1.5 text-sm font-medium text-ink-500">{unit}</span>}
      </div>

      {/* 底部 Sparkline + 对比周期 */}
      <div className="flex items-end justify-between">
        {sparkline && sparkline.length > 0 ? (
          <Sparkline data={sparkline} color={accentColor} width={120} height={36} />
        ) : (
          <div />
        )}

        {comparedTo && (
          <span className="text-xs text-ink-400">
            较{periodLabels[comparedTo]}
            {autoTrendType === 'up' && '上升'}
            {autoTrendType === 'down' && '下降'}
            {autoTrendType === 'flat' && '持平'}
          </span>
        )}
      </div>
    </div>
  );
}
