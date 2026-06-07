import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'secondary' | 'green' | 'yellow';
  change?: number;
  suffix?: string;
  prefix?: string;
}

const gradientMap = {
  primary: 'gradient-primary',
  secondary: 'gradient-secondary',
  green: 'gradient-green',
  yellow: 'gradient-yellow',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, gradient, change, suffix, prefix }) => {
  return (
    <div className="card overflow-hidden group hover:-translate-y-1 duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 font-serif">
            {prefix && <span className="text-lg text-gray-500 font-normal mr-1">{prefix}</span>}
            {value}
            {suffix && <span className="text-lg text-gray-500 font-normal ml-1">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-accent-green-600' : 'text-red-500'}`}>
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}% 较上月</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${gradientMap[gradient]} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
