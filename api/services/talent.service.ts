import db from '../db/database.js';
import { Talent, TalentLevel, UserRole, UserStatus, ApiResponse, PortfolioItem, Certification } from '../../shared/types.js';
import { parseTask } from './task.service.js';

function parseUser(row: Record<string, unknown>) {
  if (!row) return undefined;
  return {
    id: row.id as number,
    email: row.email as string,
    phone: (row.phone as string) || '',
    name: row.name as string,
    avatar: (row.avatar as string) || null,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function parsePortfolio(row: Record<string, unknown>): PortfolioItem {
  return {
    id: String(row.id),
    title: row.title as string,
    description: (row.description as string) || '',
    images: row.images ? JSON.parse(row.images as string) : [],
    url: (row.url as string) || '',
  };
}

function parseCertification(row: Record<string, unknown>): Certification {
  return {
    id: String(row.id),
    type: row.type as string,
    name: row.name as string,
    issuer: row.issuer as string,
    issueDate: row.issue_date as string,
    verified: Boolean(row.verified),
  };
}

export function parseTalent(row: Record<string, unknown>): Talent {
  return {
    id: row.id as number,
    userId: row.user_id as number,
    realName: (row.real_name as string) || '',
    idCardVerified: Boolean(row.id_card_verified),
    skills: row.skills ? JSON.parse(row.skills as string) : [],
    bio: (row.bio as string) || '',
    rating: row.rating as number,
    completedProjects: row.completed_projects as number,
    onTimeRate: row.on_time_rate as number,
    level: row.level as TalentLevel,
    verified: Boolean(row.verified),
    portfolio: [],
    certifications: [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class TalentService {
  async getTalentList(query: { page?: number; pageSize?: number; skill?: string; level?: TalentLevel; verified?: boolean }): Promise<ApiResponse<Talent[]>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.skill) {
      conditions.push('t.skills LIKE ?');
      params.push(`%${query.skill}%`);
    }

    if (query.level) {
      conditions.push('t.level = ?');
      params.push(query.level);
    }

    if (query.verified !== undefined) {
      conditions.push('t.verified = ?');
      params.push(query.verified ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM talents t ${whereClause}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
      SELECT t.* FROM talents t ${whereClause}
      ORDER BY t.rating DESC, t.completed_projects DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Record<string, unknown>[];

    const talents = rows.map(row => {
      const talent = parseTalent(row);
      const userRow = db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).get(talent.userId) as Record<string, unknown> | undefined;
      talent.user = parseUser(userRow);

      const portfolioRows = db.prepare(`
        SELECT * FROM portfolio_items WHERE talent_id = ?
        ORDER BY created_at DESC
      `).all(talent.id) as Record<string, unknown>[];
      talent.portfolio = portfolioRows.map(parsePortfolio);

      const certRows = db.prepare(`
        SELECT * FROM certifications WHERE talent_id = ?
        ORDER BY issue_date DESC
      `).all(talent.id) as Record<string, unknown>[];
      talent.certifications = certRows.map(parseCertification);

      return talent;
    });

    return {
      success: true,
      data: talents,
      total: countRow.total,
      page,
      pageSize,
    };
  }

  async getTalentById(id: number): Promise<ApiResponse<Talent>> {
    const row = db.prepare(`
      SELECT * FROM talents WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return {
        success: false,
        message: '人才不存在',
      };
    }

    const talent = parseTalent(row);

    const userRow = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(talent.userId) as Record<string, unknown> | undefined;
    talent.user = parseUser(userRow);

    const portfolioRows = db.prepare(`
      SELECT * FROM portfolio_items WHERE talent_id = ?
      ORDER BY created_at DESC
    `).all(talent.id) as Record<string, unknown>[];
    talent.portfolio = portfolioRows.map(parsePortfolio);

    const certRows = db.prepare(`
      SELECT * FROM certifications WHERE talent_id = ?
      ORDER BY issue_date DESC
    `).all(talent.id) as Record<string, unknown>[];
    talent.certifications = certRows.map(parseCertification);

    return {
      success: true,
      data: talent,
    };
  }

  async getMatchingTalents(taskId: number): Promise<ApiResponse<Talent[]>> {
    const taskRow = db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(taskId) as Record<string, unknown> | undefined;

    if (!taskRow) {
      return {
        success: false,
        message: '任务不存在',
      };
    }

    const task = parseTask(taskRow);
    const taskTags = task.tags || [];

    if (taskTags.length === 0) {
      return {
        success: true,
        data: [],
        message: '任务没有标签，无法进行匹配',
      };
    }

    const likeConditions = taskTags.map(() => 't.skills LIKE ?').join(' OR ');
    const likeParams = taskTags.map(tag => `%${tag}%`);

    const rows = db.prepare(`
      SELECT t.* FROM talents t
      WHERE t.verified = 1 AND (${likeConditions})
      ORDER BY t.rating DESC, t.completed_projects DESC
      LIMIT 10
    `).all(...likeParams) as Record<string, unknown>[];

    const talents = rows.map(row => {
      const talent = parseTalent(row);
      const userRow = db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).get(talent.userId) as Record<string, unknown> | undefined;
      talent.user = parseUser(userRow);

      const portfolioRows = db.prepare(`
        SELECT * FROM portfolio_items WHERE talent_id = ?
        ORDER BY created_at DESC
      `).all(talent.id) as Record<string, unknown>[];
      talent.portfolio = portfolioRows.map(parsePortfolio);

      const certRows = db.prepare(`
        SELECT * FROM certifications WHERE talent_id = ?
        ORDER BY issue_date DESC
      `).all(talent.id) as Record<string, unknown>[];
      talent.certifications = certRows.map(parseCertification);

      return talent;
    });

    talents.sort((a, b) => {
      const aMatch = a.skills.filter(s => taskTags.some(t => s.includes(t) || t.includes(s))).length;
      const bMatch = b.skills.filter(s => taskTags.some(t => s.includes(t) || t.includes(s))).length;
      return bMatch - aMatch;
    });

    return {
      success: true,
      data: talents,
    };
  }

  async verifyTalent(talentId: number, verified: boolean, level: TalentLevel, adminId: number): Promise<ApiResponse<Talent>> {
    const row = db.prepare(`
      SELECT * FROM talents WHERE id = ?
    `).get(talentId) as Record<string, unknown> | undefined;

    if (!row) {
      return {
        success: false,
        message: '人才不存在',
      };
    }

    db.prepare(`
      UPDATE talents SET verified = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(verified ? 1 : 0, level, talentId);

    const updatedRow = db.prepare(`
      SELECT * FROM talents WHERE id = ?
    `).get(talentId) as Record<string, unknown>;

    const talent = parseTalent(updatedRow);

    const userRow = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(talent.userId) as Record<string, unknown> | undefined;
    talent.user = parseUser(userRow);

    return {
      success: true,
      message: verified ? '人才认证通过' : '人才认证已取消',
      data: talent,
    };
  }
}

export default new TalentService();
