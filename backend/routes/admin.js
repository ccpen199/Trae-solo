const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function parseJSONFields(item) {
  if (!item) return item;
  try {
    if (item.menu_config) item.menu_config = JSON.parse(item.menu_config || '{}');
    if (item.options) item.options = JSON.parse(item.options || '[]');
  } catch (e) {}
  return item;
}

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const farmerCount = db.prepare('SELECT COUNT(*) as count FROM farmers').get().count;
    const productCount = db.prepare('SELECT COUNT(*) as count FROM finance_products').get().count;
    const applicationCount = db.prepare('SELECT COUNT(*) as count FROM finance_applications').get().count;
    const pendingApplications = db.prepare("SELECT COUNT(*) as count FROM finance_applications WHERE status = 'pending'").get().count;
    const affairCount = db.prepare('SELECT COUNT(*) as count FROM village_affairs').get().count;
    const voteCount = db.prepare('SELECT COUNT(*) as count FROM votes').get().count;
    const discussionCount = db.prepare('SELECT COUNT(*) as count FROM discussions').get().count;
    const qaCount = db.prepare('SELECT COUNT(*) as count FROM policy_qa').get().count;
    const totalLandArea = db.prepare('SELECT COALESCE(SUM(land_area), 0) as total FROM farmers').get().total;

    const statusBreakdown = db.prepare(
      "SELECT status, COUNT(*) as count FROM finance_applications GROUP BY status"
    ).all();

    res.json({
      farmerCount,
      productCount,
      applicationCount,
      pendingApplications,
      affairCount,
      voteCount,
      discussionCount,
      qaCount,
      totalLandArea,
      applicationStatus: statusBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/farmers/stats', authMiddleware, (req, res) => {
  try {
    const villageStats = db.prepare(
      `SELECT village, COUNT(*) as farmer_count,
       COALESCE(SUM(land_area), 0) as total_land_area,
       AVG(land_area) as avg_land_area
       FROM farmers
       GROUP BY village
       ORDER BY farmer_count DESC`
    ).all();

    const ocrStats = db.prepare(
      "SELECT ocr_status, COUNT(*) as count FROM farmers GROUP BY ocr_status"
    ).all();

    res.json({ villageStats, ocrStats });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/industry-heatmap', authMiddleware, (req, res) => {
  try {
    const allFarmers = db.prepare('SELECT planting_tags, breeding_tags, village FROM farmers').all();

    const plantingCounts = {};
    const breedingCounts = {};
    const villageIndustry = {};

    for (const f of allFarmers) {
      let planting = [];
      let breeding = [];
      try {
        planting = JSON.parse(f.planting_tags || '[]');
        breeding = JSON.parse(f.breeding_tags || '[]');
      } catch (e) {}

      for (const p of planting) {
        plantingCounts[p] = (plantingCounts[p] || 0) + 1;
      }
      for (const b of breeding) {
        breedingCounts[b] = (breedingCounts[b] || 0) + 1;
      }

      if (!villageIndustry[f.village]) {
        villageIndustry[f.village] = { planting: {}, breeding: {}, total: 0 };
      }
      for (const p of planting) {
        villageIndustry[f.village].planting[p] = (villageIndustry[f.village].planting[p] || 0) + 1;
      }
      for (const b of breeding) {
        villageIndustry[f.village].breeding[b] = (villageIndustry[f.village].breeding[b] || 0) + 1;
      }
      villageIndustry[f.village].total++;
    }

    const heatmapData = [];
    for (const village in villageIndustry) {
      const vi = villageIndustry[village];
      heatmapData.push({
        village,
        farmer_count: vi.total,
        top_planting: Object.entries(vi.planting)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count })),
        top_breeding: Object.entries(vi.breeding)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count })),
      });
    }

    res.json({
      planting_distribution: Object.entries(plantingCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      breeding_distribution: Object.entries(breedingCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      village_heatmap: heatmapData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/service-menus', authMiddleware, (req, res) => {
  try {
    const town = req.query.town || '青山镇';
    const menus = db.prepare(
      'SELECT * FROM service_menus WHERE town = ? ORDER BY updated_at DESC'
    ).all(town).map(parseJSONFields);

    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.put('/service-menus/:id', authMiddleware, (req, res) => {
  try {
    const { town, menu_config } = req.body;
    const menu = db.prepare('SELECT * FROM service_menus WHERE id = ?').get(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: '服务菜单不存在', code: 404 });
    }

    db.prepare(
      `UPDATE service_menus SET town = COALESCE(?, town),
       menu_config = COALESCE(?, menu_config),
       updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      town || null,
      menu_config ? JSON.stringify(menu_config) : null,
      req.params.id
    );

    res.json({ message: '服务菜单更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/content-review', authMiddleware, (req, res) => {
  try {
    const type = req.query.type;
    const items = [];

    const affairs = db.prepare("SELECT id, type, title, content, publisher, created_at FROM village_affairs WHERE status = 'draft'").all();
    for (const a of affairs) {
      if (!type || a.type === type) {
        items.push({
          id: a.id,
          content_type: 'affair',
          type: a.type,
          title: a.title,
          content: a.content,
          publisher: a.publisher,
          created_at: a.created_at,
        });
      }
    }

    const discussions = db.prepare("SELECT id, title, content, author, created_at FROM discussions WHERE type = 'discussion'").all();
    for (const d of discussions) {
      if (!type || type === 'discussion') {
        items.push({
          id: d.id,
          content_type: 'discussion',
          type: 'discussion',
          title: d.title,
          content: d.content,
          publisher: d.author,
          created_at: d.created_at,
        });
      }
    }

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.put('/content-review/:id', authMiddleware, (req, res) => {
  try {
    const { action, content_type } = req.body;
    if (!action || !content_type) {
      return res.status(400).json({ error: '操作类型和内容类型不能为空', code: 400 });
    }

    if (content_type === 'affair') {
      const affair = db.prepare('SELECT * FROM village_affairs WHERE id = ?').get(req.params.id);
      if (!affair) {
        return res.status(404).json({ error: '内容不存在', code: 404 });
      }
      if (action === 'approve') {
        db.prepare("UPDATE village_affairs SET status = 'published', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
        res.json({ message: '内容已发布' });
      } else if (action === 'reject') {
        db.prepare("UPDATE village_affairs SET status = 'archived', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
        res.json({ message: '内容已归档' });
      } else {
        res.status(400).json({ error: '无效的操作', code: 400 });
      }
    } else if (content_type === 'discussion') {
      const discussion = db.prepare('SELECT * FROM discussions WHERE id = ?').get(req.params.id);
      if (!discussion) {
        return res.status(404).json({ error: '内容不存在', code: 404 });
      }
      if (action === 'approve') {
        res.json({ message: '讨论内容已审核通过' });
      } else if (action === 'reject') {
        db.prepare('DELETE FROM discussion_replies WHERE discussion_id = ?').run(req.params.id);
        db.prepare('DELETE FROM discussions WHERE id = ?').run(req.params.id);
        res.json({ message: '讨论内容已删除' });
      } else {
        res.status(400).json({ error: '无效的操作', code: 400 });
      }
    } else {
      res.status(400).json({ error: '无效的内容类型', code: 400 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/payments', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status;

    let sql = `SELECT p.*, f.name as farmer_name, f.phone as farmer_phone
               FROM payments p
               LEFT JOIN farmers f ON p.farmer_id = f.id
               WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const payments = db.prepare(sql).all(...params);

    const countSql = 'SELECT COUNT(*) as total FROM payments p WHERE 1=1';
    const countParams = params.slice(0, -2);
    const { total } = db.prepare(countSql).all(...countParams)[0];

    res.json({ data: payments, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/payments/initiate', authMiddleware, (req, res) => {
  try {
    const { farmer_id, amount, channel } = req.body;
    if (!farmer_id || !amount || !channel) {
      return res.status(400).json({ error: '农户ID、金额和支付渠道不能为空', code: 400 });
    }

    const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmer_id);
    if (!farmer) {
      return res.status(404).json({ error: '农户不存在', code: 404 });
    }

    if (!['unionpay', 'abc'].includes(channel)) {
      return res.status(400).json({ error: '无效的支付渠道', code: 400 });
    }

    const orderNo = 'PAY' + Date.now() + String(Math.floor(1000 + Math.random() * 9000));

    const result = db.prepare(
      `INSERT INTO payments (farmer_id, amount, channel, status, order_no)
       VALUES (?, ?, ?, 'pending', ?)`
    ).run(farmer_id, amount, channel, orderNo);

    setTimeout(() => {
      db.prepare("UPDATE payments SET status = 'completed' WHERE id = ?").run(result.lastInsertRowid);
    }, 2000);

    res.json({
      id: result.lastInsertRowid,
      order_no: orderNo,
      status: 'pending',
      message: '支付已发起，正在处理中',
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

module.exports = router;
