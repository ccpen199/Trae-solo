const db = require('../database');

const createContract = (req, res) => {
  const userId = req.user.id;
  const {
    property_id,
    tenant_id,
    start_date,
    end_date,
    monthly_rent,
    deposit,
    payment_cycle
  } = req.body;

  if (!property_id || !tenant_id || !start_date || !end_date || !monthly_rent || !deposit || !payment_cycle) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id);
    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    if (property.owner_id !== userId) {
      return res.status(403).json({ error: '只有房东可以创建合约' });
    }

    const tenant = db.prepare('SELECT id, is_verified FROM users WHERE id = ?').get(tenant_id);
    if (!tenant) {
      return res.status(404).json({ error: '租客不存在' });
    }

    const contractContent = `
房屋租赁合同
甲方（房东）：${userId}
乙方（租客）：${tenant_id}
房屋地址：${property.address}
租赁期限：${start_date} 至 ${end_date}
月租金：${monthly_rent}元
押金：${deposit}元
付款周期：${payment_cycle}
    `;

    const stmt = db.prepare(`
      INSERT INTO contracts (
        property_id, landlord_id, tenant_id, contract_type, start_date, end_date,
        monthly_rent, deposit, payment_cycle, status, contract_content
      ) VALUES (?, ?, ?, 'rent', ?, ?, ?, ?, ?, 'pending', ?)
    `);

    const result = stmt.run(
      property_id,
      userId,
      tenant_id,
      start_date,
      end_date,
      monthly_rent,
      deposit,
      payment_cycle,
      contractContent
    );

    const contract = db.prepare(`
      SELECT c.*, 
             p.title as property_title,
             p.address as property_address,
             l.real_name as landlord_name,
             t.real_name as tenant_name
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: '合约创建成功，等待双方签署',
      contract
    });
  } catch (error) {
    console.error('创建合约错误:', error);
    res.status(500).json({ error: '创建合约失败' });
  }
};

const getMyContracts = (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    let query = `
      SELECT c.*, 
             p.title as property_title,
             p.address as property_address,
             l.real_name as landlord_name,
             t.real_name as tenant_name,
             CASE WHEN c.landlord_id = ? THEN 'landlord' ELSE 'tenant' END as user_role
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE c.landlord_id = ? OR c.tenant_id = ?
    `;
    const params = [userId, userId, userId];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const totalResult = db.prepare(countQuery).get(...params);

    const offset = (page - 1) * limit;
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const contracts = db.prepare(query).all(...params);

    res.json({
      contracts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('获取合约列表错误:', error);
    res.status(500).json({ error: '获取合约列表失败' });
  }
};

const getContractById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const contract = db.prepare(`
      SELECT c.*, 
             p.title as property_title,
             p.address as property_address,
             l.real_name as landlord_name,
             l.phone as landlord_phone,
             t.real_name as tenant_name,
             t.phone as tenant_phone,
             CASE WHEN c.landlord_id = ? THEN 'landlord' ELSE 'tenant' END as user_role
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE c.id = ?
    `).get(userId, id);

    if (!contract) {
      return res.status(404).json({ error: '合约不存在' });
    }

    if (contract.landlord_id !== userId && contract.tenant_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权查看此合约' });
    }

    res.json({ contract });
  } catch (error) {
    console.error('获取合约详情错误:', error);
    res.status(500).json({ error: '获取合约详情失败' });
  }
};

const signContract = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    if (!contract) {
      return res.status(404).json({ error: '合约不存在' });
    }

    let updateField = '';
    if (contract.landlord_id === userId) {
      updateField = 'signed_landlord = 1';
    } else if (contract.tenant_id === userId) {
      updateField = 'signed_tenant = 1';
    } else {
      return res.status(403).json({ error: '无权签署此合约' });
    }

    db.prepare(`UPDATE contracts SET ${updateField}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);

    const updatedContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);

    if (updatedContract.signed_landlord && updatedContract.signed_tenant) {
      db.prepare(`
        UPDATE contracts 
        SET status = 'active', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(id);

      const finalContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
      res.json({
        message: '合约已生效',
        contract: finalContract
      });
    } else {
      res.json({
        message: '签署成功，等待对方签署',
        contract: updatedContract
      });
    }
  } catch (error) {
    console.error('签署合约错误:', error);
    res.status(500).json({ error: '签署合约失败' });
  }
};

const createPayment = (req, res) => {
  const { contract_id, amount, payment_type } = req.body;
  const userId = req.user.id;

  if (!contract_id || !amount || !payment_type) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract_id);
    if (!contract) {
      return res.status(404).json({ error: '合约不存在' });
    }

    if (contract.tenant_id !== userId) {
      return res.status(403).json({ error: '只有租客可以支付' });
    }

    const stmt = db.prepare(`
      INSERT INTO payments (contract_id, user_id, amount, payment_type, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(contract_id, userId, amount, payment_type);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: '支付订单创建成功',
      payment
    });
  } catch (error) {
    console.error('创建支付订单错误:', error);
    res.status(500).json({ error: '创建支付订单失败' });
  }
};

const processPayment = (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!payment) {
      return res.status(404).json({ error: '支付订单不存在' });
    }

    if (payment.user_id !== userId) {
      return res.status(403).json({ error: '无权处理此支付' });
    }

    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    db.prepare(`
      UPDATE payments 
      SET status = 'paid', transaction_id = ?, paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(transactionId, paymentId);

    db.prepare(`
      INSERT INTO escrow_funds (payment_id, amount, status)
      VALUES (?, ?, 'held')
    `).run(paymentId, payment.amount);

    const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);

    res.json({
      message: '支付成功，资金已进入托管',
      payment: updatedPayment
    });
  } catch (error) {
    console.error('处理支付错误:', error);
    res.status(500).json({ error: '处理支付失败' });
  }
};

const getMyPayments = (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    let query = `
      SELECT p.*, 
             c.property_id,
             pr.title as property_title
      FROM payments p
      LEFT JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN properties pr ON c.property_id = pr.id
      WHERE p.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const totalResult = db.prepare(countQuery).get(...params);

    const offset = (page - 1) * limit;
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const payments = db.prepare(query).all(...params);

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('获取支付记录错误:', error);
    res.status(500).json({ error: '获取支付记录失败' });
  }
};

const createDispute = (req, res) => {
  const { contract_id, title, description } = req.body;
  const userId = req.user.id;

  if (!contract_id || !title) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract_id);
    if (!contract) {
      return res.status(404).json({ error: '合约不存在' });
    }

    let respondentId;
    if (contract.landlord_id === userId) {
      respondentId = contract.tenant_id;
    } else if (contract.tenant_id === userId) {
      respondentId = contract.landlord_id;
    } else {
      return res.status(403).json({ error: '只有合约参与方可以发起纠纷' });
    }

    const stmt = db.prepare(`
      INSERT INTO disputes (contract_id, complainant_id, respondent_id, title, description, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(contract_id, userId, respondentId, title, description || null);

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: '纠纷已提交，等待处理',
      dispute
    });
  } catch (error) {
    console.error('创建纠纷错误:', error);
    res.status(500).json({ error: '创建纠纷失败' });
  }
};

const getMyDisputes = (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    let query = `
      SELECT d.*, 
             c.property_id,
             pr.title as property_title,
             cu.real_name as complainant_name,
             ru.real_name as respondent_name,
             CASE WHEN d.complainant_id = ? THEN 'complainant' ELSE 'respondent' END as user_role
      FROM disputes d
      LEFT JOIN contracts c ON d.contract_id = c.id
      LEFT JOIN properties pr ON c.property_id = pr.id
      LEFT JOIN users cu ON d.complainant_id = cu.id
      LEFT JOIN users ru ON d.respondent_id = ru.id
      WHERE d.complainant_id = ? OR d.respondent_id = ?
    `;
    const params = [userId, userId, userId];

    if (status) {
      query += ' AND d.status = ?';
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

module.exports = {
  createContract,
  getMyContracts,
  getContractById,
  signContract,
  createPayment,
  processPayment,
  getMyPayments,
  createDispute,
  getMyDisputes
};
