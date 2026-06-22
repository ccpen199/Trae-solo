import type { GameInfo, TierRank } from '@/types';

export const TIER_RANKS: TierRank[] = [
  'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald',
  'Diamond', 'Master', 'Grandmaster', 'Challenger',
];

export const TIER_LABEL_MAP: Record<TierRank, string> = {
  Iron: '黑铁',
  Bronze: '青铜',
  Silver: '白银',
  Gold: '黄金',
  Platinum: '铂金',
  Emerald: '翡翠',
  Diamond: '钻石',
  Master: '大师',
  Grandmaster: '宗师',
  Challenger: '王者',
};

export const TIER_ORDER_MAP: Record<TierRank, number> = {
  Iron: 0, Bronze: 1, Silver: 2, Gold: 3, Platinum: 4,
  Emerald: 5, Diamond: 6, Master: 7, Grandmaster: 8, Challenger: 9,
};

export const TIER_COLORS: Record<TierRank, string> = {
  Iron: '#6B7280',
  Bronze: '#B87333',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#00B5E0',
  Emerald: '#10B981',
  Diamond: '#B9F2FF',
  Master: '#A855F7',
  Grandmaster: '#EF4444',
  Challenger: '#FF6B35',
};

export const GAMES: GameInfo[] = [
  {
    code: 'LOL',
    name: '英雄联盟',
    icon: '🎮',
    tiers: TIER_RANKS,
    tierLabels: TIER_LABEL_MAP,
    tierOrder: TIER_ORDER_MAP,
    tierBasePrice: {
      Iron: 0, Bronze: 10, Silver: 18, Gold: 32, Platinum: 55,
      Emerald: 88, Diamond: 150, Master: 280, Grandmaster: 500, Challenger: 900,
    },
  },
  {
    code: 'VALORANT',
    name: '无畏契约',
    icon: '🎯',
    tiers: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    tierLabels: { ...TIER_LABEL_MAP, Emerald: '翡翠' },
    tierOrder: { ...TIER_ORDER_MAP, Emerald: 5 },
    tierBasePrice: {
      Iron: 0, Bronze: 12, Silver: 22, Gold: 38, Platinum: 65,
      Emerald: 98, Diamond: 168, Master: 310, Grandmaster: 550, Challenger: 980,
    },
  },
  {
    code: 'CSGO',
    name: 'CS2',
    icon: '🔫',
    tiers: ['Iron', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    tierLabels: {
      Iron: '白银', Bronze: '青铜', Silver: '黄金', Gold: 'AK',
      Platinum: '双AK', Emerald: 'LE', Diamond: 'LEM',
      Master: 'Supreme', Grandmaster: 'Global', Challenger: '大地球',
    },
    tierOrder: TIER_ORDER_MAP,
    tierBasePrice: {
      Iron: 0, Bronze: 15, Silver: 28, Gold: 48, Platinum: 85,
      Emerald: 130, Diamond: 210, Master: 380, Grandmaster: 680, Challenger: 1200,
    },
  },
  {
    code: 'DOTA2',
    name: 'DOTA2',
    icon: '⚔️',
    tiers: TIER_RANKS,
    tierLabels: TIER_LABEL_MAP,
    tierOrder: TIER_ORDER_MAP,
    tierBasePrice: {
      Iron: 0, Bronze: 18, Silver: 32, Gold: 56, Platinum: 95,
      Emerald: 150, Diamond: 260, Master: 460, Grandmaster: 820, Challenger: 1500,
    },
  },
  {
    code: 'OW',
    name: '守望先锋',
    icon: '🛡️',
    tiers: TIER_RANKS,
    tierLabels: TIER_LABEL_MAP,
    tierOrder: TIER_ORDER_MAP,
    tierBasePrice: {
      Iron: 0, Bronze: 8, Silver: 15, Gold: 28, Platinum: 48,
      Emerald: 78, Diamond: 128, Master: 240, Grandmaster: 450, Challenger: 800,
    },
  },
  {
    code: 'Apex',
    name: 'Apex英雄',
    icon: '🦅',
    tiers: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    tierLabels: {
      Iron: '青铜', Bronze: '青铜', Silver: '白银', Gold: '黄金',
      Platinum: '铂金', Emerald: '钻石', Diamond: '钻石',
      Master: '大师', Grandmaster: '猎杀', Challenger: '猎杀者',
    },
    tierOrder: TIER_ORDER_MAP,
    tierBasePrice: {
      Iron: 0, Bronze: 12, Silver: 22, Gold: 40, Platinum: 72,
      Emerald: 118, Diamond: 200, Master: 380, Grandmaster: 720, Challenger: 1300,
    },
  },
];

export const getGame = (code: string) => GAMES.find(g => g.code === code) || GAMES[0];

export const getTierColor = (tier: TierRank) => TIER_COLORS[tier] || '#94A3B8';

export const calcTierGap = (from: TierRank, to: TierRank) => TIER_ORDER_MAP[to] - TIER_ORDER_MAP[from];

export const SERVICE_TYPES = [
  { key: 'Ranked' as const, label: '排位代练', icon: '🏆', desc: '指定段位晋级保障' },
  { key: 'Placement' as const, label: '定级赛', icon: '🎖️', desc: '新赛季10场定级保障' },
  { key: 'Coaching' as const, label: '大神陪练', icon: '🎓', desc: '语音+操作+意识指导' },
  { key: 'WinBoost' as const, label: '净胜局', icon: '✅', desc: '指定数量胜场保障' },
  { key: 'HeroMastery' as const, label: '英雄熟练度', icon: '🎯', desc: '英雄成就点/七级成就' },
];

export const REVIEW_TAGS = [
  '效率极高', '操作大神', '沟通顺畅', '服务周到', '连胜上分',
  '专业代练', '态度友好', '准时交付', '全程录屏', '安全可靠',
];

export const DISPUTE_CATEGORIES = [
  { key: 'account_safety', label: '账号安全问题' },
  { key: 'delivery_delay', label: '交付超时' },
  { key: 'quality_issue', label: '质量未达标' },
  { key: 'behavior_issue', label: '服务态度' },
  { key: 'fraud_suspicion', label: '欺诈嫌疑' },
  { key: 'other', label: '其他争议' },
];

export const PREMIUM_HOURS = [
  { key: 'late_night', label: '深夜时段 (23:00-06:00)', coefficient: 1.25, icon: '🌙' },
  { key: 'weekend', label: '周末高峰 (周六日)', coefficient: 1.20, icon: '📅' },
  { key: 'holiday', label: '节假日时段', coefficient: 1.35, icon: '🎊' },
];

export const RARE_HEROES = [
  { name: '亚索', coefficient: 1.15 },
  { name: '德莱文', coefficient: 1.12 },
  { name: '劫', coefficient: 1.10 },
  { name: '瑞文', coefficient: 1.10 },
  { name: '李青', coefficient: 1.08 },
  { name: '卡莉斯塔', coefficient: 1.18 },
];
