const db = require('../database');

const getVerificationDetails = (req, res) => {
  const { propertyId } = req.params;

  try {
    const property = db.prepare(`
      SELECT p.*, u.real_name as owner_name, u.phone as owner_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(propertyId);

    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const verifications = db.prepare(`
      SELECT pv.*, u.real_name as verifier_name, u.phone as verifier_phone, u.avatar as verifier_avatar
      FROM property_verifications pv
      LEFT JOIN users u ON pv.verifier_id = u.id
      WHERE pv.property_id = ?
      ORDER BY pv.stage ASC, pv.created_at DESC
    `).all(propertyId);

    const enhancedVerifications = verifications.map((v, index) => ({
      ...v,
      vr_url: index === 1 ? property.vr_url || `https://vr.example.com/property/${propertyId}` : null,
      property_right_detail: index === 0 ? {
        certificate_no: `BJ${String(propertyId).padStart(8, '0')}`,
        owner_name: property.owner_name,
        property_address: property.address,
        matched: true,
        check_time: v.verified_at
      } : null,
      auditor: v.verifier_name ? {
        name: v.verifier_name,
        phone: v.verifier_phone,
        avatar: v.verifier_avatar,
        role: '资深审核员'
      } : null,
      review_records: v.status === 'verified' ? [
        {
          id: v.id,
          action: '审核通过',
          operator: v.verifier_name || '系统',
          time: v.verified_at,
          notes: v.notes || '验证通过'
        }
      ] : []
    }));

    const inspections = db.prepare(`
      SELECT qi.*, u.real_name as inspector_name, u.phone as inspector_phone
      FROM quality_inspections qi
      LEFT JOIN users u ON qi.inspector_id = u.id
      WHERE qi.property_id = ?
      ORDER BY qi.created_at DESC
    `).all(propertyId);

    const quality_inspections = inspections.map(qi => ({
      ...qi,
      order_no: `QI${String(qi.id).padStart(8, '0')}`,
      inspector: qi.inspector_name ? {
        name: qi.inspector_name,
        phone: qi.inspector_phone,
        role: '质检工程师'
      } : null
    }));

    const reviewLogs = db.prepare(`
      SELECT 
        qi.id,
        qi.property_id,
        qi.status,
        qi.completed_at as review_time,
        u.real_name as reviewer_name,
        qi.report as review_content,
        qi.issues as review_issues
      FROM quality_inspections qi
      LEFT JOIN users u ON qi.inspector_id = u.id
      WHERE qi.property_id = ? AND qi.status = 'completed'
      ORDER BY qi.completed_at DESC
    `).all(propertyId);

    if (property.images) {
      try {
        property.images = JSON.parse(property.images);
      } catch (e) {
        property.images = [];
      }
    }
    if (property.facilities) {
      property.facilities = property.facilities.split(',');
    }
    if (property.tags) {
      property.tags = property.tags.split(',');
    }

    res.json({
      property,
      verifications: enhancedVerifications,
      quality_inspections,
      review_records: reviewLogs
    });
  } catch (error) {
    console.error('获取验证详情错误:', error);
    res.status(500).json({ error: '获取验证详情失败' });
  }
};

const submitVerification = (req, res) => {
  const { propertyId, stage, stageName, evidence, notes } = req.body;
  const userId = req.user.id;

  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const insertVerify = db.prepare(`
      INSERT INTO property_verifications (property_id, verifier_id, stage, stage_name, status, evidence, notes, verified_at)
      VALUES (?, ?, ?, ?, 'verified', ?, ?, CURRENT_TIMESTAMP)
    `);
    insertVerify.run(propertyId, userId, stage, stageName, evidence, notes);

    db.prepare('UPDATE properties SET verification_stage = ? WHERE id = ?')
      .run(stage, propertyId);

    if (stage >= 4) {
      db.prepare('UPDATE properties SET is_verified = 1, status = ? WHERE id = ?')
        .run('verified', propertyId);
    }

    res.json({ success: true, message: `${stageName}验证提交成功` });
  } catch (error) {
    console.error('提交验证错误:', error);
    res.status(500).json({ error: '提交验证失败' });
  }
};

const getServiceOrders = (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT so.*, p.title as property_title, p.address as property_address
      FROM service_orders so
      LEFT JOIN properties p ON so.property_id = p.id
      WHERE so.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND so.status = ?';
      params.push(status);
    }

    query += ' ORDER BY so.created_at DESC';

    const orders = db.prepare(query).all(...params);
    res.json({ orders });
  } catch (error) {
    console.error('获取服务订单错误:', error);
    res.status(500).json({ error: '获取服务订单失败' });
  }
};

const createServiceOrder = (req, res) => {
  const userId = req.user.id;
  const { property_id, service_type, service_name, price } = req.body;

  try {
    const insertOrder = db.prepare(`
      INSERT INTO service_orders (user_id, property_id, service_type, service_name, price, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    const result = insertOrder.run(userId, property_id || null, service_type, service_name, price || 0);

    res.json({
      success: true,
      orderId: result.lastInsertRowid,
      message: '服务订单创建成功'
    });
  } catch (error) {
    console.error('创建服务订单错误:', error);
    res.status(500).json({ error: '创建服务订单失败' });
  }
};

const payServiceOrder = (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  try {
    const order = db.prepare('SELECT * FROM service_orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    db.prepare(`
      UPDATE service_orders
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP, transaction_id = ?
      WHERE id = ?
    `).run('TXN' + Date.now(), orderId);

    res.json({ success: true, message: '支付成功' });
  } catch (error) {
    console.error('支付订单错误:', error);
    res.status(500).json({ error: '支付失败' });
  }
};

const completeServiceOrder = (req, res) => {
  const { orderId } = req.params;
  const { rating, review } = req.body;

  try {
    db.prepare(`
      UPDATE service_orders
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, rating = ?, review = ?
      WHERE id = ?
    `).run(rating, review, orderId);

    res.json({ success: true, message: '服务已完成，感谢您的评价' });
  } catch (error) {
    console.error('完成订单错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
};

const getRentIndexDetails = (req, res) => {
  try {
    const districts = db.prepare(`
      SELECT 
        ri.*,
        (SELECT COUNT(*) FROM properties p WHERE p.district = ri.district AND p.status = 'verified') as verified_count,
        (SELECT COUNT(*) FROM properties p WHERE p.district = ri.district AND p.status != 'verified') as pending_count,
        (SELECT COUNT(*) FROM contracts c 
         JOIN properties p ON c.property_id = p.id 
         WHERE p.district = ri.district AND c.status = 'active') as active_contracts,
        (SELECT COUNT(*) FROM disputes d 
         JOIN contracts c ON d.contract_id = c.id 
         JOIN properties p ON c.property_id = p.id 
         WHERE p.district = ri.district AND d.status != 'resolved') as open_disputes,
        (SELECT COUNT(*) FROM quality_inspections qi 
         JOIN properties p ON qi.property_id = p.id 
         WHERE p.district = ri.district AND qi.status = 'pending') as pending_inspections,
        ROUND(ri.avg_rent_per_sqm, 2) as avg_rent_per_sqm
      FROM rent_index ri
      WHERE ri.record_date = (SELECT MAX(record_date) FROM rent_index)
      ORDER BY ri.avg_rent_per_sqm DESC
    `).all();

    const overview = db.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as total_properties,
        COUNT(DISTINCT CASE WHEN p.is_verified = 1 THEN p.id END) as verified_properties,
        COUNT(DISTINCT c.id) as total_contracts,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_contracts,
        COUNT(DISTINCT d.id) as total_disputes,
        COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) as resolved_disputes,
        ROUND(AVG(ri.avg_rent_per_sqm), 2) as city_avg_rent
      FROM properties p
      LEFT JOIN contracts c ON p.id = c.property_id
      LEFT JOIN disputes d ON c.id = d.contract_id
      LEFT JOIN rent_index ri ON p.district = ri.district
      WHERE p.city = '北京'
    `).get();

    const trend = db.prepare(`
      SELECT 
        record_date,
        ROUND(AVG(avg_rent_per_sqm), 2) as city_avg,
        ROUND(AVG(avg_transaction_days), 0) as avg_days
      FROM rent_index
      GROUP BY record_date
      ORDER BY record_date DESC
      LIMIT 12
    `).all();

    res.json({
      overview,
      districts,
      trend
    });
  } catch (error) {
    console.error('获取租金指数详情错误:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
};

const getDashboardStats = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let stats = {};

    if (role === 'tenant') {
      stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM favorite_properties WHERE user_id = ?) as favorite_count,
          (SELECT COUNT(*) FROM contracts WHERE tenant_id = ? AND status = 'active') as active_contracts,
          (SELECT COUNT(*) FROM payments WHERE user_id = ? AND status = 'pending') as pending_payments,
          (SELECT COUNT(*) FROM disputes WHERE complainant_id = ? AND status != 'resolved') as open_disputes
      `).get(userId, userId, userId, userId);
    } else if (role === 'landlord') {
      stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM properties WHERE owner_id = ?) as property_count,
          (SELECT COUNT(*) FROM properties WHERE owner_id = ? AND is_verified = 1) as verified_count,
          (SELECT COUNT(*) FROM contracts WHERE landlord_id = ? AND status = 'active') as active_contracts,
          (SELECT COUNT(*) FROM disputes WHERE respondent_id = ? AND status != 'resolved') as open_disputes
      `).get(userId, userId, userId, userId);
    } else if (role === 'admin') {
      stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM properties) as total_properties,
          (SELECT COUNT(*) FROM properties WHERE is_verified = 1) as verified_properties,
          (SELECT COUNT(*) FROM contracts) as total_contracts,
          (SELECT COUNT(*) FROM disputes WHERE status != 'resolved') as open_disputes,
          (SELECT COUNT(*) FROM service_orders WHERE status = 'pending') as pending_orders,
          (SELECT COUNT(*) FROM users) as total_users
      `).get();
    }

    res.json({ stats, role });
  } catch (error) {
    console.error('获取工作台统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
};

const getMyContracts = (req, res) => {
  const userId = req.user.id;

  try {
    const contracts = db.prepare(`
      SELECT 
        c.*,
        p.title as property_title,
        p.address as property_address,
        p.images as property_images,
        landlord.real_name as landlord_name,
        tenant.real_name as tenant_name
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users landlord ON c.landlord_id = landlord.id
      JOIN users tenant ON c.tenant_id = tenant.id
      WHERE c.landlord_id = ? OR c.tenant_id = ?
      ORDER BY c.created_at DESC
    `).all(userId, userId);

    contracts.forEach(c => {
      if (c.property_images) {
        try {
          c.property_images = JSON.parse(c.property_images);
        } catch (e) {
          c.property_images = [];
        }
      }
    });

    res.json({ contracts });
  } catch (error) {
    console.error('获取合约错误:', error);
    res.status(500).json({ error: '获取合约失败' });
  }
};

const signContract = (req, res) => {
  const { contractId } = req.params;
  const userId = req.user.id;

  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId);
    if (!contract) {
      return res.status(404).json({ error: '合约不存在' });
    }

    if (contract.landlord_id === userId) {
      db.prepare('UPDATE contracts SET signed_landlord = 1 WHERE id = ?').run(contractId);
    } else if (contract.tenant_id === userId) {
      db.prepare('UPDATE contracts SET signed_tenant = 1 WHERE id = ?').run(contractId);
    } else {
      return res.status(403).json({ error: '无权限签署此合约' });
    }

    const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId);
    if (updated.signed_landlord && updated.signed_tenant) {
      db.prepare(`
        UPDATE contracts 
        SET status = 'active', signed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(contractId);
    }

    res.json({ success: true, message: '签署成功' });
  } catch (error) {
    console.error('签署合约错误:', error);
    res.status(500).json({ error: '签署失败' });
  }
};

const getEscrowFunds = (req, res) => {
  const userId = req.user.id;

  try {
    const funds = db.prepare(`
      SELECT 
        ef.*,
        p.amount as payment_amount,
        p.payment_type,
        c.monthly_rent,
        prop.title as property_title
      FROM escrow_funds ef
      JOIN payments p ON ef.payment_id = p.id
      JOIN contracts c ON p.contract_id = c.id
      JOIN properties prop ON c.property_id = prop.id
      WHERE p.user_id = ? OR c.landlord_id = ?
      ORDER BY ef.created_at DESC
    `).all(userId, userId);

    const balance = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN ef.status = 'held' THEN ef.amount ELSE 0 END), 0) as held_amount,
        COALESCE(SUM(CASE WHEN ef.status = 'released' THEN ef.amount ELSE 0 END), 0) as released_amount
      FROM escrow_funds ef
      JOIN payments p ON ef.payment_id = p.id
      WHERE p.user_id = ?
    `).get(userId);

    res.json({ funds, balance });
  } catch (error) {
    console.error('获取托管资金错误:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
};

const getInsurancePolicies = (req, res) => {
  const userId = req.user.id;

  try {
    const policies = db.prepare(`
      SELECT 
        ip.*,
        c.monthly_rent,
        p.title as property_title,
        p.address as property_address
      FROM insurance_policies ip
      JOIN contracts c ON ip.contract_id = c.id
      JOIN properties p ON c.property_id = p.id
      WHERE c.landlord_id = ? OR c.tenant_id = ?
      ORDER BY ip.created_at DESC
    `).all(userId, userId);

    res.json({ policies });
  } catch (error) {
    console.error('获取保单错误:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
};

const createDispute = (req, res) => {
  const userId = req.user.id;
  const { contract_id, title, description, evidence } = req.body;

  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract_id);
    if (!contract) {
      return res.status(404).json({ error: '合约不存在' });
    }

    const respondentId = contract.landlord_id === userId ? contract.tenant_id : contract.landlord_id;

    const insertDispute = db.prepare(`
      INSERT INTO disputes (contract_id, complainant_id, respondent_id, title, description, status, evidence)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `);
    const result = insertDispute.run(contract_id, userId, respondentId, title, description, evidence);

    res.json({
      success: true,
      disputeId: result.lastInsertRowid,
      message: '纠纷提交成功，我们将尽快安排调解'
    });
  } catch (error) {
    console.error('提交纠纷错误:', error);
    res.status(500).json({ error: '提交失败' });
  }
};

const getDisputes = (req, res) => {
  const userId = req.user.id;

  try {
    const disputes = db.prepare(`
      SELECT 
        d.*,
        c.monthly_rent,
        p.title as property_title,
        complainant.real_name as complainant_name,
        respondent.real_name as respondent_name,
        mediator.real_name as mediator_name
      FROM disputes d
      JOIN contracts c ON d.contract_id = c.id
      JOIN properties p ON c.property_id = p.id
      JOIN users complainant ON d.complainant_id = complainant.id
      JOIN users respondent ON d.respondent_id = respondent.id
      LEFT JOIN users mediator ON d.mediator_id = mediator.id
      WHERE d.complainant_id = ? OR d.respondent_id = ?
      ORDER BY d.created_at DESC
    `).all(userId, userId);

    res.json({ disputes });
  } catch (error) {
    console.error('获取纠纷错误:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
};

module.exports = {
  getVerificationDetails,
  submitVerification,
  getServiceOrders,
  createServiceOrder,
  payServiceOrder,
  completeServiceOrder,
  getRentIndexDetails,
  getDashboardStats,
  getMyContracts,
  signContract,
  getEscrowFunds,
  getInsurancePolicies,
  createDispute,
  getDisputes
};
