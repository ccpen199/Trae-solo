import { db } from '../db/index.js';
import { getUserById } from './authService.js';

export interface InviteStats {
  totalInvites: number;
  level1Invites: number;
  level2Invites: number;
  totalReward: number;
  totalCommission: number;
}

export interface InvitedFriend {
  id: string;
  nickname: string;
  avatar: string;
  level: number;
  totalReward: number;
  joinedAt: string;
}

export interface CommissionRecord {
  id: string;
  amount: number;
  type: string;
  description: string;
  fromUser?: string;
  createdAt: string;
}

export function getInviteStats(userId: string): InviteStats {
  const relations = db.prepare(`
    SELECT * FROM invite_relations WHERE inviter_id = ?
  `).all(userId) as any[];

  const level1 = relations.filter(r => r.level === 1);
  const level2 = relations.filter(r => r.level === 2);

  const totalReward = relations.reduce((sum: number, r: any) => sum + parseFloat(r.total_reward), 0);

  const commissionRecords = db.prepare(`
    SELECT * FROM coin_records 
    WHERE user_id = ? AND source LIKE '%invite%'
  `).all(userId) as any[];

  const totalCommission = commissionRecords.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);

  return {
    totalInvites: relations.length,
    level1Invites: level1.length,
    level2Invites: level2.length,
    totalReward,
    totalCommission,
  };
}

export function getInvitedFriends(userId: string, level: number = 1): InvitedFriend[] {
  const relations = db.prepare(`
    SELECT ir.*, u.nickname, u.avatar, u.created_at as joined_at
    FROM invite_relations ir
    JOIN users u ON ir.user_id = u.id
    WHERE ir.inviter_id = ? AND ir.level = ?
    ORDER BY ir.created_at DESC
  `).all(userId, level) as any[];

  return relations.map((r: any) => ({
    id: r.user_id,
    nickname: r.nickname,
    avatar: r.avatar || '',
    level: r.level,
    totalReward: parseFloat(r.total_reward),
    joinedAt: r.joined_at,
  }));
}

export function getCommissionRecords(userId: string): CommissionRecord[] {
  const records = db.prepare(`
    SELECT * FROM coin_records 
    WHERE user_id = ? AND (source = 'invite' OR source = 'invite_commission')
    ORDER BY created_at DESC
    LIMIT 50
  `).all(userId) as any[];

  return records.map((r: any) => ({
    id: r.id,
    amount: parseFloat(r.amount),
    type: r.type,
    description: r.description,
    createdAt: r.created_at,
  }));
}

export function getInviterInfo(userId: string): { nickname: string; level: number } | null {
  const user = getUserById(userId);
  if (!user || !user.inviterId) return null;

  const inviter = getUserById(user.inviterId);
  if (!inviter) return null;

  return {
    nickname: inviter.nickname,
    level: inviter.level,
  };
}
