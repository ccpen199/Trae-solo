import express from 'express';
import db from '../db/index.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { city, specialty, page = 1, pageSize = 20 } = req.query;

    let sql = `
      SELECT a.*, u.real_name, u.phone, u.email, u.avatar
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'approved'
    `;
    const params: any[] = [];

    if (city) {
      sql += ' AND a.specialty LIKE ?';
      params.push(`%${city}%`);
    }
    if (specialty) {
      sql += ' AND a.specialty LIKE ?';
      params.push(`%${specialty}%`);
    }

    const countSql = sql.replace('SELECT a.*, u.real_name, u.phone, u.email, u.avatar', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countSql).get(...params) as { total: number };

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    sql += ' ORDER BY a.total_deals DESC LIMIT ? OFFSET ?';
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

router.get('/:id', (req, res) => {
  try {
    const agent = db.prepare(`
      SELECT a.*, u.real_name, u.phone, u.email, u.avatar
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!agent) {
      return res.status(404).json({ success: false, error: '经纪人不存在' });
    }

    const reviews = db.prepare(`
      SELECT r.*, u.real_name, p.title
      FROM agent_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN properties p ON r.property_id = p.id
      WHERE r.agent_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(req.params.id);

    const properties = db.prepare(`
      SELECT * FROM properties
      WHERE agent_id = ? AND status = 'active' AND verify_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.params.id);

    const riskControls = db.prepare(`
      SELECT * FROM agent_risk_controls WHERE agent_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        agent,
        reviews,
        properties,
        risk_controls: riskControls
      }
    });
  } catch (error) {
    console.error('Get agent detail error:', error);
    res.status(500).json({ success: false, error: '获取经纪人详情失败' });
  }
});

router.get('/:id/credit', (req, res) => {
  try {
    const agent = db.prepare(`
      SELECT a.*, u.real_name, u.phone, u.email
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(req.params.id) as any;

    if (!agent) {
      return res.status(404).json({ success: false, error: '经纪人不存在' });
    }

    const conversionRate = (agent.conversion_rate as number) / 100;
    const averageRating = (agent.average_rating as number);
    const reviewCount = (agent.review_count as number);
    const creditScore = (agent.credit_score as number);

    const creditWeight = (conversionRate * 0.4 + averageRating / 5 * 0.3 + reviewCount / 100 * 0.2 + creditScore / 100 * 0.1) * 100;

    const reviews = db.prepare(`
      SELECT r.*, u.real_name, p.title
      FROM agent_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN properties p ON r.property_id = p.id
      WHERE r.agent_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    const riskControls = db.prepare(`
      SELECT * FROM agent_risk_controls WHERE agent_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          real_name: agent.real_name,
          agency_name: (agent as any).agency_name,
          credit_score: creditScore,
          conversion_rate: agent.conversion_rate,
          average_rating: averageRating,
          review_count: reviewCount,
          total_deals: agent.total_deals
        },
        credit_weight: Math.round(creditWeight * 100) / 100,
        credit_weight_formula: {
          conversion_rate_weight: Math.round(conversionRate * 0.4 * 100 * 100) / 100,
          rating_weight: Math.round(averageRating / 5 * 0.3 * 100 * 100) / 100,
          review_weight: Math.round(reviewCount / 100 * 0.2 * 100 * 100) / 100,
          credit_score_weight: Math.round(creditScore / 100 * 0.1 * 100 * 100) / 100
        },
        reviews,
        risk_controls: riskControls
      }
    });
  } catch (error) {
    console.error('Get agent credit error:', error);
    res.status(500).json({ success: false, error: '获取信用档案失败' });
  }
});

export default router;
