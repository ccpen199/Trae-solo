import { useRef } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Clock,
  Droplets,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { HourlyForecast } from '../../shared/types';
import { cn } from '../lib/utils';

interface HourlyStripProps {
  data: HourlyForecast[];
  loading?: boolean;
  className?: string;
}

function getWeatherIcon(code: string) {
  if (code.includes('sun') || code.includes('clear')) return Sun;
  if (code.includes('rain')) return CloudRain;
  if (code.includes('snow')) return CloudSnow;
  if (code.includes('thunder') || code.includes('storm')) return CloudLightning;
  if (code.includes('fog') || code.includes('mist') || code.includes('haze')) return CloudFog;
  if (code.includes('cloud')) return Cloud;
  return Sun;
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return `${date.getHours().toString().padStart(2, '0')}:00`;
}

function HourlyCard({ forecast, isNow }: { forecast: HourlyForecast; isNow?: boolean }) {
  const WeatherIcon = getWeatherIcon(forecast.weatherCode);
  const hasPrecip = forecast.precipitation > 0;

  return (
    <div
      className={cn(
        'flex-shrink-0 w-16 md:w-20 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all',
        isNow
          ? 'bg-gradient-to-b from-blue-500/20 to-cyan-500/10 border border-blue-500/30'
          : 'hover:bg-slate-800/40'
      )}
    >
      <span
        className={cn(
          'text-xs font-medium',
          isNow ? 'text-blue-400' : 'text-slate-400'
        )}
      >
        {isNow ? '现在' : formatTime(forecast.time)}
      </span>

      <WeatherIcon
        className={cn(
          'w-6 h-6 md:w-7 md:h-7',
          isNow ? 'text-blue-400' : 'text-slate-300'
        )}
      />

      <span className={cn('text-lg font-semibold', isNow ? 'text-white' : 'text-slate-200')}>
        {Math.round(forecast.temperature)}°
      </span>

      <div className="flex items-center gap-1">
        <Droplets className={cn('w-3 h-3', hasPrecip ? 'text-blue-400' : 'text-slate-600')} />
        <span className={cn('text-xs', hasPrecip ? 'text-blue-400' : 'text-slate-600')}>
          {forecast.precipitation > 0 ? `${forecast.precipitation.toFixed(1)}mm` : '--'}
        </span>
      </div>
    </div>
  );
}

export default function HourlyStrip({ data, loading, className }: HourlyStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading || data.length === 0) {
    return (
      <div className={cn('glass-card p-6', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-700/50"></div>
          <div>
            <div className="h-5 w-32 bg-slate-700/50 rounded-lg mb-1"></div>
            <div className="h-4 w-24 bg-slate-700/30 rounded-lg"></div>
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-16 md:w-20 h-28 bg-slate-700/30 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const displayData = data.slice(0, 24);

  return (
    <div className={cn('glass-card p-6 relative', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-400/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">24小时预报</h3>
            <p className="text-xs text-slate-400">逐小时天气趋势</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-2 px-2"
      >
        {displayData.map((forecast, index) => (
          <HourlyCard key={`${forecast.time}-${index}`} forecast={forecast} isNow={index === 0} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>温度趋势</span>
          <span>
            最高 {Math.max(...displayData.map((f) => f.temperature)).toFixed(0)}° / 最低{' '}
            {Math.min(...displayData.map((f) => f.temperature)).toFixed(0)}°
          </span>
        </div>
        <div className="mt-2 h-12 relative">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${displayData.length * 60} 48`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const temps = displayData.map((f) => f.temperature);
              const minTemp = Math.min(...temps);
              const maxTemp = Math.max(...temps);
              const range = maxTemp - minTemp || 1;
              const points = temps.map((temp, i) => {
                const x = i * 60 + 30;
                const y = 44 - ((temp - minTemp) / range) * 36;
                return `${x},${y}`;
              });
              const pathD = `M ${points.join(' L ')}`;
              const areaD = `M 30,44 L ${points.join(' L ')} L ${(temps.length - 1) * 60 + 30},44 Z`;
              return (
                <>
                  <path d={areaD} fill="url(#tempGradient)" />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {temps.map((_, i) => {
                    const x = i * 60 + 30;
                    const y = 44 - ((temps[i] - minTemp) / range) * 36;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={i === 0 ? 4 : 2}
                        fill={i === 0 ? '#3b82f6' : '#0a0f1a'}
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}
