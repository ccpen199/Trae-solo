import { getDb } from '../db/database';
import { Settlement } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

export const settlementService = {
  createSettlement(sessionId: string): Settlement {
    const db = getDb();
    const session = db.prepare('SELECT * FROM charging_sessions WHERE id = ?').get(sessionId) as any;
    if (!session) throw new Error('充电会话不存在');

    const station = db.prepare('SELECT * FROM charging_stations WHERE id = ?').get(session.station_id) as any;
    const operator = db.prepare('SELECT * FROM operators WHERE id = ?').get(station.operator_id) as any;

    const totalAmount = session.amount;
    const platformFeeRate = 0.1;
    const platformFee = totalAmount * platformFeeRate;
    const operatorShare = totalAmount - platformFee;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO settlements (id, session_id, station_id, operator_id, total_amount, platform_fee, operator_share)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, sessionId, session.station_id, station.operator_id, totalAmount, platformFee, operatorShare);

    return this.getSettlementById(id)!;
  },

  getSettlementById(id: string): Settlement | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM settlements WHERE id = ?').get(id) as Settlement | undefined;
  },

  getSettlementsByOperator(operatorId: string, startDate?: string, endDate?: string): Settlement[] {
    const db = getDb();
    let query = 'SELECT * FROM settlements WHERE operator_id = ?';
    const params: any[] = [operatorId];

    if (startDate) {
      query += ' AND settle_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND settle_time <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY settle_time DESC';
    return db.prepare(query).all(...params) as Settlement[];
  },

  getOperatorSettlementSummary(operatorId: string) {
    const db = getDb();
    return db.prepare(`
      SELECT
        COUNT(*) as total_settlements,
        SUM(total_amount) as total_amount,
        SUM(platform_fee) as total_platform_fee,
        SUM(operator_share) as total_operator_share,
        DATE(settle_time) as settle_date
      FROM settlements
      WHERE operator_id = ?
      GROUP BY DATE(settle_time)
      ORDER BY settle_date DESC
      LIMIT 30
    `).all(operatorId);
  },

  getSettlementStatsByDate(date: string) {
    const db = getDb();
    return db.prepare(`
      SELECT
        COUNT(*) as settle_count,
        SUM(total_amount) as total_amount,
        SUM(platform_fee) as total_platform_fee,
        SUM(operator_share) as total_operator_share
      FROM settlements
      WHERE DATE(settle_time) = ?
    `).get(date);
  },
};
