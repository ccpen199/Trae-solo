import { Request, Response } from 'express';
import db from '../db';

function calculateCreditScore(onTimeRate: number, serviceScore: number, violationCount: number): number {
  const onTimeComponent = onTimeRate * 0.4;
  const serviceComponent = serviceScore * 20 * 0.35;
  const violationComponent = (100 - violationCount * 5) * 0.25;
  return Math.round(onTimeComponent + serviceComponent + violationComponent);
}

function getCreditLevel(score: number): string {
  if (score >= 95) return 'S';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export function updateCredit(driverId: number): void {
  try {
    const credit = db.prepare('SELECT * FROM driver_credit WHERE driver_id = ?').get(driverId) as any;
    if (!credit) return;

    const newScore = calculateCreditScore(credit.on_time_rate, credit.service_score, credit.violation_count);

    db.prepare(`
      UPDATE driver_credit 
      SET credit_score = ?, updated_at = datetime('now')
      WHERE driver_id = ?
    `).run(newScore, driverId);
  } catch (error) {
    console.error('Failed to update credit score:', error);
  }
}

export const getDriverCredits = (req: Request, res: Response) => {
  try {
    const { keyword, level, page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSizeNum = parseInt(pageSize as string, 10) || 10;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (keyword) {
      whereClauses.push('d.name LIKE ?');
      params.push(`%${keyword}%`);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const total = (db.prepare(`
      SELECT COUNT(*) as count FROM driver_credit dc
      JOIN drivers d ON dc.driver_id = d.id
      ${whereStr}
    `).get(...params) as { count: number }).count;

    let credits = db.prepare(`
      SELECT dc.*, d.name as driver_name
      FROM driver_credit dc
      JOIN drivers d ON dc.driver_id = d.id
      ${whereStr}
      ORDER BY dc.credit_score DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSizeNum, (pageNum - 1) * pageSizeNum) as any[];

    credits = credits.map(credit => ({
      ...credit,
      level: getCreditLevel(credit.credit_score),
      total_orders: 0,
      completed_orders: 0,
      complaint_count: 0,
    }));

    if (level) {
      credits = credits.filter((c: any) => c.level === level);
    }

    res.success({ list: credits, total, page: pageNum, pageSize: pageSizeNum });
  } catch (error) {
    res.error('Failed to fetch driver credits');
  }
};

export const getDriverCreditByDriverId = (req: Request, res: Response) => {
  try {
    const credit = db.prepare(`
      SELECT dc.*, d.name as driver_name
      FROM driver_credit dc
      JOIN drivers d ON dc.driver_id = d.id
      WHERE dc.driver_id = ?
    `).get(req.params.driverId);
    if (!credit) {
      return res.error('Driver credit not found');
    }
    const enriched = {
      ...credit,
      level: getCreditLevel((credit as any).credit_score),
      total_orders: 0,
      completed_orders: 0,
      complaint_count: 0,
    };
    res.success(enriched);
  } catch (error) {
    res.error('Failed to fetch driver credit');
  }
};

export const getCreditRanking = (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const allCredits = db.prepare(`
      SELECT dc.*, d.name as driver_name, d.vehicle_type, d.vehicle_plate
      FROM driver_credit dc 
      JOIN drivers d ON dc.driver_id = d.id 
      ORDER BY dc.credit_score DESC
      LIMIT ?
    `).all(limit) as any[];

    const rankings = allCredits.map((credit, index) => ({
      ...credit,
      rank: index + 1,
      level: getCreditLevel(credit.credit_score),
      on_time_rate: credit.on_time_rate,
      service_rating: credit.service_score,
      violation_count: credit.violation_count,
      total_orders: 0,
      completed_orders: 0,
      complaint_count: 0,
    }));

    res.success(rankings);
  } catch (error) {
    res.error('Failed to fetch credit ranking');
  }
};

export const getCreditModel = (_req: Request, res: Response) => {
  try {
    res.success({
      factors: [
        { name: '准时率', weight: 0.4, description: '按时完成配送的比例' },
        { name: '服务评分', weight: 0.35, description: '客户对配送服务的评价分数' },
        { name: '违规次数', weight: 0.25, description: '交通违规和配送违规的次数' },
      ],
      formula: '信用分 = 准时率×40 + 服务评分×20×35 + (100-违规次数×5)×25',
      description: '信用分综合考量司机的准时率、服务评分、违规次数等多个维度',
    });
  } catch (error) {
    res.error('Failed to fetch credit model');
  }
};

export const recalculateCredit = (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    const credit = db.prepare('SELECT * FROM driver_credit WHERE driver_id = ?').get(driverId) as any;
    if (!credit) {
      return res.error('Driver credit not found');
    }

    const newScore = calculateCreditScore(credit.on_time_rate, credit.service_score, credit.violation_count);
    db.prepare(`
      UPDATE driver_credit 
      SET credit_score = ?, updated_at = datetime('now')
      WHERE driver_id = ?
    `).run(newScore, driverId);

    const updated = db.prepare(`
      SELECT dc.*, d.name as driver_name
      FROM driver_credit dc
      JOIN drivers d ON dc.driver_id = d.id
      WHERE dc.driver_id = ?
    `).get(driverId) as any;

    const enriched = {
      ...updated,
      level: getCreditLevel(newScore),
      total_orders: 0,
      completed_orders: 0,
      complaint_count: 0,
    };

    res.success(enriched);
  } catch (error) {
    res.error('Failed to recalculate credit');
  }
};
