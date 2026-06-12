import { motion } from 'framer-motion';
import { Card } from '@/components/common/Card';
import { Badge, Tag } from '@/components/common/BadgeTagAvatar';
import { Progress } from '@/components/common/UIComponents';
import { Crown, Gift, Zap, Percent, Sparkles, Heart, ChevronRight } from 'lucide-react';
import type { MemberProfile, MemberBenefit } from '@/types/member';
import { cn } from '@/utils/common';
import { formatCurrency } from '@/utils/common';

const benefitIcons: Record<string, React.ElementType> = {
  Percent,
  Sparkles,
  Zap,
  Heart,
  Gift,
};

interface MemberLevelCardProps {
  profile: MemberProfile;
  className?: string;
}

export function MemberLevelCard({ profile, className }: MemberLevelCardProps) {
  const levelColors = [
    { bg: 'from-neutral-300 to-neutral-400', text: 'text-neutral-700', ring: 'ring-neutral-300' },
    { bg: 'from-amber-300 to-amber-500', text: 'text-amber-700', ring: 'ring-amber-300' },
    { bg: 'from-gray-300 to-gray-500', text: 'text-gray-700', ring: 'ring-gray-400' },
    { bg: 'from-yellow-300 to-yellow-500', text: 'text-yellow-700', ring: 'ring-yellow-400' },
    { bg: 'from-primary-400 to-primary-600', text: 'text-primary-700', ring: 'ring-primary-400' },
  ];

  const color = levelColors[profile.level - 1];
  const progress = (profile.growthValue / profile.nextLevelGrowth) * 100;

  return (
    <Card className={cn('bg-gradient-to-br overflow-hidden', color.bg, className)}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-6 h-6 text-white" />
              <span className="text-white/80 text-sm">当前等级</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{profile.levelName}</h3>
          </div>
          <Badge className="bg-white/20 text-white border-0" size="lg">
            Lv.{profile.level}
          </Badge>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-white/70 text-sm">成长值</p>
              <p className="text-white font-display text-xl font-bold">
                {profile.growthValue} <span className="text-white/60 text-sm font-normal">/ {profile.nextLevelGrowth}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">可用积分</p>
              <p className="text-white font-display text-xl font-bold">{profile.points}</p>
            </div>
          </div>
          <Progress value={progress} color="accent" size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs mb-1">累计消费</p>
            <p className="text-white font-bold">{formatCurrency(profile.totalSpent)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs mb-1">会员时长</p>
            <p className="text-white font-bold">2年5个月</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface BenefitCardProps {
  benefit: MemberBenefit;
  unlocked: boolean;
  className?: string;
}

export function BenefitCard({ benefit, unlocked, className }: BenefitCardProps) {
  const Icon = benefitIcons[benefit.type] || Gift;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'rounded-xl p-4 transition-all duration-300',
        unlocked
          ? 'bg-white shadow-soft border border-neutral-100'
          : 'bg-neutral-50 border border-neutral-200 opacity-60',
        className
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
          unlocked ? 'bg-primary-100 text-primary-600' : 'bg-neutral-200 text-neutral-400'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h4 className={cn('font-semibold mb-1', unlocked ? 'text-neutral-900' : 'text-neutral-500')}>
        {benefit.name}
      </h4>
      <p className="text-sm text-neutral-500">{benefit.description}</p>
      {!unlocked && (
        <Tag variant="neutral" className="mt-2">
          Lv.{benefit.minLevel}解锁
        </Tag>
      )}
    </motion.div>
  );
}

interface LevelComparisonProps {
  currentLevel: number;
  className?: string;
}

export function LevelComparison({ currentLevel, className }: LevelComparisonProps) {
  const levels = [
    { level: 1, name: '普通会员', requirement: 0, benefits: ['全场9折'] },
    { level: 2, name: '白银会员', requirement: 1000, benefits: ['积分1.2倍', '生日礼包'] },
    { level: 3, name: '黄金会员', requirement: 3000, benefits: ['专属问诊通道', '每年免费体检1次'] },
    { level: 4, name: '铂金会员', requirement: 5000, benefits: ['积分1.5倍', '每月免费洗护1次'] },
    { level: 5, name: '钻石会员', requirement: 10000, benefits: ['一对一管家服务', '全年免费体检'] },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {levels.map((level, index) => {
        const isCurrent = level.level === currentLevel;
        const isUnlocked = level.level <= currentLevel;

        return (
          <motion.div
            key={level.level}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl transition-all',
              isCurrent
                ? 'bg-primary-50 border-2 border-primary-300'
                : isUnlocked
                ? 'bg-white border border-neutral-200'
                : 'bg-neutral-50 border border-neutral-100 opacity-60'
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center font-bold',
                isUnlocked ? 'bg-primary-100 text-primary-700' : 'bg-neutral-200 text-neutral-400'
              )}
            >
              Lv.{level.level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn('font-semibold', isUnlocked ? 'text-neutral-900' : 'text-neutral-500')}>
                  {level.name}
                </h4>
                {isCurrent && (
                  <Badge variant="primary" size="sm">
                    当前
                  </Badge>
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">
                成长值 {level.requirement}+
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {level.benefits.map((b, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex items-center text-xs px-2 py-0.5 rounded-full',
                      isUnlocked
                        ? 'bg-mint-100 text-mint-700'
                        : 'bg-neutral-200 text-neutral-500'
                    )}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight className={cn('w-5 h-5', isUnlocked ? 'text-primary-400' : 'text-neutral-300')} />
          </motion.div>
        );
      })}
    </div>
  );
}
