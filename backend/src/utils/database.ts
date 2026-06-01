import crypto from 'crypto';

interface User {
  id: string;
  phone: string;
  nickname?: string;
  invite_code?: string;
  invited_by?: string;
  real_name?: string;
  id_card?: string;
  force: number;
  black_diamond: number;
  blockchain_address?: string;
  private_key?: string;
  last_checkin_date?: string;
  last_diamond_claim_date?: string;
  created_at: string;
}

interface ForceTask {
  id: string;
  user_id: string;
  task_type: string;
  task_name: string;
  force_value: number;
  completed_at: string;
}

interface DiamondRecord {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  created_at: string;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  tx_type: string;
  amount: number;
  from_address?: string;
  to_address?: string;
  tx_hash?: string;
  status: string;
  created_at: string;
}

interface DataPassport {
  id: string;
  user_id: string;
  category: string;
  data_points: number;
  value_score: number;
  last_updated: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
  created_at: string;
}

interface Activity {
  id: string;
  title: string;
  description?: string;
  banner?: string;
  start_date?: string;
  end_date?: string;
  status: string;
}

const users: Map<string, User> = new Map();
const phoneIndex: Map<string, string> = new Map();
const inviteCodeIndex: Map<string, string> = new Map();
const addressIndex: Map<string, string> = new Map();

const forceTasks: ForceTask[] = [];
const diamondRecords: DiamondRecord[] = [];
const walletTransactions: WalletTransaction[] = [];
const dataPassports: Map<string, DataPassport[]> = new Map();

const announcements: Announcement[] = [
  { id: '1', title: '欢迎来到星球', content: '网易星球是基于区块链的价值共享平台，您的数据您做主！', priority: 1, created_at: new Date().toISOString() },
  { id: '2', title: '黑钻领取规则', content: '黑钻每24小时可领取一次，48小时不领取将停止生长。请及时领取！', priority: 2, created_at: new Date().toISOString() }
];

const activities: Activity[] = [
  { id: '1', title: '新人注册送好礼', description: '完成注册即可获得100原力和1黑钻', status: 'active' },
  { id: '2', title: '邀请好友双倍奖励', description: '邀请好友注册，双方各得200原力', status: 'active' }
];

const generateId = () => crypto.randomUUID();

const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const generateBlockchainAddress = () => '0x' + crypto.randomBytes(20).toString('hex');

const generatePrivateKey = () => crypto.randomBytes(32).toString('hex');

export const runQuery = (sql: string, params: any[] = []): any => {
  return { changes: 1, lastInsertRowid: 1 };
};

export const getQuery = (sql: string, params: any[] = []): any => {
  if (sql.includes('SELECT * FROM users WHERE phone')) {
    const userId = phoneIndex.get(params[0]);
    return userId ? users.get(userId) : undefined;
  }
  if (sql.includes('SELECT * FROM users WHERE id')) {
    return users.get(params[0]);
  }
  if (sql.includes('SELECT * FROM users WHERE invite_code')) {
    const userId = inviteCodeIndex.get(params[0]);
    return userId ? users.get(userId) : undefined;
  }
  if (sql.includes('SELECT * FROM users WHERE blockchain_address')) {
    const userId = addressIndex.get(params[0]);
    return userId ? users.get(userId) : undefined;
  }
  return null;
};

export const allQuery = (sql: string, params: any[] = []): any[] => {
  if (sql.includes('SELECT * FROM announcements')) {
    return [...announcements].sort((a, b) => b.priority - a.priority);
  }
  if (sql.includes('SELECT * FROM activities')) {
    return activities.filter(a => a.status === 'active');
  }
  if (sql.includes('SELECT * FROM force_tasks WHERE user_id')) {
    return forceTasks.filter(t => t.user_id === params[0]).sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
  }
  if (sql.includes('SELECT * FROM diamond_records WHERE user_id')) {
    return diamondRecords.filter(r => r.user_id === params[0]).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  if (sql.includes('SELECT * FROM wallet_transactions WHERE user_id')) {
    return walletTransactions.filter(t => t.user_id === params[0]).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  if (sql.includes('SELECT * FROM data_passport WHERE user_id')) {
    return dataPassports.get(params[0]) || [];
  }
  return [];
};

export const createUser = (data: {
  phone: string;
  nickname: string;
  inviteCode?: string;
  realName?: string;
  idCard?: string;
}): User => {
  const id = generateId();
  const inviteCode = generateInviteCode();
  const blockchainAddress = generateBlockchainAddress();
  const privateKey = generatePrivateKey();

  let invitedBy: string | undefined;
  let initialForce = 100;
  let initialDiamond = 1.0;

  if (data.inviteCode) {
    const inviterId = inviteCodeIndex.get(data.inviteCode);
    if (inviterId) {
      const inviter = users.get(inviterId);
      if (inviter) {
        invitedBy = data.inviteCode;
        initialForce += 200;
        inviter.force += 200;
      }
    }
  }

  const user: User = {
    id,
    phone: data.phone,
    nickname: data.nickname,
    invite_code: inviteCode,
    invited_by: invitedBy,
    real_name: data.realName,
    id_card: data.idCard,
    force: initialForce,
    black_diamond: initialDiamond,
    blockchain_address: blockchainAddress,
    private_key: privateKey,
    created_at: new Date().toISOString()
  };

  users.set(id, user);
  phoneIndex.set(data.phone, id);
  inviteCodeIndex.set(inviteCode, id);
  addressIndex.set(blockchainAddress, id);

  const categories = ['电商', '游戏', '娱乐', '金融', '健康'];
  const passports: DataPassport[] = categories.map(cat => ({
    id: generateId(),
    user_id: id,
    category: cat,
    data_points: 0,
    value_score: 0,
    last_updated: new Date().toISOString()
  }));
  dataPassports.set(id, passports);

  diamondRecords.push({
    id: generateId(),
    user_id: id,
    amount: initialDiamond,
    source: '新人注册奖励',
    created_at: new Date().toISOString()
  });

  return user;
};

export const addForce = (userId: string, value: number, taskType: string, taskName: string) => {
  const user = users.get(userId);
  if (user) {
    user.force += value;
    forceTasks.push({
      id: generateId(),
      user_id: userId,
      task_type: taskType,
      task_name: taskName,
      force_value: value,
      completed_at: new Date().toISOString()
    });
  }
};

export const updateCheckinDate = (userId: string, date: string) => {
  const user = users.get(userId);
  if (user) {
    user.last_checkin_date = date;
  }
};

export const claimDiamond = (userId: string, amount: number): number => {
  const user = users.get(userId);
  if (user) {
    user.black_diamond += amount;
    user.last_diamond_claim_date = new Date().toISOString();
    diamondRecords.push({
      id: generateId(),
      user_id: userId,
      amount,
      source: '每日黑钻领取',
      created_at: new Date().toISOString()
    });
    return user.black_diamond;
  }
  return 0;
};

export const transferDiamond = (fromId: string, toAddress: string, amount: number) => {
  const fromUser = users.get(fromId);
  const toId = addressIndex.get(toAddress);
  const toUser = toId ? users.get(toId) : undefined;

  if (!fromUser || fromUser.black_diamond < amount || !toUser) {
    return null;
  }

  fromUser.black_diamond -= amount;
  toUser.black_diamond += amount;

  const txHash = '0x' + generateId().replace(/-/g, '');

  walletTransactions.push({
    id: generateId(),
    user_id: fromId,
    tx_type: 'transfer',
    amount: -amount,
    from_address: fromUser.blockchain_address,
    to_address: toAddress,
    tx_hash: txHash,
    status: 'completed',
    created_at: new Date().toISOString()
  });

  walletTransactions.push({
    id: generateId(),
    user_id: toId!,
    tx_type: 'transfer',
    amount,
    from_address: fromUser.blockchain_address,
    to_address: toAddress,
    tx_hash: txHash,
    status: 'completed',
    created_at: new Date().toISOString()
  });

  return txHash;
};

export const updatePassport = (userId: string, category: string, dataPoints: number, valueScore: number) => {
  const passports = dataPassports.get(userId);
  if (passports) {
    const p = passports.find(p => p.category === category);
    if (p) {
      p.data_points += dataPoints;
      p.value_score += valueScore;
      p.last_updated = new Date().toISOString();
    }
  }
};

export const initDatabase = () => {
  console.log('In-memory database initialized');
};

export default {
  users,
  announcements,
  activities,
  forceTasks,
  diamondRecords,
  walletTransactions
};
