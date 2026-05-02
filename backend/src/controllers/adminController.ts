import { Request, Response } from 'express';
import db from '../config/database';
import { PerformanceEngine } from '../engines/performanceEngine';

export const getDashboard = (req: Request, res: Response): void => {
  try {
    const dashboard = PerformanceEngine.getSiteDashboard();
    res.json(dashboard);
  } catch (error: any) {
    console.error('获取仪表盘数据错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getStatistics = (req: Request, res: Response): void => {
  try {
    const today = PerformanceEngine.getToday();
    
    const totalPackages = db.prepare(`
      SELECT COUNT(*) as count FROM packages WHERE date(created_at) = ?
    `).get(today) as any;

    const signedPackages = db.prepare(`
      SELECT COUNT(*) as count FROM packages 
      WHERE status = 'signed' AND date(sign_time) = ?
    `).get(today) as any;

    const exceptionPackages = db.prepare(`
      SELECT COUNT(*) as count FROM exceptions 
      WHERE status IN ('pending', 'processing')
    `).get() as any;

    const areaStats = db.prepare(`
      SELECT a.id, a.name, a.code,
             COUNT(p.id) as total,
             SUM(CASE WHEN p.status = 'signed' THEN 1 ELSE 0 END) as signed,
             SUM(CASE WHEN p.status = 'exception' THEN 1 ELSE 0 END) as exception
      FROM areas a
      LEFT JOIN packages p ON a.id = p.area_id AND date(p.created_at) = ?
      GROUP BY a.id, a.name, a.code
      ORDER BY a.code
    `).all(today) as any[];

    const courierStats = db.prepare(`
      SELECT u.id, u.name,
             COALESCE(SUM(pr.total_packages), 0) as total,
             COALESCE(SUM(pr.signed_packages), 0) as signed,
             COALESCE(SUM(pr.exception_packages), 0) as exception,
             CASE WHEN COALESCE(SUM(pr.total_packages), 0) > 0
                  THEN ROUND(COALESCE(SUM(pr.signed_packages), 0) * 100.0 / SUM(pr.total_packages), 2)
                  ELSE 0 END as signRate
      FROM users u
      LEFT JOIN performance_records pr ON u.id = pr.courier_id AND pr.date = ?
      WHERE u.role = 'courier'
      GROUP BY u.id, u.name
      ORDER BY u.name
    `).all(today) as any[];

    res.json({
      date: today,
      summary: {
        totalPackages: totalPackages?.count || 0,
        signedPackages: signedPackages?.count || 0,
        exceptionPackages: exceptionPackages?.count || 0
      },
      areaStats,
      courierStats
    });
  } catch (error: any) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getExceptions = (req: Request, res: Response): void => {
  try {
    const { status } = req.query;
    
    let sql = `
      SELECT e.*, p.tracking_number, p.receiver_name, p.receiver_phone,
             u.name as handler_name
      FROM exceptions e
      LEFT JOIN packages p ON e.package_id = p.id
      LEFT JOIN users u ON e.handler_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY e.created_at DESC';

    const exceptions = db.prepare(sql).all(...params) as any[];

    res.json(exceptions.map(e => ({
      id: e.id,
      packageId: e.package_id,
      trackingNumber: e.tracking_number,
      receiverName: e.receiver_name,
      receiverPhone: e.receiver_phone,
      type: e.type,
      reason: e.reason,
      handlerId: e.handler_id,
      handlerName: e.handler_name,
      solution: e.solution,
      status: e.status,
      createdAt: e.created_at,
      updatedAt: e.updated_at
    })));
  } catch (error: any) {
    console.error('获取异常件错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleException = (req: Request, res: Response): void => {
  try {
    const { exceptionId, solution, newStatus } = req.body;
    const operator = req.user!;

    if (!exceptionId) {
      res.status(400).json({ error: '请提供异常记录ID' });
      return;
    }

    const exception = db.prepare(`
      SELECT * FROM exceptions WHERE id = ?
    `).get(exceptionId) as any;

    if (!exception) {
      res.status(404).json({ error: '异常记录不存在' });
      return;
    }

    const now = new Date().toISOString();
    
    let updates = 'handler_id = ?, handler_name = ?, updated_at = ?';
    const params: any[] = [operator.id, operator.name, now];

    if (solution) {
      updates += ', solution = ?';
      params.push(solution);
    }

    if (newStatus) {
      if (!['processing', 'resolved'].includes(newStatus)) {
        res.status(400).json({ error: '状态值无效' });
        return;
      }
      updates += ', status = ?';
      params.push(newStatus);
    }

    params.push(exceptionId);

    db.prepare(`
      UPDATE exceptions SET ${updates} WHERE id = ?
    `).run(...params);

    res.json({ success: true, message: '异常处理已更新' });
  } catch (error: any) {
    console.error('处理异常错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPerformanceReport = (req: Request, res: Response): void => {
  try {
    const { courierId, startDate, endDate } = req.query;

    if (!courierId) {
      res.status(400).json({ error: '请提供快递员ID' });
      return;
    }

    const today = PerformanceEngine.getToday();
    const start = (startDate as string) || today;
    const end = (endDate as string) || today;

    const report = PerformanceEngine.getCourierPerformanceReport(
      courierId as string,
      start,
      end
    );

    res.json(report);
  } catch (error: any) {
    console.error('获取绩效报告错误:', error);
    res.status(500).json({ error: error.message });
  }
};
