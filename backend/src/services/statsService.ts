import { getDb } from '../db/database';
import dayjs from 'dayjs';

export const statsService = {
  getCityHeatMapData(date?: string) {
    const db = getDb();
    const targetDate = date || dayjs().format('YYYY-MM-DD');

    const result = db.prepare(`
      SELECT
        s.city,
        s.province,
        COUNT(DISTINCT s.id) as station_count,
        COUNT(p.id) as total_piles,
        SUM(CASE WHEN p.status = 'charging' THEN 1 ELSE 0 END) as charging_piles,
        AVG(CASE WHEN p.status = 'charging' THEN 1.0
                 WHEN p.status = 'available' THEN 0.0
                 ELSE 0.5 END) as occupancy_rate,
        AVG(s.rating) as avg_rating
      FROM charging_stations s
      LEFT JOIN charging_piles p ON s.id = p.station_id
      GROUP BY s.city, s.province
      ORDER BY occupancy_rate DESC
    `).all();

    return result;
  },

  getFailureRateRanking(limit: number = 10) {
    const db = getDb();
    return db.prepare(`
      SELECT
        s.id as station_id,
        s.name as station_name,
        s.city,
        COUNT(p.id) as total_piles,
        SUM(CASE WHEN p.status = 'fault' THEN 1 ELSE 0 END) as fault_piles,
        ROUND(SUM(CASE WHEN p.status = 'fault' THEN 1 ELSE 0 END) * 100.0 / COUNT(p.id), 2) as failure_rate
      FROM charging_stations s
      JOIN charging_piles p ON s.id = p.station_id
      GROUP BY s.id
      HAVING total_piles > 0
      ORDER BY failure_rate DESC
      LIMIT ?
    `).all(limit);
  },

  getCityFailureRateRanking(limit: number = 10) {
    const db = getDb();
    return db.prepare(`
      SELECT
        s.city,
        COUNT(p.id) as total_piles,
        SUM(CASE WHEN p.status = 'fault' THEN 1 ELSE 0 END) as fault_piles,
        ROUND(SUM(CASE WHEN p.status = 'fault' THEN 1 ELSE 0 END) * 100.0 / COUNT(p.id), 2) as failure_rate
      FROM charging_stations s
      JOIN charging_piles p ON s.id = p.station_id
      GROUP BY s.city
      ORDER BY failure_rate DESC
      LIMIT ?
    `).all(limit);
  },

  getRechargeFunnel(userId?: string) {
    const db = getDb();

    const stages = [
      { name: '注册用户', value: 0 },
      { name: '首次充电', value: 0 },
      { name: '二次充电', value: 0 },
      { name: '月度活跃', value: 0 },
      { name: '高价值用户', value: 0 },
    ];

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    stages[0].value = totalUsers.count;

    const usersWithCharges = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM charging_sessions
    `).get() as { count: number };
    stages[1].value = usersWithCharges.count;

    const usersWithMultiple = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id, COUNT(*) as charge_count
        FROM charging_sessions
        GROUP BY user_id
        HAVING charge_count >= 2
      )
    `).get() as { count: number };
    stages[2].value = usersWithMultiple.count;

    const monthlyActive = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM charging_sessions
      WHERE start_time >= DATE('now', '-30 days')
    `).get() as { count: number };
    stages[3].value = monthlyActive.count;

    const highValue = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id, SUM(amount) as total_amount
        FROM charging_sessions
        GROUP BY user_id
        HAVING total_amount >= 500
      )
    `).get() as { count: number };
    stages[4].value = highValue.count;

    return stages;
  },

  getDailyStats(days: number = 7) {
    const db = getDb();
    return db.prepare(`
      SELECT
        DATE(start_time) as date,
        COUNT(*) as total_charges,
        SUM(energy_charged) as total_energy,
        SUM(amount) as total_amount,
        AVG(energy_charged) as avg_energy,
        AVG(amount) as avg_amount
      FROM charging_sessions
      WHERE start_time >= DATE('now', '-' || ? || ' days') AND status != 'failed'
      GROUP BY DATE(start_time)
      ORDER BY date
    `).all(days);
  },

  getHourlyDistribution() {
    const db = getDb();
    return db.prepare(`
      SELECT
        CAST(strftime('%H', start_time) as INTEGER) as hour,
        COUNT(*) as charge_count,
        SUM(energy_charged) as total_energy
      FROM charging_sessions
      WHERE status != 'failed'
      GROUP BY hour
      ORDER BY hour
    `).all();
  },

  generateNationalReport() {
    const db = getDb();

    const summary = db.prepare(`
      SELECT
        COUNT(DISTINCT s.id) as total_stations,
        COUNT(DISTINCT s.city) as covered_cities,
        COUNT(p.id) as total_piles,
        SUM(CASE WHEN p.status = 'available' THEN 1 ELSE 0 END) as available_piles,
        SUM(CASE WHEN p.status = 'charging' THEN 1 ELSE 0 END) as charging_piles,
        SUM(CASE WHEN p.status = 'fault' THEN 1 ELSE 0 END) as fault_piles
      FROM charging_stations s
      LEFT JOIN charging_piles p ON s.id = p.station_id
    `).get();

    const todayStats = db.prepare(`
      SELECT
        COUNT(*) as today_charges,
        COALESCE(SUM(energy_charged), 0) as today_energy,
        COALESCE(SUM(amount), 0) as today_amount
      FROM charging_sessions
      WHERE DATE(start_time) = DATE('now')
    `).get();

    return {
      ...summary,
      ...todayStats,
      report_time: new Date().toISOString(),
      report_period: 'daily',
    };
  },
};
