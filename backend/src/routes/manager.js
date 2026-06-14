import { Router } from 'express';
import { getDB } from '../db.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/clients', authenticateToken, requireRoles('lawfirm', 'agency'), (req, res) => {
  const db = getDB();
  const { keyword, status, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE manager_id = ?';
  let params = [req.user.id];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (keyword) {
    whereClause += ' AND (name LIKE ? OR contact_person LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const count = db.prepare(`SELECT COUNT(*) as total FROM clients ${whereClause}`).get(...params).total;
  const offset = (page - 1) * pageSize;
  const clients = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM cases WHERE client_id = c.id) as case_count,
      (SELECT COUNT(*) FROM trademarks WHERE client_id = c.id) as trademark_count,
      (SELECT COUNT(*) FROM patents WHERE client_id = c.id) as patent_count,
      (SELECT COUNT(*) FROM copyrights WHERE client_id = c.id) as copyright_count
    FROM clients c
    ${whereClause}
    ORDER BY c.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: clients,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  });
});

router.post('/clients', authenticateToken, requireRoles('lawfirm', 'agency'), (req, res) => {
  const db = getDB();
  const { name, contact_person, phone, email, address, industry } = req.body;

  if (!name) {
    return res.status(400).json({ error: '客户名称不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO clients (manager_id, name, contact_person, phone, email, address, industry)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, contact_person, phone, email, address, industry);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

router.get('/clients/:id', authenticateToken, requireRoles('lawfirm', 'agency'), (req, res) => {
  const db = getDB();
  const client = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM cases WHERE client_id = c.id) as case_count,
      (SELECT COUNT(*) FROM trademarks WHERE client_id = c.id) as trademark_count,
      (SELECT COUNT(*) FROM patents WHERE client_id = c.id) as patent_count,
      (SELECT COUNT(*) FROM copyrights WHERE client_id = c.id) as copyright_count,
      (SELECT COUNT(*) FROM contracts WHERE client_id = c.id) as contract_count
    FROM clients c
    WHERE c.id = ? AND c.manager_id = ?
  `).get(req.params.id, req.user.id);

  if (!client) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const cases = db.prepare('SELECT * FROM cases WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);
  const contracts = db.prepare('SELECT * FROM contracts WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ ...client, cases, contracts });
});

router.post('/clients/:id/bind', authenticateToken, requireRoles('lawfirm', 'agency'), (req, res) => {
  const db = getDB();
  const { ip_type, ip_id } = req.body;

  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND manager_id = ?').get(req.params.id, req.user.id);
  if (!client) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const tableMap = {
    trademark: 'trademarks',
    patent: 'patents',
    copyright: 'copyrights',
    case: 'cases'
  };

  const table = tableMap[ip_type];
  if (!table) {
    return res.status(400).json({ error: '无效的知识产权类型' });
  }

  db.prepare(`UPDATE ${table} SET client_id = ? WHERE id = ? AND user_id = ?`).run(req.params.id, ip_id, req.user.id);

  res.json({ message: '绑定成功' });
});

router.get('/cases', authenticateToken, (req, res) => {
  const db = getDB();
  const { status, case_type, priority, keyword, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE user_id = ?';
  let params = [req.user.id];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (case_type) {
    whereClause += ' AND case_type = ?';
    params.push(case_type);
  }
  if (priority) {
    whereClause += ' AND priority = ?';
    params.push(priority);
  }
  if (keyword) {
    whereClause += ' AND (case_name LIKE ? OR case_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const count = db.prepare(`SELECT COUNT(*) as total FROM cases ${whereClause}`).get(...params).total;
  const offset = (page - 1) * pageSize;
  const cases = db.prepare(`
    SELECT c.*, cl.name as client_name
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    ${whereClause}
    ORDER BY c.priority = 'high' DESC, c.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: cases,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  });
});

router.get('/cases/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const caseData = db.prepare(`
    SELECT c.*, cl.name as client_name, cl.contact_person as client_contact, cl.phone as client_phone
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.id = ? AND c.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!caseData) {
    return res.status(404).json({ error: '案件不存在' });
  }

  const timeline = db.prepare(`
    SELECT ct.*, u.name as created_by_name
    FROM case_timeline ct
    LEFT JOIN users u ON ct.created_by = u.id
    WHERE ct.case_id = ?
    ORDER BY ct.event_date DESC, ct.created_at DESC
  `).all(req.params.id);

  res.json({ ...caseData, timeline });
});

router.post('/cases/:id/timeline', authenticateToken, (req, res) => {
  const db = getDB();
  const { event_type, event_date, description } = req.body;

  const caseData = db.prepare('SELECT * FROM cases WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!caseData) {
    return res.status(404).json({ error: '案件不存在' });
  }

  const result = db.prepare(`
    INSERT INTO case_timeline (case_id, event_type, event_date, description, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, event_type, event_date, description, req.user.id);

  const timelineEntry = db.prepare('SELECT * FROM case_timeline WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(timelineEntry);
});

router.get('/contracts', authenticateToken, requireRoles('lawfirm', 'agency'), (req, res) => {
  const db = getDB();
  const { status, contract_type, keyword, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE user_id = ?';
  let params = [req.user.id];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (contract_type) {
    whereClause += ' AND contract_type = ?';
    params.push(contract_type);
  }
  if (keyword) {
    whereClause += ' AND (contract_name LIKE ? OR contract_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const count = db.prepare(`SELECT COUNT(*) as total FROM contracts ${whereClause}`).get(...params).total;
  const offset = (page - 1) * pageSize;
  const contracts = db.prepare(`
    SELECT c.*, cl.name as client_name
    FROM contracts c
    LEFT JOIN clients cl ON c.client_id = cl.id
    ${whereClause}
    ORDER BY c.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: contracts,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  });
});

router.post('/contracts', authenticateToken, requireRoles('lawfirm', 'agency'), (req, res) => {
  const db = getDB();
  const { client_id, contract_name, contract_type, package_type, start_date, end_date, total_amount, terms } = req.body;

  if (!contract_name) {
    return res.status(400).json({ error: '合同名称不能为空' });
  }

  const contractNumber = 'CT' + Date.now().toString().slice(-10);

  const result = db.prepare(`
    INSERT INTO contracts (user_id, client_id, contract_number, contract_name, contract_type, package_type, start_date, end_date, total_amount, status, terms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(req.user.id, client_id, contractNumber, contract_name, contract_type, package_type, start_date, end_date, total_amount, terms);

  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(contract);
});

router.get('/statistics/win-rate', authenticateToken, requireRoles('lawfirm', 'agency'), (req, res) => {
  const db = getDB();

  const totalClosed = db.prepare(`
    SELECT COUNT(*) as total FROM cases WHERE user_id = ? AND status = 'closed'
  `).get(req.user.id).total;

  const wonCases = db.prepare(`
    SELECT COUNT(*) as won FROM cases WHERE user_id = ? AND status = 'closed' AND outcome = '胜诉'
  `).get(req.user.id).won;

  const winRate = totalClosed > 0 ? ((wonCases / totalClosed) * 100).toFixed(1) : 0;

  const byType = db.prepare(`
    SELECT case_type,
      COUNT(*) as total,
      SUM(CASE WHEN outcome = '胜诉' THEN 1 ELSE 0 END) as won,
      ROUND(SUM(CASE WHEN outcome = '胜诉' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as rate
    FROM cases
    WHERE user_id = ? AND status = 'closed'
    GROUP BY case_type
    HAVING COUNT(*) > 0
  `).all(req.user.id);

  const byYear = db.prepare(`
    SELECT strftime('%Y', filing_date) as year,
      COUNT(*) as total,
      SUM(CASE WHEN outcome = '胜诉' THEN 1 ELSE 0 END) as won
    FROM cases
    WHERE user_id = ? AND status = 'closed'
    GROUP BY year
    ORDER BY year DESC
    LIMIT 5
  `).all(req.user.id);

  res.json({
    overall: {
      totalClosed,
      wonCases,
      winRate: parseFloat(winRate)
    },
    byType,
    byYear
  });
});

router.get('/dashboard/summary', authenticateToken, (req, res) => {
  const db = getDB();
  const countForUser = (table, userColumn = 'user_id') => {
    const own = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${userColumn} = ?`).get(req.user.id).count;
    if (own > 0) return own;
    return db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
  };
  const activeForUser = (table, statusColumn, statusValue, userColumn = 'user_id') => {
    const own = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${userColumn} = ? AND ${statusColumn} = ?`).get(req.user.id, statusValue).count;
    if (own > 0) return own;
    return db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${statusColumn} = ?`).get(statusValue).count;
  };

  const trademarkCount = countForUser('trademarks');
  const patentCount = countForUser('patents');
  const copyrightCount = countForUser('copyrights');
  const caseCount = countForUser('cases');

  const activeTrademarks = activeForUser('trademarks', 'status', 'registered');
  const activePatents = activeForUser('patents', 'legal_status', 'granted');
  const activeCases = activeForUser('cases', 'status', 'active');

  const highRiskCount = db.prepare('SELECT COUNT(*) as count FROM trademarks WHERE user_id = ? AND risk_level = ?').get(req.user.id, 'high').count;
  const upcomingFees = db.prepare(`
    SELECT COUNT(*) as count FROM patent_fee_reminders r
    JOIN patents p ON r.patent_id = p.id
    WHERE p.user_id = ? AND r.status = 'pending' AND date(r.due_date) <= date('now', '+30 days')
  `).get(req.user.id).count;

  let recentNotifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? AND is_read = 0
    ORDER BY created_at DESC LIMIT 5
  `).all(req.user.id);
  if (recentNotifications.length === 0) {
    recentNotifications = db.prepare(`
      SELECT * FROM notifications
      WHERE is_read = 0
      ORDER BY created_at DESC LIMIT 5
    `).all();
  }

  let totalValue = db.prepare('SELECT COALESCE(SUM(value_estimation), 0) as total FROM patents WHERE user_id = ?').get(req.user.id).total;
  if (!totalValue) {
    totalValue = db.prepare('SELECT COALESCE(SUM(value_estimation), 0) as total FROM patents').get().total;
  }

  let clientCount = 0;
  let contractCount = 0;
  if (req.user.role === 'lawfirm' || req.user.role === 'agency') {
    clientCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE manager_id = ?').get(req.user.id).count;
    contractCount = countForUser('contracts');
  }

  res.json({
    counts: {
      trademarks: trademarkCount,
      patents: patentCount,
      copyrights: copyrightCount,
      cases: caseCount,
      clients: clientCount,
      contracts: contractCount
    },
    active: {
      trademarks: activeTrademarks,
      patents: activePatents,
      cases: activeCases
    },
    alerts: {
      highRiskTrademarks: highRiskCount,
      upcomingFees
    },
    totalPatentValue: totalValue,
    recentNotifications
  });
});

router.get('/notifications', authenticateToken, (req, res) => {
  const db = getDB();
  const { is_read, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE user_id = ?';
  let params = [req.user.id];

  if (is_read !== undefined) {
    whereClause += ' AND is_read = ?';
    params.push(is_read === 'true' ? 1 : 0);
  }

  const count = db.prepare(`SELECT COUNT(*) as total FROM notifications ${whereClause}`).get(...params).total;
  const offset = (page - 1) * pageSize;
  const notifications = db.prepare(`
    SELECT * FROM notifications ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: notifications,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  });
});

router.post('/notifications/:id/read', authenticateToken, (req, res) => {
  const db = getDB();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: '已标记为已读' });
});

export default router;
