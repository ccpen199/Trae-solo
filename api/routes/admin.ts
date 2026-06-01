import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'real_estate_platform_secret_key_2024';

const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未登录' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: '无权限访问' });
    }
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期' });
  }
};

router.get('/dashboard', authenticateAdmin, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties WHERE status = ?').get('active') as { count: number };
    const totalAgents = db.prepare('SELECT COUNT(*) as count FROM agents WHERE status = ?').get('approved') as { count: number };
    const pendingVerifications = db.prepare('SELECT COUNT(*) as count FROM properties WHERE verify_status = ?').get('pending') as { count: number };
    const pendingAppeals = db.prepare('SELECT COUNT(*) as count FROM appeals WHERE status = ?').get('pending') as { count: number };

    const recentProperties = db.prepare(`
      SELECT p.*, u.real_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    const pendingInspections = db.prepare('SELECT COUNT(*) as count FROM property_inspections WHERE status = ?').get('pending') as { count: number };
    const totalInspections = db.prepare('SELECT COUNT(*) as count FROM property_inspections').get() as { count: number };
    const pendingRiskControls = db.prepare('SELECT COUNT(*) as count FROM agent_risk_controls WHERE status = ?').get('pending') as { count: number };
    const totalRiskControls = db.prepare('SELECT COUNT(*) as count FROM agent_risk_controls').get() as { count: number };

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers.count,
          totalProperties: totalProperties.count,
          totalAgents: totalAgents.count,
          pendingVerifications: pendingVerifications.count,
          pendingAppeals: pendingAppeals.count
        },
        inspectionStats: {
          total: totalInspections.count,
          pending: pendingInspections.count
        },
        riskControlStats: {
          total: totalRiskControls.count,
          pending: pendingRiskControls.count
        },
        recentProperties
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: '获取数据失败' });
  }
});

router.get('/properties', authenticateAdmin, (req, res) => {
  try {
    const { verifyStatus, page = 1, pageSize = 20 } = req.query;

    let sql = `
      SELECT p.*, u.real_name as owner_name, a.agency_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN agents a ON p.agent_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (verifyStatus) {
      sql += ' AND p.verify_status = ?';
      params.push(verifyStatus);
    }

    const countSql = sql.replace('SELECT p.*, u.real_name as owner_name, a.agency_name', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countSql).get(...params) as { total: number };

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize as string), offset);

    const properties = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: {
        list: properties,
        total: totalResult.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string)
      }
    });
  } catch (error) {
    console.error('Admin properties error:', error);
    res.status(500).json({ success: false, error: '获取房源列表失败' });
  }
});

router.post('/properties/:id/verify', authenticateAdmin, (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const { status, reason } = req.body;

    db.prepare(`
      UPDATE properties
      SET verify_status = ?, is_fake = ?, fake_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status,
      status === 'rejected' ? 1 : 0,
      reason || '',
      req.params.id
    );

    if (status === 'approved' || status === 'rejected') {
      const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
      db.prepare(`
        INSERT INTO property_verifications (property_id, final_verdict, verifier_id, verified_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(req.params.id, status, adminId);
    }

    res.json({ success: true, data: { message: '审核完成' } });
  } catch (error) {
    console.error('Verify property error:', error);
    res.status(500).json({ success: false, error: '审核失败' });
  }
});

router.get('/appeals', authenticateAdmin, (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;

    let sql = `
      SELECT a.*, p.title, u.real_name as user_name
      FROM appeals a
      LEFT JOIN properties p ON a.property_id = p.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    const countSql = sql.replace('SELECT a.*, p.title, u.real_name as user_name', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countSql).get(...params) as { total: number };

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize as string), offset);

    const appeals = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: {
        list: appeals,
        total: totalResult.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string)
      }
    });
  } catch (error) {
    console.error('Get appeals error:', error);
    res.status(500).json({ success: false, error: '获取申诉列表失败' });
  }
});

router.post('/appeals/:id/handle', authenticateAdmin, (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const { status, comment } = req.body;

    db.prepare(`
      UPDATE appeals
      SET status = ?, reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, adminId, comment || '', req.params.id);

    if (status === 'approved') {
      const appeal = db.prepare('SELECT property_id FROM appeals WHERE id = ?').get(req.params.id) as any;
      db.prepare(`
        UPDATE properties
        SET verify_status = 'approved', is_fake = 0, fake_reason = '', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(appeal.property_id);
    }

    res.json({ success: true, data: { message: '处理完成' } });
  } catch (error) {
    console.error('Handle appeal error:', error);
    res.status(500).json({ success: false, error: '处理失败' });
  }
});

router.get('/agents', authenticateAdmin, (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;

    let sql = `
      SELECT a.*, u.real_name, u.email, u.phone
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    const countSql = sql.replace('SELECT a.*, u.real_name, u.email, u.phone', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countSql).get(...params) as { total: number };

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize as string), offset);

    const agents = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: {
        list: agents,
        total: totalResult.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string)
      }
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ success: false, error: '获取经纪人列表失败' });
  }
});

router.post('/agents/:id/approve', authenticateAdmin, (req, res) => {
  try {
    db.prepare(`
      UPDATE agents
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    res.json({ success: true, data: { message: '已批准' } });
  } catch (error) {
    console.error('Approve agent error:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

router.get('/inspections', authenticateAdmin, (req, res) => {
  try {
    const inspections = db.prepare(`
      SELECT pi.*, p.title, p.address
      FROM property_inspections pi
      LEFT JOIN properties p ON pi.property_id = p.id
      ORDER BY pi.created_at DESC
      LIMIT 50
    `).all();

    res.json({ success: true, data: inspections });
  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({ success: false, error: '获取巡检记录失败' });
  }
});

router.get('/risk-controls', authenticateAdmin, (req, res) => {
  try {
    const risks = db.prepare(`
      SELECT arc.*, u.real_name as agent_name
      FROM agent_risk_controls arc
      LEFT JOIN agents a ON arc.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY arc.created_at DESC
      LIMIT 50
    `).all();

    res.json({ success: true, data: risks });
  } catch (error) {
    console.error('Get risk controls error:', error);
    res.status(500).json({ success: false, error: '获取风控记录失败' });
  }
});

router.post('/inspections/:id/handle', authenticateAdmin, (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const { status, quality_score, issues, suggestions } = req.body;

    const inspection = db.prepare('SELECT * FROM property_inspections WHERE id = ?').get(req.params.id) as any;
    if (!inspection) {
      return res.status(404).json({ success: false, error: '巡检记录不存在' });
    }

    db.prepare(`
      UPDATE property_inspections
      SET status = ?, inspector_id = ?, quality_score = ?, issues = ?, suggestions = ?, inspected_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, adminId, quality_score || null, issues || '', suggestions || '', req.params.id);

    res.json({ success: true, data: { message: '巡检处理完成' } });
  } catch (error) {
    console.error('Handle inspection error:', error);
    res.status(500).json({ success: false, error: '处理巡检失败' });
  }
});

router.post('/risk-controls/:id/handle', authenticateAdmin, (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const { status, description } = req.body;

    const riskControl = db.prepare('SELECT * FROM agent_risk_controls WHERE id = ?').get(req.params.id) as any;
    if (!riskControl) {
      return res.status(404).json({ success: false, error: '风控记录不存在' });
    }

    db.prepare(`
      UPDATE agent_risk_controls
      SET status = ?, handler_id = ?, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, adminId, req.params.id);

    if (status === 'confirmed') {
      const agent = db.prepare('SELECT credit_score FROM agents WHERE id = ?').get((riskControl as any).agent_id) as any;
      if (agent) {
        const newScore = Math.max(0, (agent as any).credit_score - 10);
        db.prepare('UPDATE agents SET credit_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(newScore, (riskControl as any).agent_id);
      }
    }

    res.json({ success: true, data: { message: '风控处理完成' } });
  } catch (error) {
    console.error('Handle risk control error:', error);
    res.status(500).json({ success: false, error: '处理风控失败' });
  }
});

router.get('/heatmap/generate', authenticateAdmin, (req, res) => {
  try {
    const { city } = req.query;

    const districts = db.prepare(`
      SELECT district, COUNT(*) as property_count, AVG(price) as avg_price,
             SUM(view_count) as total_views
      FROM properties
      WHERE status = 'active' AND verify_status = 'approved' AND city = ?
      GROUP BY district
    `).all(city || '北京') as any[];

    const today = new Date().toISOString().split('T')[0];

    const heatmapData = districts.map((d: any) => {
      const inquiryCount = db.prepare(`
        SELECT COUNT(*) as count FROM inquiries i
        LEFT JOIN properties p ON i.property_id = p.id
        WHERE p.district = ? AND p.city = ?
      `).get(d.district, city || '北京') as { count: number };

      const dealCount = db.prepare(`
        SELECT COUNT(*) as count FROM properties
        WHERE district = ? AND city = ? AND status = 'active' AND verify_status = 'approved'
      `).get(d.district, city || '北京') as { count: number };

      const heatScore = Math.min(100,
        (d.property_count / 50 * 30) +
        (inquiryCount.count / 100 * 30) +
        (dealCount.count / 50 * 20) +
        (d.avg_price / 100000 * 20)
      );

      return {
        city: city || '北京',
        district: d.district,
        region_name: d.district,
        heat_score: Math.round(heatScore * 10) / 10,
        view_count: d.total_views || 0,
        inquiry_count: inquiryCount.count,
        deal_count: dealCount.count,
        avg_price: Math.round(d.avg_price),
        stat_date: today
      };
    });

    res.json({ success: true, data: heatmapData });
  } catch (error) {
    console.error('Generate heatmap error:', error);
    res.status(500).json({ success: false, error: '生成热力图数据失败' });
  }
});

export default router;
