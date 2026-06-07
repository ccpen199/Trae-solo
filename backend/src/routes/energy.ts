import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { startDate, endDate, page = '1', pageSize = '10' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let countSql = 'SELECT COUNT(*) as total FROM energy_consumption WHERE user_id = ?';
    let listSql = 'SELECT * FROM energy_consumption WHERE user_id = ?';
    const params: any[] = [req.user!.id];

    if (startDate) { countSql += ' AND date >= ?'; listSql += ' AND date >= ?'; params.push(startDate); }
    if (endDate) { countSql += ' AND date <= ?'; listSql += ' AND date <= ?'; params.push(endDate); }

    listSql += ' ORDER BY date DESC LIMIT ? OFFSET ?';

    const total = (db.prepare(countSql).get(...params) as any).total;
    const records = db.prepare(listSql).all(...params, Number(pageSize), offset);

    const summarySql = 'SELECT SUM(kwh) as total_kwh, SUM(cost) as total_cost FROM energy_consumption WHERE user_id = ?' + (startDate ? ' AND date >= ?' : '') + (endDate ? ' AND date <= ?' : '');
    const summary = db.prepare(summarySql).get(...params) as any;

    res.json({
      success: true,
      data: {
        list: records,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        summary: { total_kwh: summary?.total_kwh || 0, total_cost: summary?.total_cost || 0 }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { device_id, date, kwh, cost } = req.body;
    if (!device_id || !date || !kwh) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const calculatedCost = cost || Number((kwh * 0.56).toFixed(2));

    const result = db.prepare(
      'INSERT INTO energy_consumption (device_id, user_id, date, kwh, cost) VALUES (?, ?, ?, ?, ?)'
    ).run(device_id, req.user!.id, date, kwh, calculatedCost);

    const record = db.prepare('SELECT * FROM energy_consumption WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/report', authMiddleware, (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate: string;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }

    const endDate = now.toISOString().split('T')[0];

    const totalConsumption = db.prepare(
      'SELECT SUM(kwh) as total_kwh, SUM(cost) as total_cost FROM energy_consumption WHERE user_id = ? AND date >= ? AND date <= ?'
    ).get(req.user!.id, startDate, endDate) as any;

    const deviceBreakdown = db.prepare(
      'SELECT d.name, d.type, SUM(e.kwh) as total_kwh, SUM(e.cost) as total_cost FROM energy_consumption e JOIN devices d ON e.device_id = d.id WHERE e.user_id = ? AND e.date >= ? AND e.date <= ? GROUP BY e.device_id ORDER BY total_kwh DESC'
    ).all(req.user!.id, startDate, endDate) as any[];

    const previousPeriodStart = period === 'week'
      ? new Date(new Date(startDate).getTime() - 7 * 86400000).toISOString().split('T')[0]
      : period === 'year'
        ? new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
        : new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];

    const previousConsumption = db.prepare(
      'SELECT SUM(kwh) as total_kwh FROM energy_consumption WHERE user_id = ? AND date >= ? AND date < ?'
    ).get(req.user!.id, previousPeriodStart, startDate) as any;

    const currentKwh = totalConsumption?.total_kwh || 0;
    const previousKwh = previousConsumption?.total_kwh || 0;
    const savedKwh = Math.max(0, previousKwh - currentKwh);
    const savedPercentage = previousKwh > 0 ? Math.round((savedKwh / previousKwh) * 100) : 0;

    const report = {
      period,
      startDate,
      endDate,
      total_kwh: currentKwh,
      total_cost: totalConsumption?.total_cost || 0,
      saved_kwh: savedKwh,
      saved_percentage: savedPercentage,
      device_breakdown: deviceBreakdown,
      green_score: Math.min(100, 60 + savedPercentage),
      recommendation: currentKwh > 200 ? '建议减少空调使用时长，可节省约15%电量' : '您的用电表现良好，继续保持！'
    };

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/green-report', authMiddleware, (req: Request, res: Response) => {
  try {
    let report = db.prepare('SELECT * FROM green_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user!.id) as any;

    if (!report) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = now.toISOString().split('T')[0];

      const consumption = db.prepare(
        'SELECT SUM(kwh) as total_kwh FROM energy_consumption WHERE user_id = ? AND date >= ? AND date <= ?'
      ).get(req.user!.id, monthStart, monthEnd) as any;

      const totalKwh = consumption?.total_kwh || 0;
      const savedKwh = Math.max(0, 50 - totalKwh * 0.1);
      const pointsEarned = Math.round(savedKwh * 10);

      const reportData = JSON.stringify({
        carbon_reduction: (savedKwh * 0.785).toFixed(2),
        equivalent_trees: Math.round(savedKwh * 0.785 / 18.3 * 100) / 100,
        tips: ['空调温度设置26°C最节能', '洗衣机选择低温模式', '冰箱保持7分满最省电']
      });

      const result = db.prepare(
        'INSERT INTO green_reports (user_id, period, total_kwh, saved_kwh, points_earned, report_data) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(req.user!.id, monthStart, totalKwh, savedKwh, pointsEarned, reportData);

      report = db.prepare('SELECT * FROM green_reports WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({
      success: true,
      data: {
        ...report,
        report_data: typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
