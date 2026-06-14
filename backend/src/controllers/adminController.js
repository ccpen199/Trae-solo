const db = require('../database');

const getDashboardStats = (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
    const verifiedProperties = db.prepare('SELECT COUNT(*) as count FROM properties WHERE is_verified = 1').get().count;
    const pendingProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'pending'").get().count;
    const totalContracts = db.prepare('SELECT COUNT(*) as count FROM contracts').get().count;
    const activeContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'active'").get().count;
    const pendingDisputes = db.prepare("SELECT COUNT(*) as count FROM disputes WHERE status = 'pending'").get().count;

    const recentUsers = db.prepare(`
      SELECT id, username, real_name, role, created_at, is_verified
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    const recentProperties = db.prepare(`
      SELECT p.id, p.title, p.city, p.price, p.status, p.created_at, u.real_name as owner_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        totalUsers,
        totalProperties,
        verifiedProperties,
        pendingProperties,
        totalContracts,
        activeContracts,
        pendingDisputes
      },
      recentUsers,
      recentProperties
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

const getPendingVerifications = (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const properties = db.prepare(`
      SELECT p.*, u.real_name as owner_name, u.phone as owner_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.status != 'verified' OR p.is_verified = 0
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(Number(limit), offset);

    const totalResult = db.prepare(`
      SELECT COUNT(*) as total 
      FROM properties 
      WHERE status != 'verified' OR is_verified = 0
    `).get();

    res.json({
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('获取待审核房源错误:', error);
    res.status(500).json({ error: '获取待审核房源失败' });
  }
};

const verifyPropertyStage = (req, res) => {
  const { propertyId, stage } = req.params;
  const { status, notes, evidence } = req.body;
  const verifierId = req.user.id;

  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const verification = db.prepare(`
      SELECT * FROM property_verifications 
      WHERE property_id = ? AND stage = ?
    `).get(propertyId, stage);

    if (!verification) {
      return res.status(404).json({ error: '验证阶段不存在' });
    }

    db.prepare(`
      UPDATE property_verifications 
      SET status = ?, notes = ?, evidence = ?, verifier_id = ?, verified_at = CURRENT_TIMESTAMP
      WHERE property_id = ? AND stage = ?
    `).run(status || 'passed', notes || null, evidence || null, verifierId, propertyId, stage);

    const allVerifications = db.prepare('SELECT * FROM property_verifications WHERE property_id = ? ORDER BY stage').all(propertyId);
    const allPassed = allVerifications.every(v => v.status === 'passed');
    const maxPassedStage = Math.max(...allVerifications.filter(v => v.status === 'passed').map(v => v.stage), 0);

    if (allPassed) {
      db.prepare(`
        UPDATE properties 
        SET status = 'verified', is_verified = 1, verification_stage = 4, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(propertyId);
    } else {
      db.prepare(`
        UPDATE properties 
        SET status = 'verifying', verification_stage = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(maxPassedStage, propertyId);
    }

    const updatedProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    const updatedVerifications = db.prepare('SELECT * FROM property_verifications WHERE property_id = ? ORDER BY stage').all(propertyId);

    res.json({
      message: '验证状态已更新',
      property: updatedProperty,
      verifications: updatedVerifications
    });
  } catch (error) {
    console.error('更新验证状态错误:', error);
    res.status(500).json({ error: '更新验证状态失败' });
  }
};

const getDisputes = (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  try {
    let query = `
      SELECT d.*, 
             c.title as contract_title,
             cu.real_name as complainant_name,
             ru.real_name as respondent_name
      FROM disputes d
      LEFT JOIN contracts c ON d.contract_id = c.id
      LEFT JOIN users cu ON d.complainant_id = cu.id
      LEFT JOIN users ru ON d.respondent_id = ru.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE d.status = ?';
      params.push(status);
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const totalResult = db.prepare(countQuery).get(...params);

    const offset = (page - 1) * limit;
    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const disputes = db.prepare(query).all(...params);

    res.json({
      disputes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('获取纠纷列表错误:', error);
    res.status(500).json({ error: '获取纠纷列表失败' });
  }
};

const resolveDispute = (req, res) => {
  const { disputeId } = req.params;
  const { resolution, status } = req.body;
  const mediatorId = req.user.id;

  try {
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
    if (!dispute) {
      return res.status(404).json({ error: '纠纷不存在' });
    }

    db.prepare(`
      UPDATE disputes 
      SET status = ?, resolution = ?, mediator_id = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status || 'resolved', resolution || null, mediatorId, disputeId);

    const updatedDispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);

    res.json({
      message: '纠纷已处理',
      dispute: updatedDispute
    });
  } catch (error) {
    console.error('处理纠纷错误:', error);
    res.status(500).json({ error: '处理纠纷失败' });
  }
};

const getRentIndex = (req, res) => {
  const { city, startDate, endDate } = req.query;

  try {
    let query = 'SELECT * FROM rent_index';
    const params = [];

    if (city) {
      query += ' WHERE city = ?';
      params.push(city);
    }

    if (startDate && endDate) {
      query += city ? ' AND' : ' WHERE';
      query += ' record_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY record_date DESC, city, district';

    const rentIndexData = db.prepare(query).all(...params);

    const cityStats = {};
    rentIndexData.forEach(item => {
      if (!cityStats[item.city]) {
        cityStats[item.city] = {
          city: item.city,
          districts: [],
          avg_rent: 0,
          total_transactions: 0
        };
      }
      cityStats[item.city].districts.push(item);
      cityStats[item.city].avg_rent += item.avg_rent_per_sqm;
      cityStats[item.city].total_transactions += item.transaction_count;
    });

    Object.values(cityStats).forEach(stat => {
      if (stat.districts.length > 0) {
        stat.avg_rent = Math.round(stat.avg_rent / stat.districts.length);
      }
    });

    res.json({
      rentIndex: rentIndexData,
      cityStats: Object.values(cityStats)
    });
  } catch (error) {
    console.error('获取租金指数错误:', error);
    res.status(500).json({ error: '获取租金指数失败' });
  }
};

const getQualityInspections = (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  try {
    let query = `
      SELECT qi.*, 
             p.title as property_title,
             p.address as property_address,
             u.real_name as inspector_name
      FROM quality_inspections qi
      LEFT JOIN properties p ON qi.property_id = p.id
      LEFT JOIN users u ON qi.inspector_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE qi.status = ?';
      params.push(status);
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const totalResult = db.prepare(countQuery).get(...params);

    const offset = (page - 1) * limit;
    query += ' ORDER BY qi.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const inspections = db.prepare(query).all(...params);

    res.json({
      inspections,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('获取质检工单错误:', error);
    res.status(500).json({ error: '获取质检工单失败' });
  }
};

const createQualityInspection = (req, res) => {
  const { property_id, inspection_type, scheduled_at } = req.body;

  if (!property_id || !inspection_type) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  try {
    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(property_id);
    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const stmt = db.prepare(`
      INSERT INTO quality_inspections (property_id, inspection_type, scheduled_at, status)
      VALUES (?, ?, ?, 'pending')
    `);

    const result = stmt.run(property_id, inspection_type, scheduled_at || null);

    const inspection = db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: '质检工单创建成功',
      inspection
    });
  } catch (error) {
    console.error('创建质检工单错误:', error);
    res.status(500).json({ error: '创建质检工单失败' });
  }
};

const updateQualityInspection = (req, res) => {
  const { inspectionId } = req.params;
  const { status, issues, report } = req.body;
  const inspectorId = req.user.id;

  try {
    const inspection = db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(inspectionId);
    if (!inspection) {
      return res.status(404).json({ error: '质检工单不存在' });
    }

    db.prepare(`
      UPDATE quality_inspections 
      SET status = ?, issues = ?, report = ?, inspector_id = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status || 'completed', issues || null, report || null, inspectorId, inspectionId);

    const updatedInspection = db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(inspectionId);

    res.json({
      message: '质检工单已更新',
      inspection: updatedInspection
    });
  } catch (error) {
    console.error('更新质检工单错误:', error);
    res.status(500).json({ error: '更新质检工单失败' });
  }
};

module.exports = {
  getDashboardStats,
  getPendingVerifications,
  verifyPropertyStage,
  getDisputes,
  resolveDispute,
  getRentIndex,
  getQualityInspections,
  createQualityInspection,
  updateQualityInspection
};
