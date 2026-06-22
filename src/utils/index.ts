import type { GameInfo, TierRank } from '@/types';
import { GAMES, PREMIUM_HOURS, RARE_HEROES, getGame } from '@/data/games';

export function calcTierGap(fromTier: TierRank, toTier: TierRank, gameCode = 'LOL'): number {
  const game = getGame(gameCode);
  const fromIdx = game.tierOrder[fromTier];
  const toIdx = game.tierOrder[toTier];
  return Math.max(0, toIdx - fromIdx);
}

export interface PricingResult {
  basePrice: number;
  tierGap: number;
  tierMultiplier: number;
  rareHeroCoefficient: number;
  timeCoefficient: number;
  surgeCoefficient: number;
  finalPrice: number;
  depositAmount: number;
  breakdown: { label: string; value: number; note?: string }[];
}

export function calculatePricing(
  gameCode: string,
  fromTier: TierRank,
  toTier: TierRank,
  options: {
    heroPool?: string[];
    premiumHours?: string[];
    winRateGuarantee?: number;
  } = {}
): PricingResult {
  const game = getGame(gameCode);
  const fromIdx = game.tierOrder[fromTier];
  const toIdx = game.tierOrder[toTier];
  const tierGap = Math.max(0, toIdx - fromIdx);

  let basePrice = 0;
  for (let i = fromIdx; i < toIdx; i++) {
    const tier = game.tiers[i + 1];
    basePrice += game.tierBasePrice[tier] || 0;
  }

  const tierMultiplier = tierGap >= 5 ? 1.15 : tierGap >= 3 ? 1.08 : 1.0;

  let rareHeroCoefficient = 1;
  if (options.heroPool?.length) {
    const rareMatches = options.heroPool.filter(h => RARE_HEROES.find(r => r.name === h));
    rareHeroCoefficient = rareMatches.reduce((acc, h) => {
      const match = RARE_HEROES.find(r => r.name === h);
      return acc * (match?.coefficient || 1);
    }, 1);
  }

  let timeCoefficient = 1;
  if (options.premiumHours?.length) {
    timeCoefficient = options.premiumHours.reduce((acc, key) => {
      const match = PREMIUM_HOURS.find(p => p.key === key);
      return Math.max(acc, match?.coefficient || 1);
    }, 1);
  }

  const winRateBonus = options.winRateGuarantee && options.winRateGuarantee > 70
    ? 1 + (options.winRateGuarantee - 70) * 0.015
    : 1;

  const surgeCoefficient = +(tierMultiplier * rareHeroCoefficient * timeCoefficient * winRateBonus).toFixed(2);
  const finalPrice = Math.round(basePrice * surgeCoefficient);
  const depositAmount = +(finalPrice * 0.3).toFixed(1);

  const breakdown: PricingResult['breakdown'] = [
    { label: '基础价格', value: basePrice, note: `${game.tierLabels[fromTier]} → ${game.tierLabels[toTier]} 共 ${tierGap} 个段位` },
    { label: '段位跨度加成', value: +((basePrice * tierMultiplier) - basePrice).toFixed(2), note: `系数 ×${tierMultiplier.toFixed(2)}` },
  ];
  if (rareHeroCoefficient > 1) {
    breakdown.push({ label: '稀缺英雄加成', value: +(basePrice * (rareHeroCoefficient - 1)).toFixed(2), note: `系数 ×${rareHeroCoefficient.toFixed(2)}` });
  }
  if (timeCoefficient > 1) {
    breakdown.push({ label: '时段溢价', value: +(basePrice * (timeCoefficient - 1)).toFixed(2), note: `系数 ×${timeCoefficient.toFixed(2)}` });
  }
  if (winRateBonus > 1) {
    breakdown.push({ label: '高胜率保障', value: +(basePrice * (winRateBonus - 1)).toFixed(2), note: `系数 ×${winRateBonus.toFixed(2)}` });
  }
  breakdown.push({ label: '定金（30%）', value: depositAmount, note: '平台担保托管' });

  return {
    basePrice,
    tierGap,
    tierMultiplier,
    rareHeroCoefficient,
    timeCoefficient,
    surgeCoefficient,
    finalPrice,
    depositAmount,
    breakdown,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function shortenHash(hash: string, start = 8, end = 6): string {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} 天前`;
  return d.toLocaleDateString('zh-CN');
}

export function getCertLabel(level: string): string {
  return { None: '未认证', Silver: '白银认证', Gold: '黄金认证', Diamond: '钻石认证' }[level] || level;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Pending: '待匹配', Matched: '已接单', InProgress: '履约中',
    Checking: '验收中', Completed: '已完成', Disputed: '争议处理中',
    Refunded: '已退款', Cancelled: '已取消',
  };
  return map[status] || status;
}

export function getStatusClass(status: string): string {
  if (['Completed'].includes(status)) return 'status-success';
  if (['InProgress', 'Matched', 'Checking'].includes(status)) return 'status-progress';
  if (['Pending'].includes(status)) return 'status-pending';
  if (['Disputed', 'Refunded', 'Cancelled'].includes(status)) return 'status-dispute';
  return 'badge-base bg-night-600';
}

export function deviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 200;
  canvas.height = 50;
  if (ctx) {
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 10, 30);
  }
  const str = `${navigator.userAgent}|${screen.width}x${screen.height}|${navigator.language}|${canvas.toDataURL()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export const GAMES_EXPORT = GAMES;
export type _GameInfo = GameInfo;
