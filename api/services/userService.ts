import { db } from '../db/index.ts';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../../shared/types.ts';

export function findUserByUsername(username: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  return row ? mapUser(row) : null;
}

export function findUserById(id: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  return row ? mapUser(row) : null;
}

export function createUser(username: string, password: string, role = 'user'): User {
  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  
  db.prepare(`
    INSERT INTO users (id, username, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run(id, username, passwordHash, role);

  db.prepare(`
    INSERT INTO wallets (id, user_id, balance)
    VALUES (?, ?, ?)
  `).run(uuidv4(), id, 0);

  return findUserById(id)!;
}

export function verifyPassword(username: string, password: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!row) return null;
  
  const valid = bcrypt.compareSync(password, row.password_hash);
  return valid ? mapUser(row) : null;
}

export function updateUserProfile(userId: string, data: Partial<User>): User | null {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.bio !== undefined) { fields.push('bio = ?'); values.push(data.bio); }
  if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
  if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
  
  if (fields.length === 0) return findUserById(userId);
  
  values.push(userId);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return findUserById(userId);
}

export function followUser(followerId: string, followingId: string): boolean {
  try {
    db.prepare(`
      INSERT INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `).run(followerId, followingId);
    
    db.prepare('UPDATE users SET follower_count = follower_count + 1 WHERE id = ?').run(followingId);
    db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(followerId);
    
    return true;
  } catch (e) {
    return false;
  }
}

export function unfollowUser(followerId: string, followingId: string): boolean {
  const result = db.prepare(`
    DELETE FROM follows WHERE follower_id = ? AND following_id = ?
  `).run(followerId, followingId);
  
  if (result.changes > 0) {
    db.prepare('UPDATE users SET follower_count = follower_count - 1 WHERE id = ?').run(followingId);
    db.prepare('UPDATE users SET following_count = following_count - 1 WHERE id = ?').run(followerId);
    return true;
  }
  return false;
}

export function isFollowing(followerId: string, followingId: string): boolean {
  const row = db.prepare(`
    SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?
  `).get(followerId, followingId);
  return !!row;
}

export function getCreators(page: number, pageSize: number, category?: string): { items: User[]; total: number } {
  let whereClause = "WHERE role = 'creator'";
  const params: any[] = [];
  
  if (category) {
    whereClause += ' AND category LIKE ?';
    params.push(`%${category}%`);
  }
  
  const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params) as any).count;
  
  const rows = db.prepare(`
    SELECT * FROM users ${whereClause}
    ORDER BY rating DESC, follower_count DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, (page - 1) * pageSize) as any[];
  
  return { items: rows.map(mapUser), total };
}

export function searchUsers(keyword: string, page: number, pageSize: number): { items: User[]; total: number } {
  const whereClause = 'WHERE username LIKE ? OR bio LIKE ?';
  const searchTerm = `%${keyword}%`;
  
  const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(searchTerm, searchTerm) as any).count;
  
  const rows = db.prepare(`
    SELECT * FROM users ${whereClause}
    ORDER BY follower_count DESC
    LIMIT ? OFFSET ?
  `).all(searchTerm, searchTerm, pageSize, (page - 1) * pageSize) as any[];
  
  return { items: rows.map(mapUser), total };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar || undefined,
    role: row.role as 'user' | 'creator' | 'admin' | 'requester',
    bio: row.bio || undefined,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    rating: row.rating,
    verified: !!row.verified,
    location: row.location || undefined,
    createdAt: row.created_at,
  };
}
