import { db } from '../db/index.js';
import { generateId, generateInviteCode } from '../utils/index.js';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  level: number;
  exp: number;
  coins: number;
  inviteCode: string;
  inviterId: string | null;
  isVerified: boolean;
  realName?: string;
  idCard?: string;
  alipayAccount?: string;
  wechatAccount?: string;
  bankName?: string;
  bankCard?: string;
  createdAt: string;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar || '',
    level: row.level,
    exp: row.exp,
    coins: parseFloat(row.coins),
    inviteCode: row.invite_code,
    inviterId: row.inviter_id,
    isVerified: !!row.is_verified,
    realName: row.real_name || undefined,
    idCard: row.id_card || undefined,
    alipayAccount: row.alipay_account || undefined,
    wechatAccount: row.wechat_account || undefined,
    bankName: row.bank_name || undefined,
    bankCard: row.bank_card || undefined,
    createdAt: row.created_at,
  };
}

export function login(phone: string, password: string): { success: boolean; user?: User; message?: string } {
  const row = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;

  if (!row) {
    return { success: false, message: '用户不存在' };
  }

  return { success: true, user: rowToUser(row) };
}

export function register(phone: string, nickname: string, inviteCode?: string): { success: boolean; user?: User; message?: string } {
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone) as any;
  if (existing) {
    return { success: false, message: '手机号已注册' };
  }

  const userId = generateId('user-');
  const code = generateInviteCode();

  let inviterId: string | null = null;
  let inviterLevel = 0;

  if (inviteCode) {
    const inviter = db.prepare('SELECT id, inviter_id FROM users WHERE invite_code = ?').get(inviteCode) as any;
    if (inviter) {
      inviterId = inviter.id;
      inviterLevel = 1;

      if (inviter.inviter_id) {
        const insertRelation2 = db.prepare(`
          INSERT INTO invite_relations (id, user_id, inviter_id, level, total_reward)
          VALUES (?, ?, ?, ?, ?)
        `);
        insertRelation2.run(generateId('ir-'), userId, inviter.inviter_id, 2, 0);
      }
    }
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, nickname, avatar, level, exp, coins, invite_code, inviter_id, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(userId, phone, nickname, '', 1, 0, 100, code, inviterId, 0);

  if (inviterId && inviterLevel > 0) {
    const insertRelation = db.prepare(`
      INSERT INTO invite_relations (id, user_id, inviter_id, level, total_reward)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertRelation.run(generateId('ir-'), userId, inviterId, 1, 0);

    const inviteReward = 50;
    addCoins(inviterId, inviteReward, 'invite', `邀请好友注册奖励 - ${nickname}`);

    const updateInviterReward = db.prepare(`
      UPDATE invite_relations 
      SET total_reward = total_reward + ? 
      WHERE user_id = ? AND inviter_id = ?
    `);
    updateInviterReward.run(inviteReward, userId, inviterId);
  }

  addCoins(userId, 100, 'register', '新用户注册奖励');

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  return { success: true, user: rowToUser(userRow) };
}

export function getUserById(userId: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  return row ? rowToUser(row) : null;
}

export function updateProfile(userId: string, data: { nickname?: string; avatar?: string }): User | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.nickname !== undefined) {
    fields.push('nickname = ?');
    values.push(data.nickname);
  }
  if (data.avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(data.avatar);
  }

  if (fields.length === 0) return getUserById(userId);

  values.push(userId);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);

  return getUserById(userId);
}

export function verifyIdentity(userId: string, realName: string, idCard: string): { success: boolean; user?: User; message?: string } {
  const user = getUserById(userId);
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  if (user.isVerified) {
    return { success: false, message: '已实名认证' };
  }

  db.prepare(`
    UPDATE users 
    SET is_verified = 1, real_name = ?, id_card = ?
    WHERE id = ?
  `).run(realName, idCard, userId);

  const updatedUser = getUserById(userId);
  return { success: true, user: updatedUser! };
}

export function updateWithdrawAccount(
  userId: string,
  method: 'alipay' | 'wechat' | 'bank',
  account: string,
  bankName?: string
): { success: boolean; user?: User; message?: string } {
  const user = getUserById(userId);
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  if (method === 'alipay') {
    db.prepare('UPDATE users SET alipay_account = ? WHERE id = ?').run(account, userId);
  } else if (method === 'wechat') {
    db.prepare('UPDATE users SET wechat_account = ? WHERE id = ?').run(account, userId);
  } else if (method === 'bank') {
    db.prepare('UPDATE users SET bank_name = ?, bank_card = ? WHERE id = ?').run(bankName || '', account, userId);
  }

  const updatedUser = getUserById(userId);
  return { success: true, user: updatedUser! };
}

export function addCoins(userId: string, amount: number, source: string, description: string): void {
  const trx = db.transaction(() => {
    db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(amount, amount, userId);

    const recordId = generateId('cr-');
    db.prepare(`
      INSERT INTO coin_records (id, user_id, amount, type, source, description)
      VALUES (?, ?, ?, 'income', ?, ?)
    `).run(recordId, userId, amount, source, description);
  });

  trx();
}

export function deductCoins(userId: string, amount: number, source: string, description: string): boolean {
  const user = getUserById(userId);
  if (!user || user.coins < amount) {
    return false;
  }

  const trx = db.transaction(() => {
    db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(amount, userId);

    const recordId = generateId('cr-');
    db.prepare(`
      INSERT INTO coin_records (id, user_id, amount, type, source, description)
      VALUES (?, ?, ?, 'expense', ?, ?)
    `).run(recordId, userId, amount, source, description);
  });

  trx();
  return true;
}

export function adminLogin(username: string, password: string): { success: boolean; admin?: any; message?: string } {
  const row = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;

  if (!row) {
    return { success: false, message: '管理员不存在' };
  }

  if (row.password !== password) {
    return { success: false, message: '密码错误' };
  }

  return {
    success: true,
    admin: {
      id: row.id,
      username: row.username,
      role: row.role,
    },
  };
}
