import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { cn } from '@/lib/utils';

interface DataCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  chartData?: number[];
  icon?: React.ReactNode;
  className?: string;
}

export default function DataCard({
  title,
  value,
  change,
  changeLabel = '较上期',
  chartData,
  icon,
  className,
}: DataCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  const chartOption = chartData
    ? {
        grid: {
          top: 5,
          right: 0,
          bottom: 0,
          left: 0,
        },
        xAxis: {
          type: 'category',
          show: false,
          data: chartData.map((_, i) => i),
        },
        yAxis: {
          type: 'value',
          show: false,
        },
        series: [
          {
            data: chartData,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: {
              width: 2,
              color: isPositive ? '#E63946' : isNegative ? '#2A9D8F' : '#3D5FA9',
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: isPositive
                      ? 'rgba(230, 57, 70, 0.2)'
                      : isNegative
                      ? 'rgba(42, 157, 143, 0.2)'
                      : 'rgba(61, 95, 169, 0.2)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(255, 255, 255, 0)',
                  },
                ],
              },
            },
          },
        ],
      }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(10, 36, 99, 0.12)' }}
      className={cn('data-card', className)}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            {icon}
          </div>
        )}
      </div>

      <div className="mb-2">
        <motion.p
          key={String(value)}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold text-neutral-900"
        >
          {value}
        </motion.p>
      </div>

      {change !== undefined && (
        <div className="mb-3 flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium',
              isPositive && 'bg-accent-up/10 text-accent-up',
              isNegative && 'bg-accent-down/10 text-accent-down',
              isNeutral && 'bg-neutral-100 text-neutral-500'
            )}
          >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs text-neutral-400">{changeLabel}</span>
        </div>
      )}

      {chartData && chartOption && (
        <div className="h-12 w-full">
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      )}
    </motion.div>
  );
}
