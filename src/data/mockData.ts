import type { Account, RentalOrder, TradeOrder, RecycleBid, InsuranceClaim, RiskAlert, TransactionRecord } from "@/types"

const accountArt = (accent: string, glow: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#08111f"/>
          <stop offset="0.55" stop-color="#111827"/>
          <stop offset="1" stop-color="${glow}"/>
        </linearGradient>
        <radialGradient id="pulse" cx="68%" cy="38%" r="50%">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.75"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bg)"/>
      <rect width="640" height="360" fill="url(#pulse)"/>
      <path d="M40 270 C130 190 180 205 255 125 S430 35 590 85" fill="none" stroke="${accent}" stroke-width="6" stroke-opacity="0.7"/>
      <path d="M80 310 L178 188 L258 245 L376 98 L560 284" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.28"/>
      <circle cx="178" cy="188" r="16" fill="${accent}" fill-opacity="0.9"/>
      <circle cx="376" cy="98" r="22" fill="#ffffff" fill-opacity="0.2" stroke="${accent}" stroke-width="4"/>
      <text x="42" y="78" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="44" font-weight="700">${label}</text>
      <text x="44" y="118" fill="${accent}" font-family="Arial, sans-serif" font-size="18" letter-spacing="4">CHAIN VERIFIED</text>
      <rect x="42" y="292" width="168" height="28" rx="14" fill="#020617" fill-opacity="0.7" stroke="${accent}" stroke-opacity="0.55"/>
      <text x="62" y="312" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="15">GameVault Asset</text>
    </svg>
  `)}`

export const mockAccounts: Account[] = [
  {
    id: "acc-001",
    gameUid: "UID-829301",
    gameName: "原神",
    server: "天空岛",
    region: "国服",
    level: 58,
    equipmentSnapshot: [
      { id: "eq-1", name: "天空之翼", rarity: "legendary", type: "弓", level: 90, stats: { atk: 674, critRate: 22 }, imageUrl: "" },
      { id: "eq-2", name: "护摩之杖", rarity: "legendary", type: "长柄", level: 90, stats: { atk: 608, hp: 66 }, imageUrl: "" },
      { id: "eq-3", name: "磐岩结绿", rarity: "legendary", type: "单手剑", level: 90, stats: { atk: 542, critRate: 44 }, imageUrl: "" },
      { id: "eq-4", name: "狼的末路", rarity: "legendary", type: "双手剑", level: 80, stats: { atk: 608, atkPercent: 49 }, imageUrl: "" },
      { id: "eq-5", name: "四风原典", rarity: "legendary", type: "法器", level: 90, stats: { atk: 608, critRate: 33 }, imageUrl: "" },
    ],
    snapshotHash: "0x7a3f...e8b2",
    chainTxHash: "0xabc123...def456",
    owner: "玩家A",
    status: "available",
    price: 2580,
    rentPriceHourly: 8,
    rentPriceDaily: 68,
    valuation: 2350,
    riskScore: 12,
    insuranceActive: true,
    createdAt: "2025-05-20T10:30:00Z",
    imageUrl: accountArt("#00f0ff", "#172554", "GENSHIN"),
  },
  {
    id: "acc-002",
    gameUid: "UID-445672",
    gameName: "王者荣耀",
    server: "微信区",
    region: "国服",
    level: 30,
    equipmentSnapshot: [
      { id: "eq-6", name: "典藏皮肤：天鹅之梦", rarity: "legendary", type: "皮肤", level: 1, stats: {}, imageUrl: "" },
      { id: "eq-7", name: "典藏皮肤：全息碎影", rarity: "legendary", type: "皮肤", level: 1, stats: {}, imageUrl: "" },
      { id: "eq-8", name: "传说皮肤：无限飓风号", rarity: "epic", type: "皮肤", level: 1, stats: {}, imageUrl: "" },
    ],
    snapshotHash: "0x9c2d...f1a4",
    chainTxHash: "0x789abc...012def",
    owner: "玩家B",
    status: "selling",
    price: 1680,
    rentPriceHourly: 5,
    rentPriceDaily: 45,
    valuation: 1520,
    riskScore: 8,
    insuranceActive: true,
    createdAt: "2025-06-01T14:20:00Z",
    imageUrl: accountArt("#00ff88", "#14532d", "MOBA"),
  },
  {
    id: "acc-003",
    gameUid: "UID-119883",
    gameName: "英雄联盟",
    server: "艾欧尼亚",
    region: "国服",
    level: 45,
    equipmentSnapshot: [
      { id: "eq-9", name: "至臻皮肤：K/DA阿卡丽", rarity: "legendary", type: "皮肤", level: 1, stats: {}, imageUrl: "" },
      { id: "eq-10", name: "传说皮肤：源计划：风", rarity: "epic", type: "皮肤", level: 1, stats: {}, imageUrl: "" },
      { id: "eq-11", name: "海克斯科技：炼金男爵", rarity: "rare", type: "皮肤", level: 1, stats: {}, imageUrl: "" },
    ],
    snapshotHash: "0x5e8b...c3d7",
    chainTxHash: "0x345def...678abc",
    owner: "玩家C",
    status: "available",
    price: 3200,
    rentPriceHourly: 10,
    rentPriceDaily: 88,
    valuation: 2950,
    riskScore: 5,
    insuranceActive: false,
    createdAt: "2025-04-15T09:00:00Z",
    imageUrl: accountArt("#a855f7", "#3b0764", "LEAGUE"),
  },
  {
    id: "acc-004",
    gameUid: "UID-556677",
    gameName: "DNF手游",
    server: "跨一区",
    region: "国服",
    level: 60,
    equipmentSnapshot: [
      { id: "eq-12", name: "荒古遗尘光剑", rarity: "legendary", type: "武器", level: 60, stats: { atk: 1280, critRate: 35 }, imageUrl: "" },
      { id: "eq-13", name: "幽魂魅影套", rarity: "legendary", type: "防具", level: 60, stats: { def: 890, darkDmg: 45 }, imageUrl: "" },
      { id: "eq-14", name: "冰雪公主的霜语", rarity: "epic", type: "首饰", level: 55, stats: { int: 280, iceDmg: 30 }, imageUrl: "" },
    ],
    snapshotHash: "0x2f4a...b9e1",
    chainTxHash: "0xcde789...012345",
    owner: "玩家D",
    status: "rented",
    price: 4200,
    rentPriceHourly: 15,
    rentPriceDaily: 128,
    valuation: 3900,
    riskScore: 22,
    insuranceActive: true,
    createdAt: "2025-03-28T16:45:00Z",
    imageUrl: accountArt("#ffd700", "#713f12", "DUNGEON"),
  },
  {
    id: "acc-005",
    gameUid: "UID-889900",
    gameName: "永劫无间",
    server: "亚洲服",
    region: "国际服",
    level: 50,
    equipmentSnapshot: [
      { id: "eq-15", name: "神识·天照", rarity: "legendary", type: "武器", level: 50, stats: { atk: 850, critRate: 28 }, imageUrl: "" },
      { id: "eq-16", name: "极光套装", rarity: "epic", type: "外观", level: 1, stats: {}, imageUrl: "" },
    ],
    snapshotHash: "0x1d6c...a4f8",
    chainTxHash: "0xfed321...cba098",
    owner: "玩家E",
    status: "available",
    price: 1850,
    rentPriceHourly: 6,
    rentPriceDaily: 55,
    valuation: 1700,
    riskScore: 10,
    insuranceActive: true,
    createdAt: "2025-05-10T11:15:00Z",
    imageUrl: accountArt("#ff3366", "#7f1d1d", "BLADE"),
  },
  {
    id: "acc-006",
    gameUid: "UID-223344",
    gameName: "崩坏：星穹铁道",
    server: "仙舟罗浮",
    region: "国服",
    level: 65,
    equipmentSnapshot: [
      { id: "eq-17", name: "于夜色中", rarity: "legendary", type: "光锥", level: 80, stats: { atk: 582, critDmg: 48 }, imageUrl: "" },
      { id: "eq-18", name: "拂晓之前", rarity: "legendary", type: "光锥", level: 80, stats: { atk: 582, critRate: 32 }, imageUrl: "" },
      { id: "eq-19", name: "但战斗还未结束", rarity: "legendary", type: "光锥", level: 80, stats: { atk: 529, sp: 1 }, imageUrl: "" },
    ],
    snapshotHash: "0x8b2e...d5c9",
    chainTxHash: "0x456789...abc123",
    owner: "玩家F",
    status: "selling",
    price: 3680,
    rentPriceHourly: 12,
    rentPriceDaily: 98,
    valuation: 3400,
    riskScore: 7,
    insuranceActive: true,
    createdAt: "2025-06-05T08:30:00Z",
    imageUrl: accountArt("#38bdf8", "#0f172a", "STAR RAIL"),
  },
]

export const mockRentalOrders: RentalOrder[] = [
  {
    id: "rent-001",
    accountId: "acc-004",
    renterId: "user-101",
    startTime: "2025-06-07T10:00:00Z",
    endTime: "2025-06-07T22:00:00Z",
    deposit: 500,
    rentFee: 120,
    deviceFingerprint: "FP-A3B7C9D2",
    riskStatus: "warning",
    behaviorScore: 72,
    locationAlerts: [
      { id: "loc-1", location: "上海市", timestamp: "2025-06-07T10:00:00Z", ip: "114.88.xxx.xxx" },
      { id: "loc-2", location: "北京市", timestamp: "2025-06-07T14:30:00Z", ip: "61.149.xxx.xxx" },
    ],
  },
  {
    id: "rent-002",
    accountId: "acc-001",
    renterId: "user-102",
    startTime: "2025-06-08T08:00:00Z",
    endTime: "2025-06-09T08:00:00Z",
    deposit: 300,
    rentFee: 68,
    deviceFingerprint: "FP-E5F1G8H3",
    riskStatus: "normal",
    behaviorScore: 95,
    locationAlerts: [],
  },
]

export const mockTradeOrders: TradeOrder[] = [
  {
    id: "trade-001",
    accountId: "acc-002",
    buyerId: "user-201",
    sellerId: "user-101",
    amount: 1680,
    contractStatus: "escrow_frozen",
    escrowStatus: "frozen",
    contractHash: "0xcontract001...abc",
  },
  {
    id: "trade-002",
    accountId: "acc-006",
    buyerId: "user-203",
    sellerId: "user-106",
    amount: 3680,
    contractStatus: "signed",
    escrowStatus: "frozen",
    contractHash: "0xcontract002...def",
    disputeStatus: "pending",
  },
]

export const mockRecycleBids: RecycleBid[] = [
  { id: "bid-001", recyclerId: "rec-01", recyclerName: "极速回收", accountId: "acc-001", bidAmount: 2100, weightScore: 92, heatScore: 88, valuationScore: 85, timelinessScore: 95, estimatedTime: "1小时", createdAt: "2025-06-08T10:00:00Z" },
  { id: "bid-002", recyclerId: "rec-02", recyclerName: "游戏宝回收", accountId: "acc-001", bidAmount: 2050, weightScore: 88, heatScore: 82, valuationScore: 90, timelinessScore: 85, estimatedTime: "2小时", createdAt: "2025-06-08T10:05:00Z" },
  { id: "bid-003", recyclerId: "rec-03", recyclerName: "号多多回收", accountId: "acc-001", bidAmount: 1980, weightScore: 85, heatScore: 90, valuationScore: 80, timelinessScore: 90, estimatedTime: "30分钟", createdAt: "2025-06-08T10:02:00Z" },
  { id: "bid-004", recyclerId: "rec-04", recyclerName: "闪电回收王", accountId: "acc-001", bidAmount: 2150, weightScore: 90, heatScore: 78, valuationScore: 88, timelinessScore: 82, estimatedTime: "3小时", createdAt: "2025-06-08T10:08:00Z" },
  { id: "bid-005", recyclerId: "rec-05", recyclerName: "金牌回收站", accountId: "acc-001", bidAmount: 2020, weightScore: 82, heatScore: 85, valuationScore: 82, timelinessScore: 88, estimatedTime: "1.5小时", createdAt: "2025-06-08T10:12:00Z" },
]

export const mockInsuranceClaims: InsuranceClaim[] = [
  { id: "ins-001", accountId: "acc-001", policyId: "pol-001", contractId: "trade-001", contractStatus: "active", claimStatus: "pending", claimAmount: 2580, autoTriggered: false },
  { id: "ins-002", accountId: "acc-004", policyId: "pol-002", contractId: "rent-001", contractStatus: "breached", claimStatus: "approved", claimAmount: 500, autoTriggered: true, triggeredAt: "2025-06-07T15:00:00Z" },
  { id: "ins-003", accountId: "acc-002", policyId: "pol-003", contractId: "trade-001", contractStatus: "active", claimStatus: "paid", claimAmount: 1680, autoTriggered: true, triggeredAt: "2025-06-06T20:00:00Z" },
]

export const mockRiskAlerts: RiskAlert[] = [
  { id: "risk-001", type: "remote_login", severity: "high", accountId: "acc-004", description: "异地登录检测：上海→北京，IP变更异常", timestamp: "2025-06-07T14:30:00Z" },
  { id: "risk-002", type: "behavior_anomaly", severity: "medium", accountId: "acc-004", description: "行为异常：连续3小时无操作后突然高频操作", timestamp: "2025-06-07T16:00:00Z" },
  { id: "risk-003", type: "device_change", severity: "critical", accountId: "acc-002", description: "设备指纹变更：原设备FP-A3B7→新设备FP-X9Y8", timestamp: "2025-06-06T22:15:00Z" },
  { id: "risk-004", type: "cluster_anomaly", severity: "high", accountId: "acc-003", description: "异常账号聚集：5个关联账号在30分钟内同一IP登录", timestamp: "2025-06-05T08:45:00Z" },
  { id: "risk-005", type: "brush_order", severity: "critical", accountId: "acc-005", description: "刷单行为识别：同一卖家3天内与7个买家完成交易", timestamp: "2025-06-04T12:00:00Z" },
  { id: "risk-006", type: "remote_login", severity: "low", accountId: "acc-001", description: "异地登录提醒：广州→深圳（同省），风险较低", timestamp: "2025-06-08T09:00:00Z" },
]

export const mockTransactions: TransactionRecord[] = [
  { id: "tx-001", type: "buy", gameName: "原神", amount: 2580, timestamp: "2025-06-08T14:23:00Z", status: "completed" },
  { id: "tx-002", type: "rent", gameName: "DNF手游", amount: 120, timestamp: "2025-06-08T14:20:00Z", status: "processing" },
  { id: "tx-003", type: "sell", gameName: "王者荣耀", amount: 1680, timestamp: "2025-06-08T14:15:00Z", status: "completed" },
  { id: "tx-004", type: "recycle", gameName: "永劫无间", amount: 1700, timestamp: "2025-06-08T14:10:00Z", status: "pending" },
  { id: "tx-005", type: "buy", gameName: "崩铁", amount: 3680, timestamp: "2025-06-08T14:05:00Z", status: "completed" },
  { id: "tx-006", type: "rent", gameName: "英雄联盟", amount: 88, timestamp: "2025-06-08T14:00:00Z", status: "completed" },
  { id: "tx-007", type: "sell", gameName: "原神", amount: 3200, timestamp: "2025-06-08T13:55:00Z", status: "completed" },
  { id: "tx-008", type: "buy", gameName: "DNF手游", amount: 4200, timestamp: "2025-06-08T13:50:00Z", status: "processing" },
]

export const gameList = ["原神", "王者荣耀", "英雄联盟", "DNF手游", "永劫无间", "崩坏：星穹铁道"]
export const serverList: Record<string, string[]> = {
  "原神": ["天空岛", "世界树", "亚服", "美服"],
  "王者荣耀": ["微信区", "QQ区"],
  "英雄联盟": ["艾欧尼亚", "祖安", "诺克萨斯", "班德尔城"],
  "DNF手游": ["跨一区", "跨二区", "跨三区"],
  "永劫无间": ["亚洲服", "欧美服"],
  "崩坏：星穹铁道": ["仙舟罗浮", "空间站", "亚服"],
}
