import { useState } from 'react';
import {
  Crown,
  Star,
  TrendingUp,
  Check,
  Info,
  Award,
  Zap,
  Gift,
} from 'lucide-react';
import { memberLevels, members } from '@/data/mockData';
import { cn } from '@/lib/utils';

const levelGradients = [
  'from-amber-600 to-amber-800',
  'from-gray-400 to-gray-600',
  'from-yellow-400 to-yellow-600',
  'from-slate-300 to-slate-500',
  'from-cyan-300 to-cyan-500',
];

const levelGlows = [
  'shadow-amber-500/30',
  'shadow-gray-500/30',
  'shadow-yellow-500/30',
  'shadow-slate-400/30',
  'shadow-cyan-400/30',
];

const levelTextColors = [
  'text-amber-500',
  'text-gray-400',
  'text-yellow-400',
  'text-slate-300',
  'text-cyan-300',
];

export default function MemberLevels() {
  const [selectedLevel, setSelectedLevel] = useState(3);

  const currentMember = members[0];
  const currentLevel = currentMember.level;
  const currentLevelInfo = memberLevels.find((l) => l.level === currentLevel);
  const nextLevelInfo = memberLevels.find((l) => l.level === currentLevel + 1);

  const progress = nextLevelInfo
    ? ((currentMember.points - currentLevelInfo!.minPoints) / (nextLevelInfo.minPoints - currentLevelInfo!.minPoints)) * 100
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">段位等级</h1>
          <p className="text-dark-400 mt-1">查看会员等级权益与升级规则</p>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-r from-cyber-900/50 via-dark-800/50 to-neon-purple/10 border border-cyber-700/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cyber-500/10 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-neon-purple/10 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-dark-400 text-sm mb-1">我的当前等级</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentLevelInfo?.icon}</span>
                <div>
                  <h2 className={cn('text-2xl font-bold font-orbitron', levelTextColors[currentLevel - 1])}>
                    {currentLevelInfo?.name}
                  </h2>
                  <p className="text-dark-400 text-sm">享受 {Math.round((1 - (currentLevelInfo?.discount || 1)) * 100)}% 专属折扣</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-dark-400 text-sm mb-1">当前积分</p>
              <p className="text-3xl font-bold text-neon-orange font-orbitron">
                {currentMember.points.toLocaleString()}
              </p>
            </div>
          </div>

          {nextLevelInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">距离下一等级</span>
                <span className="text-white">
                  {nextLevelInfo.minPoints - currentMember.points} 积分
                </span>
              </div>
              <div className="h-3 bg-dark-700/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000 bg-gradient-to-r',
                    levelGradients[currentLevel]
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-dark-500">
                <span>{currentLevelInfo?.minPoints} 分</span>
                <span>{nextLevelInfo.minPoints} 分</span>
              </div>
            </div>
          )}

          {!nextLevelInfo && (
            <div className="flex items-center gap-2 text-neon-green">
              <Award className="w-5 h-5" />
              <span>恭喜！您已达到最高等级</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {memberLevels.map((level, index) => (
          <div
            key={level.level}
            onClick={() => setSelectedLevel(level.level)}
            className={cn(
              'relative p-5 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden',
              selectedLevel === level.level
                ? cn('bg-dark-800/80 border-cyber-500/50 scale-105', levelGlows[index])
                : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
            )}
          >
            <div className={cn(
              'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
              levelGradients[index]
            )}></div>

            <div className="text-center">
              <div className="text-4xl mb-2">{level.icon}</div>
              <h3 className={cn('font-bold font-orbitron', levelTextColors[index])}>
                {level.name}
              </h3>
              <p className="text-xs text-dark-500 mt-1">
                {level.minPoints.toLocaleString()} 积分起
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-dark-700">
              <div className="flex items-center justify-center gap-1">
                <span className="text-dark-400 text-sm">折扣</span>
                <span className={cn('text-lg font-bold font-orbitron', levelTextColors[index])}>
                  {Math.round(level.discount * 10)}折
                </span>
              </div>
            </div>

            {level.level === currentLevel && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 text-xs bg-neon-green/20 text-neon-green rounded-full">
                  当前
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-2 mb-5">
            <Gift className="w-5 h-5 text-cyber-400" />
            <h3 className="text-lg font-semibold text-white">等级权益</h3>
          </div>

          <div className="space-y-3">
            {memberLevels.find((l) => l.level === selectedLevel)?.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 transition-colors"
              >
                <div className={cn(
                  'p-1.5 rounded-lg',
                  selectedLevel >= 1 && 'bg-neon-green/20'
                )}>
                  <Check className={cn(
                    'w-4 h-4',
                    'text-neon-green'
                  )} />
                </div>
                <span className="text-dark-200 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-2 mb-5">
            <Info className="w-5 h-5 text-cyber-400" />
            <h3 className="text-lg font-semibold text-white">升级规则</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-dark-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-neon-orange" />
                <span className="text-white font-medium">消费获取积分</span>
              </div>
              <p className="text-sm text-dark-400">
                每消费 1 元可获得 1 积分，积分自动累计到会员账户
              </p>
            </div>

            <div className="p-4 rounded-lg bg-dark-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-neon-purple" />
                <span className="text-white font-medium">签到奖励</span>
              </div>
              <p className="text-sm text-dark-400">
                每日签到可获得 10 积分，连续签到 7 天额外奖励 50 积分
              </p>
            </div>

            <div className="p-4 rounded-lg bg-dark-700/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <span className="text-white font-medium">活动加成</span>
              </div>
              <p className="text-sm text-dark-400">
                特殊活动期间消费可获得双倍或三倍积分奖励
              </p>
            </div>

            <div className="p-4 rounded-lg bg-dark-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-white font-medium">保级规则</span>
              </div>
              <p className="text-sm text-dark-400">
                每年 1 月 1 日进行等级评估，未达到保级积分将下降一级
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
