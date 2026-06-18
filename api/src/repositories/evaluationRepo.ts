import type {
  EvaluationTarget,
  EvaluationReport,
  IndicatorScore,
  DataSource,
  DimensionScore,
  EvaluationIndicator,
  EvaluationCategory,
} from '../../../shared/types.js';
import db from '../utils/database.js';

type TargetRow = {
  id: number;
  name: string;
  category: string;
  city: string;
  brand_id: number | null;
  description: string;
  cover_image: string | null;
};

type ReportRow = {
  id: number;
  target_id: number;
  reviewer_id: number;
  title: string;
  summary: string;
  overall_score: number;
  dimension_scores: string;
  status: string;
  pdf_url: string | null;
  created_at: string;
  published_at: string | null;
};

type IndicatorScoreRow = {
  id: number;
  report_id: number;
  indicator_id: number;
  score: number;
  weight: number;
};

type DataSourceRow = {
  id: string;
  indicator_score_id: number;
  name: string;
  type: string;
  collected_at: string;
  raw_value: number;
  normalized_value: number;
  verified: number;
};

type IndicatorRow = {
  id: number;
  name: string;
  code: string;
  category: string;
  default_weight: number;
  description: string;
};

type CategoryRow = {
  code: string;
  name: string;
  description: string;
};

type BrandRow = {
  id: number;
  name: string;
};

function mapTarget(row: TargetRow, brandName?: string): EvaluationTarget {
  return {
    id: row.id,
    name: row.name,
    category: row.category as EvaluationTarget['category'],
    city: row.city,
    brandId: row.brand_id || undefined,
    brandName,
    description: row.description,
    coverImage: row.cover_image || undefined,
  };
}

function mapIndicator(row: IndicatorRow): EvaluationIndicator {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    weight: row.default_weight,
    category: row.category,
    description: row.description,
  };
}

function mapCategory(row: CategoryRow): EvaluationCategory {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
  };
}

export const targetRepo = {
  findById(id: number): EvaluationTarget | null {
    const row = db.prepare('SELECT * FROM evaluation_targets WHERE id = ?').get(id) as
      | TargetRow
      | undefined;
    if (!row) return null;
    let brandName: string | undefined;
    if (row.brand_id) {
      const brand = db
        .prepare('SELECT name FROM brands WHERE id = ?')
        .get(row.brand_id) as BrandRow | undefined;
      brandName = brand?.name;
    }
    return mapTarget(row, brandName);
  },

  list(params: {
    page: number;
    pageSize: number;
    category?: string;
    city?: string;
    keyword?: string;
  }) {
    const { page, pageSize, category, city, keyword } = params;
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const args: any[] = [];

    if (category) {
      conditions.push('t.category = ?');
      args.push(category);
    }
    if (city) {
      conditions.push('t.city = ?');
      args.push(city);
    }
    if (keyword) {
      conditions.push('(t.name LIKE ? OR t.description LIKE ?)');
      args.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = db
      .prepare(
        `SELECT t.*, b.name as brand_name FROM evaluation_targets t 
         LEFT JOIN brands b ON t.brand_id = b.id 
         ${whereClause} ORDER BY t.id DESC LIMIT ? OFFSET ?`
      )
      .all(...args, pageSize, offset) as (TargetRow & { brand_name?: string })[];

    const total = db
      .prepare(
        `SELECT COUNT(*) as count FROM evaluation_targets t ${whereClause}`
      )
      .get(...args) as { count: number };

    return {
      items: rows.map((r) => mapTarget(r, r.brand_name)),
      total: total.count,
    };
  },

  create(data: {
    name: string;
    category: string;
    city: string;
    brandId?: number;
    description: string;
  }): EvaluationTarget {
    const stmt = db.prepare(
      'INSERT INTO evaluation_targets (name, category, city, brand_id, description) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.name,
      data.category,
      data.city,
      data.brandId || null,
      data.description
    );
    return this.findById(result.lastInsertRowid as number)!;
  },
};

export const reportRepo = {
  findById(id: number): EvaluationReport | null {
    const row = db.prepare('SELECT * FROM evaluation_reports WHERE id = ?').get(id) as
      | ReportRow
      | undefined;
    if (!row) return null;
    return this.buildReport(row);
  },

  buildReport(row: ReportRow): EvaluationReport {
    const indicatorScores = this.getIndicatorScores(row.id);
    const dimensionScores: DimensionScore[] = row.dimension_scores
      ? JSON.parse(row.dimension_scores)
      : [];
    const target = targetRepo.findById(row.target_id);

    return {
      id: row.id,
      targetId: row.target_id,
      reviewerId: row.reviewer_id,
      title: row.title,
      summary: row.summary,
      overallScore: row.overall_score,
      dimensionScores,
      indicatorScores,
      status: row.status as EvaluationReport['status'],
      pdfUrl: row.pdf_url || undefined,
      createdAt: row.created_at,
      publishedAt: row.published_at || undefined,
      target,
    };
  },

  getIndicatorScores(reportId: number): IndicatorScore[] {
    const rows = db
      .prepare(
        `SELECT isc.*, ei.name as indicator_name, ei.code as indicator_code 
         FROM indicator_scores isc 
         JOIN evaluation_indicators ei ON isc.indicator_id = ei.id 
         WHERE isc.report_id = ? ORDER BY ei.id`
      )
      .all(reportId) as (IndicatorScoreRow & { indicator_name: string; indicator_code: string })[];

    return rows.map((row) => {
      const dataSources = this.getDataSources(row.id);
      return {
        id: row.id,
        indicatorId: row.indicator_id,
        indicatorName: row.indicator_name,
        indicatorCode: row.indicator_code,
        score: row.score,
        weight: row.weight,
        dataSources,
      };
    });
  },

  getDataSources(indicatorScoreId: number): DataSource[] {
    const rows = db
      .prepare('SELECT * FROM data_sources WHERE indicator_score_id = ?')
      .all(indicatorScoreId) as DataSourceRow[];
    return rows.map((row) => ({
      id: row.id,
      indicatorScoreId: row.indicator_score_id,
      name: row.name,
      type: row.type as DataSource['type'],
      collectedAt: row.collected_at,
      rawValue: row.raw_value,
      normalizedValue: row.normalized_value,
      verified: !!row.verified,
    }));
  },

  create(data: {
    targetId: number;
    reviewerId: number;
    title: string;
    summary: string;
    overallScore: number;
    dimensionScores: DimensionScore[];
    status: EvaluationReport['status'];
    indicatorScores: IndicatorScore[];
  }): EvaluationReport {
    const tx = db.transaction(() => {
      const reportStmt = db.prepare(
        `INSERT INTO evaluation_reports (target_id, reviewer_id, title, summary, overall_score, dimension_scores, status, published_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const publishedAt = data.status === 'published' ? new Date().toISOString() : null;
      const result = reportStmt.run(
        data.targetId,
        data.reviewerId,
        data.title,
        data.summary,
        data.overallScore,
        JSON.stringify(data.dimensionScores),
        data.status,
        publishedAt
      );
      const reportId = result.lastInsertRowid as number;

      const isStmt = db.prepare(
        'INSERT INTO indicator_scores (report_id, indicator_id, score, weight) VALUES (?, ?, ?, ?)'
      );
      const dsStmt = db.prepare(
        'INSERT INTO data_sources (id, indicator_score_id, name, type, collected_at, raw_value, normalized_value, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );

      for (const is of data.indicatorScores) {
        const isResult = isStmt.run(reportId, is.indicatorId, is.score, is.weight);
        const isId = isResult.lastInsertRowid as number;
        for (const ds of is.dataSources) {
          dsStmt.run(
            ds.id || `ds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            isId,
            ds.name,
            ds.type,
            ds.collectedAt,
            ds.rawValue,
            ds.normalizedValue,
            ds.verified ? 1 : 0
          );
        }
      }

      return reportId;
    });

    const reportId = tx();
    return this.findById(reportId)!;
  },

  updateStatus(id: number, status: EvaluationReport['status']): EvaluationReport | null {
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    if (publishedAt) {
      db.prepare('UPDATE evaluation_reports SET status = ?, published_at = ? WHERE id = ?').run(
        status,
        publishedAt,
        id
      );
    } else {
      db.prepare('UPDATE evaluation_reports SET status = ? WHERE id = ?').run(status, id);
    }
    return this.findById(id);
  },

  list(params: {
    page: number;
    pageSize: number;
    targetId?: number;
    reviewerId?: number;
    status?: string;
    category?: string;
  }) {
    const { page, pageSize, targetId, reviewerId, status, category } = params;
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const args: any[] = [];

    if (targetId) {
      conditions.push('er.target_id = ?');
      args.push(targetId);
    }
    if (reviewerId) {
      conditions.push('er.reviewer_id = ?');
      args.push(reviewerId);
    }
    if (status) {
      conditions.push('er.status = ?');
      args.push(status);
    }
    if (category) {
      conditions.push('et.category = ?');
      args.push(category);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = db
      .prepare(
        `SELECT er.* FROM evaluation_reports er 
         LEFT JOIN evaluation_targets et ON er.target_id = et.id 
         ${whereClause} ORDER BY er.created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...args, pageSize, offset) as ReportRow[];

    const total = db
      .prepare(
        `SELECT COUNT(*) as count FROM evaluation_reports er 
         LEFT JOIN evaluation_targets et ON er.target_id = et.id 
         ${whereClause}`
      )
      .get(...args) as { count: number };

    return {
      items: rows.map((r) => this.buildReport(r)),
      total: total.count,
    };
  },
};

export const indicatorRepo = {
  listByCategory(category: string): EvaluationIndicator[] {
    const rows = db
      .prepare('SELECT * FROM evaluation_indicators WHERE category = ? ORDER BY id')
      .all(category) as IndicatorRow[];
    return rows.map(mapIndicator);
  },

  list(): EvaluationIndicator[] {
    const rows = db
      .prepare('SELECT * FROM evaluation_indicators ORDER BY category, id')
      .all() as IndicatorRow[];
    return rows.map(mapIndicator);
  },
};

export const categoryRepo = {
  list(): EvaluationCategory[] {
    const rows = db.prepare('SELECT * FROM evaluation_categories').all() as CategoryRow[];
    return rows.map(mapCategory);
  },

  findByCode(code: string): EvaluationCategory | null {
    const row = db.prepare('SELECT * FROM evaluation_categories WHERE code = ?').get(code) as
      | CategoryRow
      | undefined;
    return row ? mapCategory(row) : null;
  },
};
