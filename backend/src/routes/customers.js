const express = require('express');
const db = require('../models/database');
const auditService = require('../services/auditService');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/tags', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM customer_tags WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY category, name';
    
    const tags = await db.all(sql, params);
    const grouped = {};
    tags.forEach(tag => {
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    
    res.json({ tags, grouped });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: '获取标签失败' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { industry, status, is_sensitive, purchase_intent, lifecycle_stage, followup_status, tag_id, search, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT DISTINCT c.*, 
             (SELECT GROUP_CONCAT(ct.name || '|' || ct.color || '|' || ct.category, ',') 
              FROM customer_profile_tags cpt 
              JOIN customer_tags ct ON cpt.tag_id = ct.id 
              WHERE cpt.customer_id = c.id) as tags_json
      FROM customer_profiles c
    `;
    const params = [];
    const conditions = [];
    const countConditions = [];
    
    if (tag_id) {
      sql += ' JOIN customer_profile_tags cpt ON c.id = cpt.customer_id';
      conditions.push('cpt.tag_id = ?');
      countConditions.push('cpt.tag_id = ?');
      params.push(parseInt(tag_id));
    }
    
    if (search) {
      const searchCond = '(c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ? OR c.position LIKE ?)';
      conditions.push(searchCond);
      countConditions.push(searchCond);
      const searchVal = `%${search}%`;
      params.push(searchVal, searchVal, searchVal, searchVal);
    }
    if (industry) { conditions.push('c.industry = ?'); params.push(industry); }
    if (status) { conditions.push('c.status = ?'); params.push(status); }
    if (is_sensitive !== undefined && is_sensitive !== '') { 
      conditions.push('c.is_sensitive = ?'); 
      params.push(is_sensitive === 'true' ? 1 : 0); 
    }
    if (purchase_intent) { conditions.push('c.purchase_intent = ?'); params.push(purchase_intent); }
    if (lifecycle_stage) { conditions.push('c.lifecycle_stage = ?'); params.push(lifecycle_stage); }
    if (followup_status) { conditions.push('c.followup_status = ?'); params.push(followup_status); }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countSql = tag_id 
      ? `SELECT COUNT(DISTINCT c.id) as count FROM customer_profiles c JOIN customer_profile_tags cpt ON c.id = cpt.customer_id ${countConditions.length > 0 ? 'WHERE ' + countConditions.join(' AND ') : ''}`
      : `SELECT COUNT(*) as count FROM customer_profiles c ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`;
    
    sql += ' ORDER BY c.score DESC, c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const customers = await db.all(sql, params);
    const total = await db.get(countSql, tag_id ? params.slice(0, -2) : params.slice(0, -2));
    
    const result = customers.map(c => ({
      ...c,
      tags: c.tags_json ? c.tags_json.split(',').map(t => {
        const [name, color, category] = t.split('|');
        return { name, color, category };
      }) : []
    }));
    
    res.json({ data: result, total: total.count });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await db.get('SELECT * FROM customer_profiles WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    
    const tags = await db.all(`
      SELECT ct.* FROM customer_profile_tags cpt 
      JOIN customer_tags ct ON cpt.tag_id = ct.id 
      WHERE cpt.customer_id = ?
    `, [req.params.id]);
    
    res.json({ ...customer, tags });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: '获取客户详情失败' });
  }
});

router.post('/:id/tags', async (req, res) => {
  try {
    const { tag_ids } = req.body;
    const customerId = parseInt(req.params.id);
    
    await db.run('DELETE FROM customer_profile_tags WHERE customer_id = ?', [customerId]);
    
    for (const tagId of tag_ids) {
      await db.run(
        'INSERT OR IGNORE INTO customer_profile_tags (customer_id, tag_id, tagged_by) VALUES (?, ?, ?)',
        [customerId, tagId, req.user.id]
      );
    }
    
    await auditService.logAction(
      'update_tags',
      'customer_profile',
      customerId,
      req.user.id,
      '更新客户标签',
      null,
      { tag_ids },
      null,
      '在客户详情页重新编辑标签'
    );
    
    res.json({ message: '标签更新成功' });
  } catch (error) {
    console.error('Update tags error:', error);
    res.status(500).json({ error: '更新标签失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, company_website, position, industry, company_size, region, decision_maker_level, purchase_intent, lifecycle_stage, followup_status, budget_range, expected_purchase_date, source_channel, pain_points, interests, objections, key_requirements, competitor_used, internal_notes, is_sensitive } = req.body;
    
    const result = await db.run(
      `INSERT INTO customer_profiles (
        name, email, phone, company, company_website, position, industry, company_size, region,
        decision_maker_level, purchase_intent, lifecycle_stage, followup_status, budget_range,
        expected_purchase_date, source_channel, pain_points, interests, objections, key_requirements,
        competitor_used, internal_notes, is_sensitive, created_by, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, company, company_website, position, industry, company_size, region,
       decision_maker_level, purchase_intent, lifecycle_stage, followup_status, budget_range,
       expected_purchase_date, source_channel, pain_points, interests, objections, key_requirements,
       competitor_used, internal_notes, is_sensitive ? 1 : 0, req.user.id, req.user.id]
    );

    await auditService.logAction(
      'create',
      'customer_profile',
      result.lastID,
      req.user.id,
      '创建新客户档案',
      null,
      { name, email, company },
      null,
      '通过客户列表页面删除并重新创建'
    );

    res.json({ id: result.lastID, message: '客户创建成功' });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: '创建客户失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const oldCustomer = await db.get('SELECT * FROM customer_profiles WHERE id = ?', [req.params.id]);
    if (!oldCustomer) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const fields = [
      'name', 'email', 'phone', 'company', 'company_website', 'position', 'industry', 'company_size', 'region',
      'decision_maker_level', 'purchase_intent', 'lifecycle_stage', 'followup_status', 'budget_range',
      'expected_purchase_date', 'source_channel', 'pain_points', 'interests', 'objections', 'key_requirements',
      'competitor_used', 'internal_notes', 'status', 'is_sensitive'
    ];
    
    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(field === 'is_sensitive' ? (req.body[field] ? 1 : 0) : req.body[field]);
      }
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(req.params.id));
    
    await db.run(`UPDATE customer_profiles SET ${updates.join(', ')} WHERE id = ?`, values);

    await auditService.logAction(
      'update',
      'customer_profile',
      req.params.id,
      req.user.id,
      '更新客户档案',
      { name: oldCustomer.name, status: oldCustomer.status, purchase_intent: oldCustomer.purchase_intent },
      { name: req.body.name, status: req.body.status, purchase_intent: req.body.purchase_intent },
      null,
      '通过审计日志查看历史版本'
    );

    res.json({ message: '客户更新成功' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: '更新客户失败' });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { ids, action, data } = req.body;
    
    for (const id of ids) {
      if (action === 'delete') {
        await db.run('UPDATE customer_profiles SET status = "inactive" WHERE id = ?', [id]);
      } else if (action === 'update' && data) {
        const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
        await db.run(`UPDATE customer_profiles SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...Object.values(data), id]);
      } else if (action === 'add_tags' && data?.tag_ids) {
        for (const tagId of data.tag_ids) {
          await db.run('INSERT OR IGNORE INTO customer_profile_tags (customer_id, tag_id, tagged_by) VALUES (?, ?, ?)', [id, tagId, req.user.id]);
        }
      }
    }
    
    res.json({ message: '批量操作成功' });
  } catch (error) {
    console.error('Batch operation error:', error);
    res.status(500).json({ error: '批量操作失败' });
  }
});

module.exports = router;
