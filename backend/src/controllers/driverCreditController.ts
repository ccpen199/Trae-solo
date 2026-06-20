import { Request, Response } from 'express';
import db from '../db';

function calculateCreditScore(onTimeRate: number, serviceScore: number, violationCount: number): number {
  const onTimeComponent = onTimeRate * 0.4;
  const serviceComponent = serviceScore * 20 * 0.35;
  const violationComponent = (100 - violationCount * 5) * 0.25;
  return Math.round(onTimeComponent + serviceComponent + violationComponent);
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

export const getDriverCredits = (_req: Request, res: Response) => {
  try {
    const credits = db.prepare(`
      SELECT dc.*, d.name as driver_name 
      FROM driver_credit dc 
      JOIN drivers d ON dc.driver_id = d.id 
      ORDER BY dc.id
    `).all();
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver credits' });
  }
};

export const getDriverCreditByDriverId = (req: Request, res: Response) => {
  try {
    const credit = db.prepare('SELECT * FROM driver_credit WHERE driver_id = ?').get(req.params.driverId);
    if (!credit) {
      return res.status(404).json({ error: 'Driver credit not found' });
    }
    res.json(credit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver credit' });
  }
};

export const getCreditRanking = (_req: Request, res: Response) => {
  try {
    const allCredits = db.prepare(`
      SELECT dc.*, d.name as driver_name, d.vehicle_type, d.vehicle_plate
      FROM driver_credit dc 
      JOIN drivers d ON dc.driver_id = d.id 
      ORDER BY dc.credit_score DESC
    `).all() as any[];

    const rankings = allCredits.map((credit, index) => ({
      ...credit,
      rank: index + 1,
    }));

    res.json(rankings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credit ranking' });
  }
};
