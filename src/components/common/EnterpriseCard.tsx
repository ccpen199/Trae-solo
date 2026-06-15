import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, MapPin, Award } from 'lucide-react';
import { Avatar, Tag, Badge } from 'antd';
import { cn } from '@/lib/utils';
import TownshipTag from './TownshipTag';
import { Enterprise, TownshipCode } from '@shared/types';

export interface EnterpriseCardProps {
  enterprise: Enterprise;
  className?: string;
  onClick?: (enterprise: Enterprise) => void;
}

export default function EnterpriseCard({
  enterprise,
  className,
  onClick,
}: EnterpriseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(enterprise);
    } else {
      navigate(`/enterprise/${enterprise.id}`);
    }
  };

  const getInitial = (name: string) => {
    return name?.charAt(0) || '企';
  };

  const getCreditRatingColor = (rating?: string) => {
    switch (rating) {
      case 'A': return { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' };
      case 'B': return { bg: 'bg-industrial-blue-50', text: 'text-industrial-blue-600', border: 'border-industrial-blue-200' };
      case 'C': return { bg: 'bg-vital-orange-50', text: 'text-vital-orange-600', border: 'border-vital-orange-200' };
      case 'D': return { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-200' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
    }
  };

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
      <div className="flex items-start gap-4 mb-4">
        <Badge dot={enterprise.verified} color="#00B42A" offset={[-4, 4]}>
          <Avatar
            size={48}
            className="bg-industrial-gradient text-white font-medium"
            src={enterprise.logo}
          >
            {getInitial(enterprise.name)}
          </Avatar>
        </Badge>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={cn(
                'text-base font-semibold text-gray-900 truncate',
                'group-hover:text-industrial-blue-600 transition-colors'
              )}
            >
              {enterprise.name}
            </h3>
            {enterprise.verified && (
              <Award size={14} className="text-success-500 flex-shrink-0" />
            )}
            {enterprise.creditRating && (
              <span
                className={cn(
                  'inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded border',
                  getCreditRatingColor(enterprise.creditRating).bg,
                  getCreditRatingColor(enterprise.creditRating).text,
                  getCreditRatingColor(enterprise.creditRating).border
                )}
              >
                {enterprise.creditRating}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tag color="blue" className="text-xs m-0">
              {enterprise.industry}
            </Tag>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={10} />
              {enterprise.scale}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MapPin size={12} className="text-gray-400" />
        <TownshipTag code={enterprise.township as TownshipCode} size="sm" showIcon={false} />
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
        {enterprise.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <Building2 size={14} className="text-industrial-blue-500" />
          <span className="text-sm text-gray-600">
            在招 <span className="font-semibold text-industrial-blue-600">{enterprise.openPositionCount}</span> 个职位
          </span>
        </div>
        {enterprise.verified && (
          <span className="text-xs text-success-600 bg-success-50 px-2 py-0.5 rounded">
            属地认证
          </span>
        )}
      </div>
    </motion.div>
  );
}
