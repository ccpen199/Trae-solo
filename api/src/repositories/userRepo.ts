import type { User, Reviewer, Brand } from '../../../shared/types.js';
import db from '../utils/database.js';

type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  avatar: string | null;
  created_at: string;
};

type ReviewerRow = {
  id: number;
  user_id: number;
  real_name: string;
  qualifications: string;
  professional_fields: string;
  quality_score: number;
  audit_status: string;
  total_reports: number;
};

type BrandRow = {
  id: number;
  name: string;
  category: string;
  business_license: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  audit_status: string;
  created_at: string;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role as User['role'],
    avatar: row.avatar || undefined,
    createdAt: row.created_at,
  };
}

function mapReviewer(row: ReviewerRow): Reviewer {
  return {
    id: row.id,
    userId: row.user_id,
    realName: row.real_name,
    qualifications: JSON.parse(row.qualifications || '[]'),
    professionalFields: JSON.parse(row.professional_fields || '[]'),
    qualityScore: row.quality_score,
    auditStatus: row.audit_status as Reviewer['auditStatus'],
    totalReports: row.total_reports,
  };
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    businessLicense: row.business_license || '',
    contactName: row.contact_name || '',
    contactPhone: row.contact_phone || '',
    auditStatus: row.audit_status as Brand['auditStatus'],
    createdAt: row.created_at,
  };
}

export const userRepo = {
  findByUsername(username: string): (User & { passwordHash: string }) | null {
    const row = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as UserRow | undefined;
    if (!row) return null;
    const user = mapUser(row);
    return { ...user, passwordHash: (row as UserRow).password_hash };
  },

  findByEmail(email: string): (User & { passwordHash: string }) | null {
    const row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRow | undefined;
    if (!row) return null;
    const user = mapUser(row);
    return { ...user, passwordHash: (row as UserRow).password_hash };
  },

  findById(id: number): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? mapUser(row) : null;
  },

  create(username: string, email: string, passwordHash: string, role: string = 'user'): User {
    const stmt = db.prepare(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(username, email, passwordHash, role);
    return this.findById(result.lastInsertRowid as number)!;
  },

  list(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const rows = db
      .prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(pageSize, offset) as UserRow[];
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    return { items: rows.map(mapUser), total: total.count };
  },
};

export const reviewerRepo = {
  findById(id: number): Reviewer | null {
    const row = db.prepare('SELECT * FROM reviewers WHERE id = ?').get(id) as
      | ReviewerRow
      | undefined;
    return row ? mapReviewer(row) : null;
  },

  findByUserId(userId: number): Reviewer | null {
    const row = db.prepare('SELECT * FROM reviewers WHERE user_id = ?').get(userId) as
      | ReviewerRow
      | undefined;
    return row ? mapReviewer(row) : null;
  },

  create(data: {
    userId: number;
    realName: string;
    qualifications: string[];
    professionalFields: string[];
  }): Reviewer {
    const stmt = db.prepare(
      'INSERT INTO reviewers (user_id, real_name, qualifications, professional_fields) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.userId,
      data.realName,
      JSON.stringify(data.qualifications),
      JSON.stringify(data.professionalFields)
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  updateAuditStatus(id: number, status: Reviewer['auditStatus']): Reviewer | null {
    db.prepare('UPDATE reviewers SET audit_status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  },

  list(page: number, pageSize: number, status?: string) {
    const offset = (page - 1) * pageSize;
    let rows: ReviewerRow[];
    let total: { count: number };
    if (status) {
      rows = db
        .prepare('SELECT * FROM reviewers WHERE audit_status = ? ORDER BY id DESC LIMIT ? OFFSET ?')
        .all(status, pageSize, offset) as ReviewerRow[];
      total = db
        .prepare('SELECT COUNT(*) as count FROM reviewers WHERE audit_status = ?')
        .get(status) as { count: number };
    } else {
      rows = db
        .prepare('SELECT * FROM reviewers ORDER BY id DESC LIMIT ? OFFSET ?')
        .all(pageSize, offset) as ReviewerRow[];
      total = db.prepare('SELECT COUNT(*) as count FROM reviewers').get() as { count: number };
    }
    return { items: rows.map(mapReviewer), total: total.count };
  },

  incrementReports(id: number) {
    db.prepare('UPDATE reviewers SET total_reports = total_reports + 1 WHERE id = ?').run(id);
  },
};

export const brandRepo = {
  findById(id: number): Brand | null {
    const row = db.prepare('SELECT * FROM brands WHERE id = ?').get(id) as BrandRow | undefined;
    return row ? mapBrand(row) : null;
  },

  create(data: {
    name: string;
    category: string;
    businessLicense: string;
    contactName: string;
    contactPhone: string;
  }): Brand {
    const stmt = db.prepare(
      'INSERT INTO brands (name, category, business_license, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.name,
      data.category,
      data.businessLicense,
      data.contactName,
      data.contactPhone
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  updateAuditStatus(id: number, status: Brand['auditStatus']): Brand | null {
    db.prepare('UPDATE brands SET audit_status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  },

  list(page: number, pageSize: number, status?: string) {
    const offset = (page - 1) * pageSize;
    let rows: BrandRow[];
    let total: { count: number };
    if (status) {
      rows = db
        .prepare('SELECT * FROM brands WHERE audit_status = ? ORDER BY id DESC LIMIT ? OFFSET ?')
        .all(status, pageSize, offset) as BrandRow[];
      total = db
        .prepare('SELECT COUNT(*) as count FROM brands WHERE audit_status = ?')
        .get(status) as { count: number };
    } else {
      rows = db
        .prepare('SELECT * FROM brands ORDER BY id DESC LIMIT ? OFFSET ?')
        .all(pageSize, offset) as BrandRow[];
      total = db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
    }
    return { items: rows.map(mapBrand), total: total.count };
  },
};
