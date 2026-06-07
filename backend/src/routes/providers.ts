import { Router } from 'express';
import { db, getAsync, allAsync, runAsync } from '../database/init';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { gridCode, type, status, certified } = req.query;
    
    let query = 'SELECT * FROM providers WHERE 1=1';
    const params: any[] = [];
    
    if (gridCode) {
      query += ' AND grid_code = ?';
      params.push(gridCode);
    }
    if (type) {
      query += ' AND service_type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND review_status = ?';
      params.push(status);
    }
    if (certified === 'true') {
      query += ' AND street_certified = 1';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const providers = await allAsync(query, params);
    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取服务商列表失败' });
  }
});

router.get('/renewal', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const providers = await allAsync(`
      SELECT * FROM providers 
      WHERE annual_review_date <= ? OR review_status IN ('pending', 'expired')
      ORDER BY annual_review_date ASC
    `, [thirtyDaysLater.toISOString().split('T')[0]]);
    
    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取年审提醒失败' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await allAsync(`
      SELECT 
        review_status,
        COUNT(*) as count
      FROM providers
      GROUP BY review_status
    `);
    
    const certifiedCount = await getAsync('SELECT COUNT(*) as count FROM providers WHERE street_certified = 1');
    const pendingRenewal = await getAsync(`
      SELECT COUNT(*) as count FROM providers 
      WHERE annual_review_date <= DATE('now', '+30 days') OR review_status IN ('pending', 'expired')
    `);
    
    res.json({
      success: true,
      data: {
        byStatus: stats,
        certifiedCount: certifiedCount.count,
        pendingRenewal: pendingRenewal.count,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const provider = await getAsync('SELECT * FROM providers WHERE id = ?', [Number(req.params.id)]);
    if (!provider) {
      return res.status(404).json({ success: false, error: '服务商不存在' });
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取服务商详情失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      serviceType,
      gridCode,
      certified,
      streetCertified,
      certificationNo,
      contactName,
      phone,
      annualReviewDate,
    } = req.body;
    const isCertified = certified ?? streetCertified;
    
    const result = await new Promise<any>((resolve, reject) => {
      db.run(`
        INSERT INTO providers (name, service_type, grid_code, street_certified, certification_no, contact_name, phone, annual_review_date, review_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        serviceType,
        gridCode,
        isCertified ? 1 : 0,
        certificationNo,
        contactName,
        phone,
        annualReviewDate || null,
        isCertified ? 'approved' : 'pending',
      ], function(err: any) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID });
      });
    });
    
    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建服务商失败' });
  }
});

router.put('/:id/renew', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewDate, annualReviewDate } = req.body;
    const nextReviewDate = reviewDate || annualReviewDate;

    if (!nextReviewDate) {
      return res.status(400).json({ success: false, error: '年审日期不能为空' });
    }
    
    await runAsync(`
      UPDATE providers 
      SET annual_review_date = ?, review_status = 'approved', reviewer = '社区管理员', review_note = '年审通过，资质有效'
      WHERE id = ?
    `, [nextReviewDate, Number(id)]);
    
    res.json({ success: true, message: '年审更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新年审失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, serviceType, gridCode, certified, streetCertified, certificationNo, contactName, phone } = req.body;
    const isCertified = certified ?? streetCertified;
    
    await runAsync(`
      UPDATE providers 
      SET name = ?, service_type = ?, grid_code = ?, street_certified = ?, certification_no = ?, contact_name = ?, phone = ?
      WHERE id = ?
    `, [name, serviceType, gridCode, isCertified ? 1 : 0, certificationNo, contactName, phone, Number(id)]);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新服务商失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await runAsync('DELETE FROM providers WHERE id = ?', [Number(req.params.id)]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除服务商失败' });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await allAsync(`
      SELECT * FROM provider_reviews 
      WHERE provider_id = ? 
      ORDER BY created_at DESC
    `, [Number(req.params.id)]);
    
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取复查记录失败' });
  }
});

router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId, reviewerName, rating, comment, reviewType } = req.body;
    
    const result = await runAsync(`
      INSERT INTO provider_reviews (provider_id, reviewer_id, reviewer_name, rating, comment, review_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [Number(id), reviewerId || null, reviewerName || '社区管理员', rating || 5, comment || '复查通过', reviewType || 'annual']);
    
    await runAsync(`
      UPDATE providers 
      SET review_status = 'approved', review_note = ?
      WHERE id = ?
    `, [comment || '复查通过', Number(id)]);
    
    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加复查记录失败' });
  }
});

router.post('/:id/remind', async (req, res) => {
  try {
    const { id } = req.params;
    const { remindType, message: remindMessage } = req.body;
    
    const result = await runAsync(`
      INSERT INTO provider_reviews (provider_id, reviewer_name, comment, review_type, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [Number(id), '系统', remindMessage || '年审提醒通知已发送', remindType || 'reminder']);
    
    res.json({ success: true, data: { id: result.lastID }, message: '提醒已发送' });
  } catch (error) {
    res.status(500).json({ success: false, error: '发送提醒失败' });
  }
});

router.get('/:id/settlements', async (req, res) => {
  try {
    const settlements = await allAsync(`
      SELECT s.*, 
             d.title as demand_title,
             d.type as demand_type
      FROM settlements s
      LEFT JOIN demands d ON s.demand_id = d.id
      WHERE s.provider_id = ?
      ORDER BY s.created_at DESC
      LIMIT 50
    `, [Number(req.params.id)]);
    
    res.json({ success: true, data: settlements });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取结算记录失败' });
  }
});

export default router;
