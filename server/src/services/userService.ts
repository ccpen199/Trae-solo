import { getDB } from '../models/database';
import { generateToken } from '../utils/jwt';
import { generateDeviceFingerprint, generateDeviceId } from '../utils/device';
import { config } from '../config';
import { addCoins } from './coinService';

export function loginOrRegister(params: {
  openid?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  deviceId?: string;
  deviceInfo?: any;
  ip?: string;
  inviterId?: number;
}) {
  const db = getDB();
  let user: any;

  if (params.openid) {
    user = db.prepare('SELECT * FROM users WHERE openid = ?').get(params.openid);
  }

  if (!user && params.phone) {
    user = db.prepare('SELECT * FROM users WHERE phone = ?').get(params.phone);
  }

  if (!user && params.deviceId) {
    user = db.prepare('SELECT * FROM users WHERE device_id = ?').get(params.deviceId);
  }

  const deviceFingerprint = generateDeviceFingerprint({
    ...params.deviceInfo,
    ip: params.ip,
  });

  if (!user) {
    const deviceId = params.deviceId || generateDeviceId();
    const stmt = db.prepare(`
      INSERT INTO users (openid, nickname, avatar, phone, device_id, device_fingerprint, ip, inviter_id, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(
      params.openid || null,
      params.nickname || '游客用户',
      params.avatar || '',
      params.phone || null,
      deviceId,
      deviceFingerprint,
      params.ip || null,
      params.inviterId || null,
    );

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    if (params.inviterId) {
      handleInviteReward(params.inviterId, (user as any).id);
    }

    checkDeviceMultiAccount(deviceFingerprint, (user as any).id);
  } else {
    db.prepare(`
      UPDATE users SET last_login_at = datetime('now'), device_fingerprint = ?, ip = ?
      WHERE id = ?
    `).run(deviceFingerprint, params.ip || null, (user as any).id);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get((user as any).id);
  }

  const token = generateToken({ userId: (user as any).id });

  return { user, token };
}

function handleInviteReward(inviterId: number, inviteeId: number) {
  const db = getDB();

  const inviter = db.prepare('SELECT * FROM users WHERE id = ?').get(inviterId);
  if (!inviter) return;

  const existing = db.prepare('SELECT * FROM invitations WHERE invitee_id = ?').get(inviteeId);
  if (existing) return;

  db.prepare(`
    INSERT INTO invitations (inviter_id, invitee_id, level, reward_coins)
    VALUES (?, ?, 1, ?)
  `).run(inviterId, inviteeId, config.rewards.inviteRewardCoins);

  addCoins(inviterId, config.rewards.inviteRewardCoins, 'invite', inviteeId, '邀请好友奖励');

  const grandInviter = db.prepare(`
    SELECT inviter_id FROM invitations WHERE invitee_id = ? AND level = 1
  `).get(inviterId) as any;

  if (grandInviter?.inviter_id) {
    const level2Reward = Math.floor(config.rewards.inviteRewardCoins * config.commission.levels[1]);
    db.prepare(`
      INSERT INTO invitations (inviter_id, invitee_id, level, reward_coins)
      VALUES (?, ?, 2, ?)
    `).run(grandInviter.inviter_id, inviteeId, level2Reward);
    addCoins(grandInviter.inviter_id, level2Reward, 'invite_level2', inviteeId, '二级邀请奖励');

    const greatGrandInviter = db.prepare(`
      SELECT inviter_id FROM invitations WHERE invitee_id = ? AND level = 1
    `).get(grandInviter.inviter_id) as any;

    if (greatGrandInviter?.inviter_id) {
      const level3Reward = Math.floor(config.rewards.inviteRewardCoins * config.commission.levels[2]);
      db.prepare(`
        INSERT INTO invitations (inviter_id, invitee_id, level, reward_coins)
        VALUES (?, ?, 3, ?)
      `).run(greatGrandInviter.inviter_id, inviteeId, level3Reward);
      addCoins(greatGrandInviter.inviter_id, level3Reward, 'invite_level3', inviteeId, '三级邀请奖励');
    }
  }
}

function checkDeviceMultiAccount(fingerprint: string, currentUserId: number) {
  const db = getDB();
  const accounts = db.prepare(`
    SELECT id FROM users WHERE device_fingerprint = ? AND id != ?
  `).all(fingerprint, currentUserId);

  if (accounts.length >= 3) {
    db.prepare(`
      INSERT INTO risk_events (user_id, event_type, risk_level, details)
      VALUES (?, 'multi_account', 'high', ?)
    `).run(currentUserId, `同一设备注册${accounts.length + 1}个账号`);

    db.prepare('UPDATE users SET risk_score = risk_score + 30, is_cheater = 1 WHERE id = ?')
      .run(currentUserId);
  }
}

export function getUserProfile(userId: number) {
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return user;
}

export function updateUserProfile(userId: number, data: any) {
  const db = getDB();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  values.push(userId);
  db.prepare(`UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

export function getInviteStats(userId: number) {
  const db = getDB();
  const stats: any = {};

  for (let level = 1; level <= 3; level++) {
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM invitations WHERE inviter_id = ? AND level = ?
    `).get(userId, level) as any;
    stats[`level${level}Count`] = count.count;
  }

  const totalReward = db.prepare(`
    SELECT COALESCE(SUM(reward_coins), 0) as total FROM invitations WHERE inviter_id = ?
  `).get(userId) as any;
  stats.totalRewardCoins = totalReward.total;

  return stats;
}
