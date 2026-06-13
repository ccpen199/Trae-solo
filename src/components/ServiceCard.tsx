import { Flame, Clock, Building2, ArrowRight, AlertTriangle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceItem } from '@/types';

interface ServiceCardProps {
  service: ServiceItem;
  onClick?: () => void;
}

const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
};

export default function ServiceCard({ service, onClick }: ServiceCardProps) {
  const {
    name,
    bureau,
    processingTime,
    avgDurationHours,
    isHot = false,
    onlineAvailable = true,
    status = 'normal',
  } = service;

  const isMaintenance = status === 'maintenance';
  const HOURS_PER_WORKDAY = 8;
  const avgDurationWorkdays = avgDurationHours / HOURS_PER_WORKDAY;
  const durationDiff = processingTime - avgDurationWorkdays;
  const efficiencyPercent = Math.min(100, Math.max(0, Math.round((avgDurationWorkdays / processingTime) * 100)));

  return (
    <div
      onClick={!isMaintenance ? onClick : undefined}
      aria-label={isMaintenance ? `${name}（维护中）` : name}
      className={cn(
        'card-hoverable flex flex-col h-full p-5 group',
        isMaintenance && 'opacity-70 pointer-events-none cursor-not-allowed hover:translate-y-0 hover:shadow-card'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 leading-snug truncate group-hover:text-gov-700 transition-colors duration-200">
              {name}
            </h3>
            {isHot && !isMaintenance && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-warm-50 text-warm-600 text-xs font-medium shrink-0">
                <Flame className="w-3 h-3" />
                热门
              </span>
            )}
            {isMaintenance && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium shrink-0">
                <Wrench className="w-3 h-3" />
                维护中
              </span>
            )}
          </div>
          <span className="badge-gov">
            <Building2 className="w-3 h-3" />
            {bureau}
          </span>
        </div>
      </div>

      <div className="flex-1 mb-4">
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4" />
                <span>承诺时长</span>
              </div>
              <span className="font-semibold text-slate-800">{processingTime} 工作日</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>平均时长</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gov-700">{formatHours(avgDurationHours)}</span>
                  {durationDiff > 0 && !isMaintenance && (
                    <span className="text-xs text-success-600 font-medium">
                      快 {durationDiff.toFixed(1)} 天
                    </span>
                  )}
                </div>
              </div>
            <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  'absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out',
                  isMaintenance
                    ? 'bg-slate-300'
                    : efficiencyPercent <= 50
                    ? 'bg-gradient-to-r from-success-400 to-success-500'
                    : efficiencyPercent <= 80
                    ? 'bg-gradient-to-r from-gov-400 to-gov-500'
                    : 'bg-gradient-to-r from-gov-500 to-gov-600'
                )}
                style={{ width: `${efficiencyPercent}%` }}
              />
              <div
                className="absolute top-0 h-full w-px bg-slate-300/60"
                style={{ left: `${efficiencyPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {isMaintenance ? (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <span>服务维护中，暂不可办理</span>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200',
            onlineAvailable
              ? 'bg-gov-gradient text-white shadow-gov group-hover:shadow-lg group-hover:-translate-y-0.5'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-gov-50 hover:border-gov-300'
          )}
        >
          {onlineAvailable ? (
            <>
              <span>在线办理</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          ) : (
            <>
              <span>查看详情</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
