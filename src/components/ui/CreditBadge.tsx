import { motion } from 'framer-motion';
import { Shield, Crown, Award, Star, AlertTriangle } from 'lucide-react';
import { getCreditLevelBg } from '@/utils/formatters';
import type { CreditLevel } from '@/types';

interface CreditBadgeProps {
  score: number;
  level: CreditLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const getLevelIcon = (level: CreditLevel) => {
  switch (level) {
    case 'S':
      return <Crown className="w-full h-full" />;
    case 'A':
      return <Award className="w-full h-full" />;
    case 'B':
      return <Shield className="w-full h-full" />;
    case 'C':
      return <Star className="w-full h-full" />;
    case 'D':
      return <AlertTriangle className="w-full h-full" />;
  }
};

const sizeClasses = {
  sm: {
    wrapper: 'px-2 py-1 gap-1',
    icon: 'w-3.5 h-3.5',
    text: 'text-xs',
  },
  md: {
    wrapper: 'px-3 py-1.5 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  lg: {
    wrapper: 'px-4 py-2 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
};

export default function CreditBadge({ score, level, size = 'md', showIcon = true }: CreditBadgeProps) {
  const sizeClass = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center ${sizeClass.wrapper} rounded-full font-medium ${getCreditLevelBg(level)}`}
    >
      {showIcon && <span className={sizeClass.icon}>{getLevelIcon(level)}</span>}
      <span className={sizeClass.text}>
        {level}级 · {score}分
      </span>
    </motion.div>
  );
}
