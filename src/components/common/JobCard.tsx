import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, GraduationCap, Briefcase } from 'lucide-react';
import { Button, Tag } from 'antd';
import { cn } from '@/lib/utils';
import MatchScoreRing from './MatchScoreRing';
import TownshipTag from './TownshipTag';
import { JobPosition, TownshipCode } from '@shared/types';

export interface JobCardProps {
  job: JobPosition;
  matchScore?: number;
  className?: string;
  onViewDetail?: (job: JobPosition) => void;
}

export default function JobCard({
  job,
  matchScore,
  className,
  onViewDetail,
}: JobCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onViewDetail) {
      onViewDetail(job);
    } else if (job.id) {
      navigate(`/jobs/${job.id}`);
    }
  };

  const formatSalary = () => {
    const min = job.salaryMin;
    const max = job.salaryMax;
    if (!min && !max) return '面议';
    if (min === max) return `${min}K`;
    return `${min}-${max}K`;
  };

  const benefits = job.benefits || [];
  const displayBenefits = benefits.slice(0, 5);

  return (
    <motion.div
      className={cn(
        'bg-white rounded-lg border border-gray-100 p-5 cursor-pointer',
        'group',
        className
      )}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ 
        y: -4, 
        boxShadow: '0 12px 32px rgba(22, 93, 255, 0.15)',
        borderColor: '#C9DCFF'
      }}
      style={{
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
      }}
    >
      <div className="flex gap-4">
        {matchScore !== undefined && (
          <div className="flex-shrink-0">
            <MatchScoreRing score={matchScore} size="lg" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={cn(
                'text-base font-semibold text-gray-900 truncate',
                'group-hover:text-industrial-blue-600 transition-colors'
              )}
            >
              {job.title}
            </h3>
            {job.urgent && (
              <Tag color="red" className="flex-shrink-0 text-xs">
                急招
              </Tag>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-3 truncate">
            {job.enterpriseName}
          </p>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl font-bold text-vital-orange-500">
              {formatSalary()}
            </span>
            <span className="text-xs text-gray-400">{job.salaryType || '月薪'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {job.township && (
              <TownshipTag code={job.township as TownshipCode} size="sm" />
            )}
            {job.experience && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                <Briefcase size={10} />
                {job.experience}
              </span>
            )}
            {job.education && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                <GraduationCap size={10} />
                {job.education}
              </span>
            )}
          </div>

          {displayBenefits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {displayBenefits.map((benefit, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 bg-industrial-blue-50 text-industrial-blue-600 rounded"
                >
                  {benefit}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="primary"
              size="small"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              icon={<ArrowRight size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              查看详情
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
