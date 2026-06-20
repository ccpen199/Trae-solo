import { Clock, MapPin, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Job, Factory } from '@shared/types';

interface JobCardProps {
  job: Job & { factory?: Factory };
  onFactoryClick?: (factoryId: string) => void;
}

export default function JobCard({ job, onFactoryClick }: JobCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/worker/job/${job.id}`);
  };

  const handleFactoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFactoryClick) {
      onFactoryClick(job.factoryId);
    } else {
      navigate(`/worker/factory/${job.factoryId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden',
        'border border-gray-100 hover:border-brand-200 active:scale-[0.98]'
      )}
    >
      {job.urgent && (
        <div className="bg-gradient-to-r from-danger-500 to-danger-600 text-white text-xs px-3 py-1 flex items-center gap-1">
          <Zap size={12} fill="white" />
          <span>急招 · 今天可面试</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
              {job.highSubsidy && (
                <span className="bg-accent-50 text-accent-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  高补贴
                </span>
              )}
            </div>
            <div className="text-accent-500 font-bold text-xl">
              ¥{job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()}
              <span className="text-xs text-gray-400 font-normal ml-1">/月</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">招 {job.vacancy} 人</div>
            {job.distanceKm !== undefined && (
              <div className="text-xs text-brand-500 font-medium mt-1 flex items-center gap-0.5 justify-end">
                <MapPin size={12} />
                {job.distanceKm < 1 ? `${Math.round(job.distanceKm * 1000)}m` : `${job.distanceKm.toFixed(1)}km`}
              </div>
            )}
          </div>
        </div>

        <div
          onClick={handleFactoryClick}
          className="flex items-center gap-2 py-2 border-y border-gray-50 mb-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
        >
          {job.factory?.ehsRating && (
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white',
                job.factory.ehsRating === 'A' && 'bg-success-500',
                job.factory.ehsRating === 'B' && 'bg-brand-500',
                job.factory.ehsRating === 'C' && 'bg-warning-500',
                job.factory.ehsRating === 'D' && 'bg-danger-500'
              )}
            >
              EHS{job.factory.ehsRating}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 line-clamp-1">{job.factory?.name || '加载中...'}</div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>{job.factory?.industry}</span>
              <span>·</span>
              <span>{job.factory?.scale}</span>
            </div>
          </div>
          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs px-2 py-1 rounded-md">
            <Clock size={12} />
            {job.workHours}
          </span>
          {job.overtimeRate.weekday > 1 && (
            <span className="bg-accent-50 text-accent-600 text-xs px-2 py-1 rounded-md">
              加班{job.overtimeRate.weekday}倍
            </span>
          )}
          {job.board.provided && (
            <span className="bg-success-50 text-success-600 text-xs px-2 py-1 rounded-md">
              包吃{job.board.costPerMonth ? `(¥${job.board.costPerMonth}/月)` : ''}
            </span>
          )}
          {job.lodging.provided && (
            <span className="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-md">
              包住{job.lodging.roomType ? `·${job.lodging.roomType}` : ''}
            </span>
          )}
        </div>

        {job.benefits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.benefits.slice(0, 4).map((b, i) => (
              <span
                key={i}
                className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100"
              >
                {b}
              </span>
            ))}
            {job.benefits.length > 4 && (
              <span className="text-xs text-gray-400">+{job.benefits.length - 4}</span>
            )}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-transparent px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Star size={12} className="text-warning-500 fill-warning-500" />
          <span className="font-medium text-gray-700">{job.factory?.interviewSummaries?.[0]?.satisfaction || 4.8}</span>
          <span className="text-gray-400">满意度</span>
        </div>
        <span className="text-xs text-brand-500 font-medium">查看详情 →</span>
      </div>
    </div>
  );
}
