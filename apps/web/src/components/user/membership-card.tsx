import { cn } from '@/lib/utils';
import { MembershipLevel } from '@pet/shared/enums';
import { MEMBERSHIP_BENEFITS } from '@pet/shared/constants';

interface MembershipCardProps {
  level: MembershipLevel;
  growthPoints: number;
  expireAt?: Date;
  nickname: string;
}

const levelConfig: Record<MembershipLevel, {
  label: string;
  gradient: string;
  icon: string;
}> = {
  [MembershipLevel.NORMAL]: {
    label: '普通会员',
    gradient: 'from-gray-400 to-gray-500',
    icon: '👤',
  },
  [MembershipLevel.BRONZE]: {
    label: '青铜会员',
    gradient: 'from-amber-600 to-amber-700',
    icon: '🥉',
  },
  [MembershipLevel.SILVER]: {
    label: '白银会员',
    gradient: 'from-gray-300 to-gray-400',
    icon: '🥈',
  },
  [MembershipLevel.GOLD]: {
    label: '黄金会员',
    gradient: 'from-yellow-500 to-amber-500',
    icon: '🥇',
  },
  [MembershipLevel.PLATINUM]: {
    label: '铂金会员',
    gradient: 'from-slate-400 to-zinc-500',
    icon: '💎',
  },
  [MembershipLevel.DIAMOND]: {
    label: '钻石会员',
    gradient: 'from-violet-500 to-purple-600',
    icon: '👑',
  },
};

export function MembershipCard({ level, growthPoints, expireAt, nickname }: MembershipCardProps) {
  const config = levelConfig[level];
  const benefits = MEMBERSHIP_BENEFITS[level];
  const progressPercent = Math.min(
    ((growthPoints - benefits.minGrowthPoints) /
      (benefits.maxGrowthPoints - benefits.minGrowthPoints)) * 100,
    100
  );

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl p-5 text-white',
      `bg-gradient-to-br ${config.gradient}`
    )}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <p className="text-sm opacity-80">{config.label}</p>
              <p className="font-semibold">{nickname}</p>
            </div>
          </div>
          {expireAt && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {new Date(expireAt).toLocaleDateString()}到期
            </span>
          )}
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>成长值 {growthPoints}</span>
            <span>{benefits.maxGrowthPoints === Infinity ? 'MAX' : benefits.maxGrowthPoints}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs">
          <span className="rounded-full bg-white/20 px-2 py-0.5">
            {(benefits.discountRate * 10).toFixed(1)}折优惠
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5">
            {benefits.pointMultiplier}x积分
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5">
            满{benefits.freeShippingThreshold}包邮
          </span>
        </div>
      </div>
    </div>
  );
}
