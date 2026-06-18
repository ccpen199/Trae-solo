import type { Ranking, RankingItem, DimensionScore } from '../../../shared/types.js';
import db from '../utils/database.js';

type RankingRow = {
  id: number;
  category: string;
  city: string;
  period: string;
  created_at: string;
};

type RankingItemRow = {
  id: number;
  ranking_id: number;
  rank: number;
  target_id: number;
  overall_score: number;
  previous_rank: number | null;
  change_trend: string;
  report_id: number;
};

type CategoryRow = {
  code: string;
  name: string;
};

type TargetRow = {
  id: number;
  name: string;
  category: string;
  city: string;
};

type ReportRow = {
  id: number;
  dimension_scores: string;
};

function mapRankingItem(row: RankingItemRow, targetName: string, category?: string, city?: string, dimensionScores?: DimensionScore[]): RankingItem {
  return {
    id: row.id,
    rank: row.rank,
    targetId: row.target_id,
    targetName,
    overallScore: row.overall_score,
    previousRank: row.previous_rank || undefined,
    changeTrend: row.change_trend as RankingItem['changeTrend'],
    reportId: row.report_id,
    category,
    city,
    dimensionScores,
  };
}

export const rankingRepo = {
  findById(id: number): Ranking | null {
    const row = db.prepare('SELECT * FROM rankings WHERE id = ?').get(id) as RankingRow | undefined;
    if (!row) return null;

    const category = db
      .prepare('SELECT name FROM evaluation_categories WHERE code = ?')
      .get(row.category) as CategoryRow | undefined;

    const items = this.getRankingItems(id, row.category, row.city);

    return {
      id: row.id,
      category: row.category,
      categoryName: category?.name,
      city: row.city,
      period: row.period,
      items,
      createdAt: row.created_at,
    };
  },

  getRankingItems(rankingId: number, category: string, city: string): RankingItem[] {
    const rows = db
      .prepare(
        `SELECT ri.*, et.name as target_name, er.dimension_scores as dim_scores
         FROM ranking_items ri 
         JOIN evaluation_targets et ON ri.target_id = et.id 
         LEFT JOIN evaluation_reports er ON ri.report_id = er.id
         WHERE ri.ranking_id = ? ORDER BY ri.rank`
      )
      .all(rankingId) as (RankingItemRow & { target_name: string; dim_scores?: string })[];

    return rows.map((row) => {
      const dimensionScores: DimensionScore[] = row.dim_scores ? JSON.parse(row.dim_scores) : [];
      return mapRankingItem(row, row.target_name, category, city, dimensionScores);
    });
  },

  list(params: {
    page: number;
    pageSize: number;
    category?: string;
    city?: string;
  }) {
    const { page, pageSize, category, city } = params;
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const args: any[] = [];

    if (category) {
      conditions.push('r.category = ?');
      args.push(category);
    }
    if (city) {
      conditions.push('r.city = ?');
      args.push(city);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = db
      .prepare(
        `SELECT r.*, ec.name as category_name FROM rankings r 
         LEFT JOIN evaluation_categories ec ON r.category = ec.code 
         ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...args, pageSize, offset) as (RankingRow & { category_name?: string })[];

    const total = db
      .prepare(`SELECT COUNT(*) as count FROM rankings r ${whereClause}`)
      .get(...args) as { count: number };

    const items = rows.map((row) => ({
      id: row.id,
      category: row.category,
      categoryName: row.category_name,
      city: row.city,
      period: row.period,
      items: this.getRankingItems(row.id, row.category, row.city),
      createdAt: row.created_at,
    }));

    return { items, total: total.count };
  },

  findLatest(category: string, city: string, period: string): Ranking | null {
    const row = db
      .prepare(
        'SELECT * FROM rankings WHERE category = ? AND city = ? AND period = ? ORDER BY created_at DESC LIMIT 1'
      )
      .get(category, city, period) as RankingRow | undefined;
    if (!row) return null;
    return this.findById(row.id);
  },

  create(data: {
    category: string;
    city: string;
    period: string;
    items: Omit<RankingItem, 'id'>[];
  }): Ranking {
    const tx = db.transaction(() => {
      const rankingStmt = db.prepare(
        'INSERT INTO rankings (category, city, period) VALUES (?, ?, ?)'
      );
      const result = rankingStmt.run(data.category, data.city, data.period);
      const rankingId = result.lastInsertRowid as number;

      const itemStmt = db.prepare(
        'INSERT INTO ranking_items (ranking_id, rank, target_id, overall_score, previous_rank, change_trend, report_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const item of data.items) {
        itemStmt.run(
          rankingId,
          item.rank,
          item.targetId,
          item.overallScore,
          item.previousRank || null,
          item.changeTrend,
          item.reportId
        );
      }

      return rankingId;
    });

    const id = tx();
    return this.findById(id)!;
  },
};
