import { getDb } from '../db/database';
import { ChargingStation, ChargingPile } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

export const stationService = {
  getAllStations(city?: string): ChargingStation[] {
    const db = getDb();
    let query = 'SELECT * FROM charging_stations';
    const params: any[] = [];
    if (city) {
      query += ' WHERE city = ?';
      params.push(city);
    }
    return db.prepare(query).all(...params) as ChargingStation[];
  },

  getStationById(id: string): ChargingStation | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM charging_stations WHERE id = ?').get(id) as ChargingStation | undefined;
  },

  getPilesByStationId(stationId: string): ChargingPile[] {
    const db = getDb();
    return db.prepare('SELECT * FROM charging_piles WHERE station_id = ?').all(stationId) as ChargingPile[];
  },

  getPileById(id: string): ChargingPile | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM charging_piles WHERE id = ?').get(id) as ChargingPile | undefined;
  },

  getPileByCode(pileCode: string): ChargingPile | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM charging_piles WHERE pile_code = ?').get(pileCode) as ChargingPile | undefined;
  },

  updatePileStatus(pileId: string, status: string, currentPower?: number) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE charging_piles
      SET status = ?, current_power = COALESCE(?, current_power), last_heartbeat = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(status, currentPower ?? null, pileId);

    const pile = this.getPileById(pileId);
    if (pile) {
      this.updateStationAvailableCount(pile.station_id);
    }
  },

  updateStationAvailableCount(stationId: string) {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as available FROM charging_piles
      WHERE station_id = ? AND status = 'available'
    `).get(stationId) as { available: number };

    const total = db.prepare(`
      SELECT COUNT(*) as total FROM charging_piles WHERE station_id = ?
    `).get(stationId) as { total: number };

    db.prepare(`
      UPDATE charging_stations
      SET total_piles = ?, available_piles = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(total.total, result.available, stationId);
  },

  getCities(): string[] {
    const db = getDb();
    const rows = db.prepare('SELECT DISTINCT city FROM charging_stations ORDER BY city').all() as { city: string }[];
    return rows.map(r => r.city);
  },

  getCityStats() {
    const db = getDb();
    return db.prepare(`
      SELECT
        s.city,
        COUNT(DISTINCT s.id) as station_count,
        COUNT(p.id) as pile_count,
        SUM(CASE WHEN p.status = 'available' THEN 1 ELSE 0 END) as available_count,
        AVG(s.rating) as avg_rating
      FROM charging_stations s
      LEFT JOIN charging_piles p ON s.id = p.station_id
      GROUP BY s.city
      ORDER BY station_count DESC
    `).all();
  },
};
