import { Database, Statement } from 'sql.js';
import { saveDatabase } from './init';
import {
  User,
  FamilyBinding,
  HealthContent,
  MedicationReminder,
  Alert,
  ContentReview,
  UsageRecord,
  Anniversary
} from '../../shared/types';

let db: Database | null = null;

export function setDatabase(database: Database): void {
  db = database;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function queryAll<T>(sql: string, params: any[], mapper: (row: any) => T): T[] {
  const database = getDatabase();
  const stmt: Statement = database.prepare(sql);
  const results: T[] = [];
  try {
    if (params.length > 0) {
      stmt.bind(params);
    }
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(mapper(row));
    }
  } finally {
    stmt.free();
  }
  return results;
}

function queryOne<T>(sql: string, params: any[], mapper: (row: any) => T): T | null {
  const database = getDatabase();
  const stmt: Statement = database.prepare(sql);
  try {
    if (params.length > 0) {
      stmt.bind(params);
    }
    if (stmt.step()) {
      const row = stmt.getAsObject();
      return mapper(row);
    }
    return null;
  } finally {
    stmt.free();
  }
}

function queryScalar<T>(sql: string, params: any[]): T | null {
  const database = getDatabase();
  const stmt: Statement = database.prepare(sql);
  try {
    if (params.length > 0) {
      stmt.bind(params);
    }
    if (stmt.step()) {
      const row = stmt.get();
      return row[0] as T;
    }
    return null;
  } finally {
    stmt.free();
  }
}

function execute(sql: string, params: any[]): number {
  const database = getDatabase();
  const stmt: Statement = database.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
  } finally {
    stmt.free();
  }
  return database.getRowsModified();
}

function executeAndSave(sql: string, params: any[]): number {
  const changes = execute(sql, params);
  saveDatabase();
  return changes;
}

function mapToUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    age: row.age,
    role: row.role,
    avatar: row.avatar,
    accessibilityConfig: parseJson(row.accessibility_config)!,
    chronicDiseases: parseJson(row.chronic_diseases)!,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at
  };
}

function mapToFamilyBinding(row: any): FamilyBinding {
  return {
    id: row.id,
    elderId: row.elder_id,
    familyId: row.family_id,
    elderName: row.elder_name,
    familyName: row.family_name,
    relation: row.relation,
    status: row.status,
    notificationEnabled: row.notification_enabled === 1,
    createdAt: row.created_at
  };
}

function mapToHealthContent(row: any): HealthContent {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    ageGroups: parseJson(row.age_groups)!,
    chronicDiseases: parseJson(row.chronic_diseases)!,
    content: parseJson(row.content)!,
    audioUrl: row.audio_url,
    status: row.status,
    accessibilityLevel: row.accessibility_level,
    createdAt: row.created_at
  };
}

function mapToMedicationReminder(row: any): MedicationReminder {
  return {
    id: row.id,
    userId: row.user_id,
    medicineName: row.medicine_name,
    dosage: row.dosage,
    times: parseJson(row.times)!,
    days: parseJson(row.days)!,
    enabled: row.enabled === 1,
    note: row.note
  };
}

function mapToAlert(row: any): Alert {
  return {
    id: row.id,
    type: row.type,
    elderId: row.elder_id,
    familyId: row.family_id,
    elderName: row.elder_name,
    message: row.message,
    level: row.level,
    read: row.read === 1,
    createdAt: row.created_at
  };
}

function mapToContentReview(row: any): ContentReview {
  return {
    id: row.id,
    contentId: row.content_id,
    reviewerId: row.reviewer_id,
    status: row.status,
    comment: row.comment,
    accessibilityLevel: row.accessibility_level,
    reviewedAt: row.reviewed_at
  };
}

function mapToUsageRecord(row: any): UsageRecord {
  return {
    id: row.id,
    userId: row.user_id,
    page: row.page,
    duration: row.duration,
    createdAt: row.created_at
  };
}

function mapToAnniversary(row: any): Anniversary {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    type: row.type,
    remindDays: row.remind_days
  };
}

export const userDB = {
  findAll(role?: User['role']): User[] {
    let sql = 'SELECT * FROM users';
    const params: any[] = [];
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    sql += ' ORDER BY created_at DESC';
    return queryAll(sql, params, mapToUser);
  },

  findById(id: string): User | null {
    return queryOne('SELECT * FROM users WHERE id = ?', [id], mapToUser);
  },

  findByPhone(phone: string): User | null {
    return queryOne('SELECT * FROM users WHERE phone = ?', [phone], mapToUser);
  },

  create(user: Omit<User, 'id' | 'createdAt' | 'lastActiveAt'> & { id?: string }): User {
    const id = user.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    executeAndSave(`
      INSERT INTO users (id, phone, name, age, role, avatar, accessibility_config, chronic_diseases, created_at, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      user.phone,
      user.name,
      user.age,
      user.role,
      user.avatar || null,
      JSON.stringify(user.accessibilityConfig),
      JSON.stringify(user.chronicDiseases),
      now,
      now
    ]);
    return this.findById(id)!;
  },

  update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.phone !== undefined) { fields.push('phone = ?'); params.push(updates.phone); }
    if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.age !== undefined) { fields.push('age = ?'); params.push(updates.age); }
    if (updates.role !== undefined) { fields.push('role = ?'); params.push(updates.role); }
    if (updates.avatar !== undefined) { fields.push('avatar = ?'); params.push(updates.avatar); }
    if (updates.accessibilityConfig !== undefined) {
      fields.push('accessibility_config = ?');
      params.push(JSON.stringify(updates.accessibilityConfig));
    }
    if (updates.chronicDiseases !== undefined) {
      fields.push('chronic_diseases = ?');
      params.push(JSON.stringify(updates.chronicDiseases));
    }
    if (updates.lastActiveAt !== undefined) {
      fields.push('last_active_at = ?');
      params.push(updates.lastActiveAt);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    executeAndSave(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  updateLastActive(id: string): void {
    executeAndSave('UPDATE users SET last_active_at = ? WHERE id = ?', [new Date().toISOString(), id]);
  },

  findInactiveUsers(days: number): User[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return queryAll(`
      SELECT * FROM users 
      WHERE role = 'elder' AND last_active_at < ?
    `, [cutoffDate], mapToUser);
  },

  delete(id: string): boolean {
    const changes = executeAndSave('DELETE FROM users WHERE id = ?', [id]);
    return changes > 0;
  }
};

export const familyBindingDB = {
  findAll(): FamilyBinding[] {
    return queryAll(`
      SELECT fb.*, ue.name as elder_name, uf.name as family_name
      FROM family_bindings fb
      LEFT JOIN users ue ON fb.elder_id = ue.id
      LEFT JOIN users uf ON fb.family_id = uf.id
      ORDER BY fb.created_at DESC
    `, [], mapToFamilyBinding);
  },

  findByElderId(elderId: string): FamilyBinding[] {
    return queryAll(`
      SELECT fb.*, ue.name as elder_name, uf.name as family_name
      FROM family_bindings fb
      LEFT JOIN users ue ON fb.elder_id = ue.id
      LEFT JOIN users uf ON fb.family_id = uf.id
      WHERE fb.elder_id = ?
      ORDER BY fb.created_at DESC
    `, [elderId], mapToFamilyBinding);
  },

  findByFamilyId(familyId: string): FamilyBinding[] {
    return queryAll(`
      SELECT fb.*, ue.name as elder_name, uf.name as family_name
      FROM family_bindings fb
      LEFT JOIN users ue ON fb.elder_id = ue.id
      LEFT JOIN users uf ON fb.family_id = uf.id
      WHERE fb.family_id = ?
      ORDER BY fb.created_at DESC
    `, [familyId], mapToFamilyBinding);
  },

  findById(id: string): FamilyBinding | null {
    return queryOne(`
      SELECT fb.*, ue.name as elder_name, uf.name as family_name
      FROM family_bindings fb
      LEFT JOIN users ue ON fb.elder_id = ue.id
      LEFT JOIN users uf ON fb.family_id = uf.id
      WHERE fb.id = ?
    `, [id], mapToFamilyBinding);
  },

  create(binding: Omit<FamilyBinding, 'id' | 'createdAt' | 'elderName' | 'familyName'>): FamilyBinding {
    const id = `binding_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    executeAndSave(`
      INSERT INTO family_bindings (id, elder_id, family_id, relation, status, notification_enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      binding.elderId,
      binding.familyId,
      binding.relation,
      binding.status,
      binding.notificationEnabled ? 1 : 0,
      now
    ]);
    return this.findById(id)!;
  },

  update(id: string, updates: Partial<Omit<FamilyBinding, 'id' | 'createdAt' | 'elderId' | 'familyId' | 'elderName' | 'familyName'>>): FamilyBinding | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.relation !== undefined) { fields.push('relation = ?'); params.push(updates.relation); }
    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.notificationEnabled !== undefined) {
      fields.push('notification_enabled = ?');
      params.push(updates.notificationEnabled ? 1 : 0);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    executeAndSave(`UPDATE family_bindings SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  delete(id: string): boolean {
    const changes = executeAndSave('DELETE FROM family_bindings WHERE id = ?', [id]);
    return changes > 0;
  }
};

export const healthContentDB = {
  findAll(options?: {
    type?: HealthContent['type'];
    status?: HealthContent['status'];
    ageGroup?: string;
    chronicDisease?: string;
    limit?: number;
    offset?: number;
  }): HealthContent[] {
    let sql = 'SELECT * FROM health_contents WHERE 1=1';
    const params: any[] = [];

    if (options?.type) {
      sql += ' AND type = ?';
      params.push(options.type);
    }
    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }
    if (options?.ageGroup) {
      sql += ' AND age_groups LIKE ?';
      params.push(`%${options.ageGroup}%`);
    }
    if (options?.chronicDisease) {
      sql += ' AND chronic_diseases LIKE ?';
      params.push(`%${options.chronicDisease}%`);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    return queryAll(sql, params, mapToHealthContent);
  },

  findById(id: string): HealthContent | null {
    return queryOne('SELECT * FROM health_contents WHERE id = ?', [id], mapToHealthContent);
  },

  create(content: Omit<HealthContent, 'id' | 'createdAt'>): HealthContent {
    const id = `content_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    executeAndSave(`
      INSERT INTO health_contents (id, type, title, description, image_url, age_groups, chronic_diseases, content, audio_url, status, accessibility_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      content.type,
      content.title,
      content.description,
      content.imageUrl,
      JSON.stringify(content.ageGroups),
      JSON.stringify(content.chronicDiseases),
      JSON.stringify(content.content),
      content.audioUrl || null,
      content.status,
      content.accessibilityLevel,
      now
    ]);
    return this.findById(id)!;
  },

  update(id: string, updates: Partial<Omit<HealthContent, 'id' | 'createdAt'>>): HealthContent | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.type !== undefined) { fields.push('type = ?'); params.push(updates.type); }
    if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
    if (updates.imageUrl !== undefined) { fields.push('image_url = ?'); params.push(updates.imageUrl); }
    if (updates.ageGroups !== undefined) {
      fields.push('age_groups = ?');
      params.push(JSON.stringify(updates.ageGroups));
    }
    if (updates.chronicDiseases !== undefined) {
      fields.push('chronic_diseases = ?');
      params.push(JSON.stringify(updates.chronicDiseases));
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      params.push(JSON.stringify(updates.content));
    }
    if (updates.audioUrl !== undefined) { fields.push('audio_url = ?'); params.push(updates.audioUrl); }
    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.accessibilityLevel !== undefined) {
      fields.push('accessibility_level = ?');
      params.push(updates.accessibilityLevel);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    executeAndSave(`UPDATE health_contents SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  delete(id: string): boolean {
    const changes = executeAndSave('DELETE FROM health_contents WHERE id = ?', [id]);
    return changes > 0;
  },

  count(options?: { type?: HealthContent['type']; status?: HealthContent['status'] }): number {
    let sql = 'SELECT COUNT(*) as count FROM health_contents WHERE 1=1';
    const params: any[] = [];

    if (options?.type) {
      sql += ' AND type = ?';
      params.push(options.type);
    }
    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    const result = queryScalar<number>(sql, params);
    return result ?? 0;
  }
};

export const medicationReminderDB = {
  findByUserId(userId: string): MedicationReminder[] {
    return queryAll('SELECT * FROM medication_reminders WHERE user_id = ? ORDER BY id', [userId], mapToMedicationReminder);
  },

  findById(id: string): MedicationReminder | null {
    return queryOne('SELECT * FROM medication_reminders WHERE id = ?', [id], mapToMedicationReminder);
  },

  create(reminder: Omit<MedicationReminder, 'id'>): MedicationReminder {
    const id = `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    executeAndSave(`
      INSERT INTO medication_reminders (id, user_id, medicine_name, dosage, times, days, enabled, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      reminder.userId,
      reminder.medicineName,
      reminder.dosage,
      JSON.stringify(reminder.times),
      JSON.stringify(reminder.days),
      reminder.enabled ? 1 : 0,
      reminder.note || null
    ]);
    return this.findById(id)!;
  },

  update(id: string, updates: Partial<Omit<MedicationReminder, 'id' | 'userId'>>): MedicationReminder | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.medicineName !== undefined) { fields.push('medicine_name = ?'); params.push(updates.medicineName); }
    if (updates.dosage !== undefined) { fields.push('dosage = ?'); params.push(updates.dosage); }
    if (updates.times !== undefined) {
      fields.push('times = ?');
      params.push(JSON.stringify(updates.times));
    }
    if (updates.days !== undefined) {
      fields.push('days = ?');
      params.push(JSON.stringify(updates.days));
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      params.push(updates.enabled ? 1 : 0);
    }
    if (updates.note !== undefined) { fields.push('note = ?'); params.push(updates.note); }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    executeAndSave(`UPDATE medication_reminders SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  delete(id: string): boolean {
    const changes = executeAndSave('DELETE FROM medication_reminders WHERE id = ?', [id]);
    return changes > 0;
  }
};

export const alertDB = {
  findAll(options?: {
    familyId?: string;
    elderId?: string;
    read?: boolean;
    type?: Alert['type'];
    level?: Alert['level'];
    limit?: number;
  }): Alert[] {
    let sql = `
      SELECT a.*, u.name as elder_name
      FROM alerts a
      LEFT JOIN users u ON a.elder_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.familyId) {
      sql += ' AND a.family_id = ?';
      params.push(options.familyId);
    }
    if (options?.elderId) {
      sql += ' AND a.elder_id = ?';
      params.push(options.elderId);
    }
    if (options?.read !== undefined) {
      sql += ' AND a.read = ?';
      params.push(options.read ? 1 : 0);
    }
    if (options?.type) {
      sql += ' AND a.type = ?';
      params.push(options.type);
    }
    if (options?.level) {
      sql += ' AND a.level = ?';
      params.push(options.level);
    }

    sql += ' ORDER BY a.created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    return queryAll(sql, params, mapToAlert);
  },

  findById(id: string): Alert | null {
    return queryOne(`
      SELECT a.*, u.name as elder_name
      FROM alerts a
      LEFT JOIN users u ON a.elder_id = u.id
      WHERE a.id = ?
    `, [id], mapToAlert);
  },

  create(alert: Omit<Alert, 'id' | 'createdAt' | 'read' | 'elderName'>): Alert {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    executeAndSave(`
      INSERT INTO alerts (id, type, elder_id, family_id, message, level, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      id,
      alert.type,
      alert.elderId,
      alert.familyId,
      alert.message,
      alert.level,
      now
    ]);
    return this.findById(id)!;
  },

  markAsRead(id: string): Alert | null {
    executeAndSave('UPDATE alerts SET read = 1 WHERE id = ?', [id]);
    return this.findById(id);
  },

  markAllAsRead(familyId: string): number {
    return executeAndSave('UPDATE alerts SET read = 1 WHERE family_id = ? AND read = 0', [familyId]);
  },

  delete(id: string): boolean {
    const changes = executeAndSave('DELETE FROM alerts WHERE id = ?', [id]);
    return changes > 0;
  },

  countUnread(familyId: string): number {
    const result = queryScalar<number>(`
      SELECT COUNT(*) as count FROM alerts 
      WHERE family_id = ? AND read = 0
    `, [familyId]);
    return result ?? 0;
  }
};

export const contentReviewDB = {
  findByContentId(contentId: string): ContentReview[] {
    return queryAll(`
      SELECT * FROM content_reviews 
      WHERE content_id = ? 
      ORDER BY reviewed_at DESC
    `, [contentId], mapToContentReview);
  },

  findByReviewerId(reviewerId: string): ContentReview[] {
    return queryAll(`
      SELECT * FROM content_reviews 
      WHERE reviewer_id = ? 
      ORDER BY reviewed_at DESC
    `, [reviewerId], mapToContentReview);
  },

  create(review: Omit<ContentReview, 'id' | 'reviewedAt'>): ContentReview {
    const id = `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    executeAndSave(`
      INSERT INTO content_reviews (id, content_id, reviewer_id, status, comment, accessibility_level, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      review.contentId,
      review.reviewerId,
      review.status,
      review.comment || null,
      review.accessibilityLevel,
      now
    ]);
    return { ...review, id, reviewedAt: now };
  }
};

export const usageRecordDB = {
  findByUserId(userId: string, limit?: number): UsageRecord[] {
    let sql = 'SELECT * FROM usage_records WHERE user_id = ? ORDER BY created_at DESC';
    const params: any[] = [userId];
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    return queryAll(sql, params, mapToUsageRecord);
  },

  create(record: Omit<UsageRecord, 'id' | 'createdAt'>): UsageRecord {
    const id = `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    executeAndSave(`
      INSERT INTO usage_records (id, user_id, page, duration, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, record.userId, record.page, record.duration, now]);
    return { ...record, id, createdAt: now };
  },

  getDailyStats(userId: string, date: string): { page: string; totalDuration: number }[] {
    const database = getDatabase();
    const sql = `
      SELECT page, SUM(duration) as totalDuration
      FROM usage_records
      WHERE user_id = ? AND DATE(created_at) = DATE(?)
      GROUP BY page
      ORDER BY totalDuration DESC
    `;
    const stmt: Statement = database.prepare(sql);
    const results: { page: string; totalDuration: number }[] = [];
    try {
      stmt.bind([userId, date]);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          page: row.page as string,
          totalDuration: row.totalDuration as number
        });
      }
    } finally {
      stmt.free();
    }
    return results;
  }
};

export const anniversaryDB = {
  findByUserId(userId: string): Anniversary[] {
    return queryAll(`
      SELECT * FROM anniversaries 
      WHERE user_id = ? 
      ORDER BY date
    `, [userId], mapToAnniversary);
  },

  create(anniversary: Omit<Anniversary, 'id'> & { userId: string }): Anniversary {
    const id = `anniv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    executeAndSave(`
      INSERT INTO anniversaries (id, user_id, date, title, type, remind_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      anniversary.userId,
      anniversary.date,
      anniversary.title,
      anniversary.type,
      anniversary.remindDays
    ]);
    return {
      id,
      date: anniversary.date,
      title: anniversary.title,
      type: anniversary.type,
      remindDays: anniversary.remindDays
    };
  },

  update(id: string, updates: Partial<Omit<Anniversary, 'id'>>): boolean {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.date !== undefined) { fields.push('date = ?'); params.push(updates.date); }
    if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title); }
    if (updates.type !== undefined) { fields.push('type = ?'); params.push(updates.type); }
    if (updates.remindDays !== undefined) { fields.push('remind_days = ?'); params.push(updates.remindDays); }

    if (fields.length === 0) return true;

    params.push(id);
    const changes = executeAndSave(`UPDATE anniversaries SET ${fields.join(', ')} WHERE id = ?`, params);
    return changes > 0;
  },

  delete(id: string): boolean {
    const changes = executeAndSave('DELETE FROM anniversaries WHERE id = ?', [id]);
    return changes > 0;
  }
};

export default {
  setDatabase,
  getDatabase,
  userDB,
  familyBindingDB,
  healthContentDB,
  medicationReminderDB,
  alertDB,
  contentReviewDB,
  usageRecordDB,
  anniversaryDB
};
