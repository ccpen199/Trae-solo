import type {
  EvaluationPlan,
  ReviewTask,
  Appeal,
  WeightConfig,
} from '../../../shared/types.js';
import db from '../utils/database.js';

type PlanRow = {
  id: number;
  name: string;
  category: string;
  city: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

type TaskRow = {
  id: number;
  plan_id: number;
  target_id: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  required_qualifications: string;
  reward: number;
  reviewer_id: number | null;
};

type AppealRow = {
  id: number;
  brand_id: number;
  report_id: number;
  reason: string;
  evidence: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  processor_note: string | null;
};

type WeightConfigRow = {
  id: number;
  category: string;
  dimension_weights: string;
  updated_at: string;
};

type AuditLogRow = {
  id: number;
  report_id: number;
  admin_id: number;
  action: string;
  comment: string;
  created_at: string;
};

type TargetRow = { id: number; name: string };
type BrandRow = { id: number; name: string };
type ReportRow = { id: number; title: string };

function mapPlan(row: PlanRow): EvaluationPlan {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    city: row.city,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as EvaluationPlan['status'],
    createdAt: row.created_at,
  };
}

function mapTask(row: TaskRow, targetName?: string): ReviewTask {
  return {
    id: row.id,
    planId: row.plan_id,
    targetId: row.target_id,
    targetName,
    title: row.title,
    description: row.description,
    deadline: row.deadline,
    status: row.status as ReviewTask['status'],
    requiredQualifications: JSON.parse(row.required_qualifications || '[]'),
    reward: row.reward,
    reviewerId: row.reviewer_id || undefined,
  };
}

function mapAppeal(row: AppealRow, reportTitle?: string, brandName?: string): Appeal {
  return {
    id: row.id,
    brandId: row.brand_id,
    reportId: row.report_id,
    reason: row.reason,
    evidence: JSON.parse(row.evidence || '[]'),
    status: row.status as Appeal['status'],
    createdAt: row.created_at,
    processedAt: row.processed_at || undefined,
    processorNote: row.processor_note || undefined,
    reportTitle,
    brandName,
  };
}

function mapWeightConfig(row: WeightConfigRow): WeightConfig {
  const parsed = JSON.parse(row.dimension_weights);
  return {
    category: row.category,
    dimensions: parsed.dimensions,
  };
}

export const planRepo = {
  findById(id: number): EvaluationPlan | null {
    const row = db.prepare('SELECT * FROM evaluation_plans WHERE id = ?').get(id) as
      | PlanRow
      | undefined;
    if (!row) return null;
    const plan = mapPlan(row);
    plan.tasks = taskRepo.listByPlanId(id);
    return plan;
  },

  list(page: number, pageSize: number, status?: string) {
    const offset = (page - 1) * pageSize;
    let rows: PlanRow[];
    let total: { count: number };
    if (status) {
      rows = db
        .prepare('SELECT * FROM evaluation_plans WHERE status = ? ORDER BY id DESC LIMIT ? OFFSET ?')
        .all(status, pageSize, offset) as PlanRow[];
      total = db
        .prepare('SELECT COUNT(*) as count FROM evaluation_plans WHERE status = ?')
        .get(status) as { count: number };
    } else {
      rows = db
        .prepare('SELECT * FROM evaluation_plans ORDER BY id DESC LIMIT ? OFFSET ?')
        .all(pageSize, offset) as PlanRow[];
      total = db.prepare('SELECT COUNT(*) as count FROM evaluation_plans').get() as {
        count: number;
      };
    }
    return { items: rows.map(mapPlan), total: total.count };
  },

  create(data: {
    name: string;
    category: string;
    city: string;
    startDate: string;
    endDate: string;
  }): EvaluationPlan {
    const stmt = db.prepare(
      'INSERT INTO evaluation_plans (name, category, city, start_date, end_date) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(data.name, data.category, data.city, data.startDate, data.endDate);
    return this.findById(result.lastInsertRowid as number)!;
  },

  updateStatus(id: number, status: EvaluationPlan['status']): EvaluationPlan | null {
    db.prepare('UPDATE evaluation_plans SET status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  },
};

export const taskRepo = {
  findById(id: number): ReviewTask | null {
    const row = db.prepare('SELECT * FROM review_tasks WHERE id = ?').get(id) as
      | TaskRow
      | undefined;
    if (!row) return null;
    const target = db
      .prepare('SELECT name FROM evaluation_targets WHERE id = ?')
      .get(row.target_id) as TargetRow | undefined;
    return mapTask(row, target?.name);
  },

  listByPlanId(planId: number): ReviewTask[] {
    const rows = db
      .prepare(
        `SELECT rt.*, et.name as target_name FROM review_tasks rt 
         LEFT JOIN evaluation_targets et ON rt.target_id = et.id 
         WHERE rt.plan_id = ? ORDER BY rt.id`
      )
      .all(planId) as (TaskRow & { target_name?: string })[];
    return rows.map((r) => mapTask(r, r.target_name));
  },

  list(params: {
    page: number;
    pageSize: number;
    status?: string;
    reviewerId?: number;
  }) {
    const { page, pageSize, status, reviewerId } = params;
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const args: any[] = [];

    if (status) {
      conditions.push('rt.status = ?');
      args.push(status);
    }
    if (reviewerId) {
      conditions.push('rt.reviewer_id = ?');
      args.push(reviewerId);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = db
      .prepare(
        `SELECT rt.*, et.name as target_name FROM review_tasks rt 
         LEFT JOIN evaluation_targets et ON rt.target_id = et.id 
         ${whereClause} ORDER BY rt.deadline ASC LIMIT ? OFFSET ?`
      )
      .all(...args, pageSize, offset) as (TaskRow & { target_name?: string })[];

    const total = db
      .prepare(`SELECT COUNT(*) as count FROM review_tasks rt ${whereClause}`)
      .get(...args) as { count: number };

    return {
      items: rows.map((r) => mapTask(r, r.target_name)),
      total: total.count,
    };
  },

  create(data: {
    planId: number;
    targetId: number;
    title: string;
    description: string;
    deadline: string;
    requiredQualifications: string[];
    reward: number;
  }): ReviewTask {
    const stmt = db.prepare(
      'INSERT INTO review_tasks (plan_id, target_id, title, description, deadline, required_qualifications, reward) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.planId,
      data.targetId,
      data.title,
      data.description,
      data.deadline,
      JSON.stringify(data.requiredQualifications),
      data.reward
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  assign(id: number, reviewerId: number): ReviewTask | null {
    db.prepare('UPDATE review_tasks SET status = ?, reviewer_id = ? WHERE id = ?').run(
      'assigned',
      reviewerId,
      id
    );
    return this.findById(id);
  },

  complete(id: number): ReviewTask | null {
    db.prepare('UPDATE review_tasks SET status = ? WHERE id = ?').run('completed', id);
    return this.findById(id);
  },
};

export const appealRepo = {
  findById(id: number): Appeal | null {
    const row = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id) as AppealRow | undefined;
    if (!row) return null;
    const report = db
      .prepare('SELECT title FROM evaluation_reports WHERE id = ?')
      .get(row.report_id) as ReportRow | undefined;
    const brand = db
      .prepare('SELECT name FROM brands WHERE id = ?')
      .get(row.brand_id) as BrandRow | undefined;
    return mapAppeal(row, report?.title, brand?.name);
  },

  list(params: { page: number; pageSize: number; status?: string; brandId?: number }) {
    const { page, pageSize, status, brandId } = params;
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const args: any[] = [];

    if (status) {
      conditions.push('a.status = ?');
      args.push(status);
    }
    if (brandId) {
      conditions.push('a.brand_id = ?');
      args.push(brandId);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = db
      .prepare(
        `SELECT a.*, er.title as report_title, b.name as brand_name FROM appeals a 
         LEFT JOIN evaluation_reports er ON a.report_id = er.id 
         LEFT JOIN brands b ON a.brand_id = b.id 
         ${whereClause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...args, pageSize, offset) as (AppealRow & { report_title?: string; brand_name?: string })[];

    const total = db
      .prepare(`SELECT COUNT(*) as count FROM appeals a ${whereClause}`)
      .get(...args) as { count: number };

    return {
      items: rows.map((r) => mapAppeal(r, r.report_title, r.brand_name)),
      total: total.count,
    };
  },

  create(data: {
    brandId: number;
    reportId: number;
    reason: string;
    evidence: string[];
  }): Appeal {
    const stmt = db.prepare(
      'INSERT INTO appeals (brand_id, report_id, reason, evidence) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.brandId,
      data.reportId,
      data.reason,
      JSON.stringify(data.evidence)
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  process(id: number, status: Appeal['status'], processorNote: string): Appeal | null {
    db.prepare(
      'UPDATE appeals SET status = ?, processed_at = ?, processor_note = ? WHERE id = ?'
    ).run(status, new Date().toISOString(), processorNote, id);
    return this.findById(id);
  },
};

export const weightConfigRepo = {
  findByCategory(category: string): WeightConfig | null {
    const row = db
      .prepare('SELECT * FROM weight_configs WHERE category = ?')
      .get(category) as WeightConfigRow | undefined;
    return row ? mapWeightConfig(row) : null;
  },

  list(): WeightConfig[] {
    const rows = db.prepare('SELECT * FROM weight_configs').all() as WeightConfigRow[];
    return rows.map(mapWeightConfig);
  },

  update(category: string, config: WeightConfig): WeightConfig | null {
    db.prepare(
      'UPDATE weight_configs SET dimension_weights = ?, updated_at = ? WHERE category = ?'
    ).run(JSON.stringify({ dimensions: config.dimensions }), new Date().toISOString(), category);
    return this.findByCategory(category);
  },
};

export const auditLogRepo = {
  create(data: { reportId: number; adminId: number; action: string; comment: string }) {
    db.prepare(
      'INSERT INTO review_audit_logs (report_id, admin_id, action, comment) VALUES (?, ?, ?, ?)'
    ).run(data.reportId, data.adminId, data.action, data.comment);
  },

  listByReportId(reportId: number) {
    const rows = db
      .prepare('SELECT * FROM review_audit_logs WHERE report_id = ? ORDER BY created_at DESC')
      .all(reportId) as AuditLogRow[];
    return rows.map((r) => ({
      id: r.id,
      reportId: r.report_id,
      adminId: r.admin_id,
      action: r.action,
      comment: r.comment,
      createdAt: r.created_at,
    }));
  },
};
