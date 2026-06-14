import type {
  BannerItem,
  DashboardMetrics,
  InviteRelation,
  RiskAlert,
  Task,
  Transaction,
  User,
  VideoItem,
  WithdrawalRule,
} from "./types";

export const banners: BannerItem[] = [
  { id: "b1", title: "仲夏狂欢节", subtitle: "限时双倍金币 · 活动倒计时 48h", gradient: "from-gold-400 via-gold-500 to-coral", tag: "HOT" },
  { id: "b2", title: "新人 7 日任务", subtitle: "连续完成必得 10,000 金币", gradient: "from-emerald via-teal-500 to-gold-400", tag: "NEW" },
  { id: "b3", title: "定向投放 · 广东专区", subtitle: "每日额外 3 个专属任务", gradient: "from-indigo-500 via-purple-500 to-gold-400", tag: "REGION" },
];

export const defaultUser: User = {
  id: "u-0001", nickname: "金币探险家",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoldExplorer&backgroundColor=1A1A2E",
  coinBalance: 28650, totalEarned: 128400, totalWithdrawn: 96.3,
  checkinDays: 12, inviteCode: "GOLD88", level: 3,
  riskLabel: "normal", ltvScore: 268.8, deviceFingerprint: "fp-a8f3e1b7",
  createdAt: "2026-05-01T10:12:00.000Z", lastCheckin: "2026-06-09T02:00:00.000Z",
};

export const tasks: Task[] = [
  { id: "t-step", type: "steps", title: "今日走满 6000 步", description: "同步健康数据，步数自动兑换金币", coinReward: 300, progress: 4280, target: 6000, status: "in_progress" },
  { id: "t-v1", type: "video", title: "观看精彩短视频", description: "完整播放 3 条短视频即得金币", coinReward: 200, progress: 1, target: 3, status: "in_progress", tag: "轻松赚" },
  { id: "t-checkin", type: "checkin", title: "每日签到", description: "连续签到奖励翻倍", coinReward: 80, progress: 0, target: 1, status: "available" },
  { id: "t-invite", type: "invite", title: "邀请好友加入", description: "每邀请 1 位好友最高得 5000 金币", coinReward: 5000, progress: 2, target: 3, status: "in_progress", tag: "高收益" },
  { id: "t-limited-1", type: "limited", title: "午夜专属任务", description: "20:00-22:00 限时开启，双倍奖励", coinReward: 600, progress: 0, target: 1, status: "available", startTime: "2026-06-10T20:00:00", endTime: "2026-06-10T22:00:00", tag: "LIMITED" },
  { id: "t-holiday", type: "holiday", title: "端午集香包", description: "集齐 5 个香包兑换节日大礼", coinReward: 2888, progress: 3, target: 5, status: "in_progress", tag: "节日" },
  { id: "t-v2", type: "video", title: "浏览信息流广告", description: "每条 15 秒，累计 5 条", coinReward: 150, progress: 5, target: 5, status: "completed" },
  { id: "t-step-2", type: "steps", title: "挑战 10000 步", description: "超越自我，额外奖励", coinReward: 800, progress: 4280, target: 10000, status: "in_progress", tag: "挑战" },
];

export const transactions: Transaction[] = [
  { id: "tx-1", type: "earn", amount: 200, description: "观看短视频奖励", createdAt: "2026-06-10T09:14:00", status: "success" },
  { id: "tx-2", type: "commission", amount: 1200, description: "邀请好友「小鹿」一级返佣", createdAt: "2026-06-10T07:40:00", status: "success" },
  { id: "tx-3", type: "withdraw", amount: 5000, description: "提现至微信零钱", createdAt: "2026-06-09T22:03:00", status: "success" },
  { id: "tx-4", type: "earn", amount: 80, description: "每日签到奖励", createdAt: "2026-06-09T08:12:00", status: "success" },
  { id: "tx-5", type: "commission", amount: 400, description: "二级返佣：小鹿邀请好友", createdAt: "2026-06-08T20:11:00", status: "success" },
  { id: "tx-6", type: "earn", amount: 300, description: "步数任务 · 6000 步达成", createdAt: "2026-06-08T19:52:00", status: "success" },
  { id: "tx-7", type: "withdraw", amount: 30000, description: "大额提现审核中", createdAt: "2026-06-08T14:05:00", status: "intercepted" },
];

export const inviteRelations: InviteRelation[] = [
  { userId: "u-0100", nickname: "小鹿同学", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Deer&backgroundColor=1A1A2E", level: 1, commission: 1200, completedTasks: 18, createdAt: "2026-06-08T12:20:00" },
  { userId: "u-0101", nickname: "阿Ken", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ken&backgroundColor=1A1A2E", level: 1, commission: 800, completedTasks: 7, createdAt: "2026-06-05T18:02:00" },
  { userId: "u-0102", nickname: "豆豆爸", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bean&backgroundColor=1A1A2E", level: 2, commission: 400, completedTasks: 5, createdAt: "2026-06-09T09:33:00" },
  { userId: "u-0103", nickname: "晴天", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sunny&backgroundColor=1A1A2E", level: 2, commission: 220, completedTasks: 3, createdAt: "2026-06-09T14:50:00" },
  { userId: "u-0104", nickname: "柠檬不萌", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lemon&backgroundColor=1A1A2E", level: 1, commission: 500, completedTasks: 11, createdAt: "2026-06-01T10:08:00" },
];

export const riskAlerts: RiskAlert[] = [
  { id: "r1", userId: "u-2341", nickname: "月光宝盒", type: "withdrawal_anomaly", severity: "high", description: "单日提现 5 次，累计 ¥380，触发大额拦截", timestamp: "2026-06-10T09:42:00", resolved: false },
  { id: "r2", userId: "u-1098", nickname: "疾风步", type: "device_fingerprint", severity: "high", description: "同一设备指纹切换账号 23 个", timestamp: "2026-06-10T09:11:00", resolved: false },
  { id: "r3", userId: "u-0877", nickname: "小糖人", type: "behavior_sequence", severity: "medium", description: "视频任务平均停留 1.2 秒，疑似机器播放", timestamp: "2026-06-10T08:50:00", resolved: false },
  { id: "r4", userId: "u-0541", nickname: "夜色温柔", type: "ip_frequency", severity: "medium", description: "同一 IP 注册账号 47 个，疑似农场", timestamp: "2026-06-10T07:03:00", resolved: true },
  { id: "r5", userId: "u-3011", nickname: "星河", type: "withdrawal_anomaly", severity: "low", description: "新用户首次提现金额偏高，需人工复核", timestamp: "2026-06-09T22:31:00", resolved: true },
];

export const withdrawalRules: WithdrawalRule[] = [
  { id: "wr-1", name: "大额提现拦截", condition: "单笔提现 > ¥200", action: "block", enabled: true, hitCount: 182 },
  { id: "wr-2", name: "单日提现次数限制", condition: "单日提现次数 > 3", action: "limit", enabled: true, hitCount: 471 },
  { id: "wr-3", name: "新用户风控", condition: "注册 < 48h 且提现 > ¥50", action: "review", enabled: true, hitCount: 209 },
  { id: "wr-4", name: "异常设备限制", condition: "设备指纹关联账号数 > 5", action: "block", enabled: true, hitCount: 88 },
  { id: "wr-5", name: "任务行为异常", condition: "视频完播率 < 30%", action: "review", enabled: false, hitCount: 0 },
];

export const dashboardMetrics: DashboardMetrics = {
  dau: 48213, newUsers: 3820, coinIssued: 12890000, withdrawalAmount: 42836.8,
  dauTrend: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(2026, 5, 28 - (13 - i));
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, value: 32000 + Math.round(Math.random() * 22000) + i * 900 };
  }),
  taskROI: [
    { taskId: "roi-1", taskName: "步数任务", costPerUser: 0.38, retention7d: 0.42, conversionRate: 0.18 },
    { taskId: "roi-2", taskName: "视频任务", costPerUser: 0.12, retention7d: 0.36, conversionRate: 0.26 },
    { taskId: "roi-3", taskName: "签到任务", costPerUser: 0.04, retention7d: 0.55, conversionRate: 0.33 },
    { taskId: "roi-4", taskName: "邀请裂变", costPerUser: 1.2, retention7d: 0.48, conversionRate: 0.22 },
    { taskId: "roi-5", taskName: "限时活动", costPerUser: 0.9, retention7d: 0.39, conversionRate: 0.41 },
  ],
  ltvDistribution: [
    { segment: "新手用户(0-7天)", avgLtv: 12.4, userCount: 18200 },
    { segment: "活跃用户(8-30天)", avgLtv: 86.3, userCount: 32500 },
    { segment: "核心用户(30-90天)", avgLtv: 312.8, userCount: 15400 },
    { segment: "高价值用户(>90天)", avgLtv: 1280.5, userCount: 4800 },
  ],
  adRevenue: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(2026, 5, 28 - (13 - i));
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, revenue: 3200 + i * 260 + Math.round(Math.random() * 900), ecpm: 22 + Math.random() * 18 };
  }),
};

export const mockUsersForAdmin = Array.from({ length: 24 }, (_, i) => {
  const names = ["月光宝盒", "疾风步", "小糖人", "夜色温柔", "星河", "柠檬不萌", "小鹿同学", "阿Ken", "豆豆爸", "晴天"];
  const risk: ("normal" | "suspected" | "blocked")[] = ["normal", "normal", "suspected", "normal", "blocked", "normal"];
  return {
    id: `u-${1000 + i}`, nickname: `${names[i % names.length]}${i >= 10 ? i : ""}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}&backgroundColor=1A1A2E`,
    coinBalance: 1200 + i * 680, totalEarned: 8000 + i * 3400, totalWithdrawn: 12 + i * 8.3,
    checkinDays: Math.max(1, 30 - i), inviteCode: `GC${1000 + i}`, level: 1 + (i % 6),
    riskLabel: risk[i % risk.length], ltvScore: Math.round((30 + i * 14 + Math.random() * 80) * 10) / 10,
    deviceFingerprint: `fp-${1000 + i}`, createdAt: `2026-05-${String(1 + (i % 28)).padStart(2, "0")}T10:00:00.000Z`,
  };
});

const localVideoCover = (label: string, from: string, to: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="450" rx="32" fill="url(#g)"/><circle cx="652" cy="94" r="78" fill="rgba(255,255,255,.16)"/><circle cx="118" cy="346" r="96" fill="rgba(255,255,255,.12)"/><path d="M360 174v102l92-51-92-51z" fill="rgba(255,255,255,.9)"/><text x="44" y="70" fill="white" font-family="Arial, sans-serif" font-size="34" font-weight="700">${label}</text><text x="44" y="408" fill="rgba(255,255,255,.78)" font-family="Arial, sans-serif" font-size="22">Coin Task Video</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const videos: VideoItem[] = [
  { id: "v1", title: "夏日防晒全攻略，这几招一定要学", cover: localVideoCover("夏日防晒", "#f59e0b", "#ef4444"), duration: 45, coinReward: 50, watched: false },
  { id: "v2", title: "在家也能做的宝藏美食合集", cover: localVideoCover("宝藏美食", "#10b981", "#f59e0b"), duration: 32, coinReward: 40, watched: true },
  { id: "v3", title: "十分钟瑜伽，释放一整天的疲劳", cover: localVideoCover("十分钟瑜伽", "#06b6d4", "#8b5cf6"), duration: 60, coinReward: 60, watched: false },
  { id: "v4", title: "通勤穿搭灵感 · 轻盈夏日", cover: localVideoCover("通勤穿搭", "#ec4899", "#6366f1"), duration: 28, coinReward: 35, watched: false },
  { id: "v5", title: "旅行 VLOG · 大理洱海骑行日记", cover: localVideoCover("旅行 VLOG", "#0ea5e9", "#22c55e"), duration: 90, coinReward: 120, watched: false },
  { id: "v6", title: "数码开箱：2026 年性价比之王", cover: localVideoCover("数码开箱", "#64748b", "#14b8a6"), duration: 55, coinReward: 60, watched: false },
];

export const checkinRewards = [
  { day: 1, coins: 50 }, { day: 2, coins: 60 }, { day: 3, coins: 80 },
  { day: 4, coins: 100 }, { day: 5, coins: 120 }, { day: 6, coins: 150 }, { day: 7, coins: 300 },
];
