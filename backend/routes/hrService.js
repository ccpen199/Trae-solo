const express = require('express');
const router = express.Router();
const { db, query, getOne, runTransaction } = require('../utils/db');
const { success, error, paginate, logOperation } = require('../utils/response');
const { auth, requireRole } = require('../middleware/auth');

router.get('/my-company', auth, requireRole('hr', 'admin'), (req, res) => {
  const company = getOne(
    'SELECT * FROM companies WHERE hr_id = ? OR id = (SELECT company_id FROM hr_declarations WHERE hr_id = ? LIMIT 1)',
    [req.user.userId, req.user.userId]
  );
  if (!company) {
    return res.json(error('未查询到关联企业信息', 404));
  }
  const employeeCount = getOne(
    'SELECT COUNT(DISTINCT id_card) as count FROM insurance_records WHERE company_id = ?',
    [company.id]
  );
  res.json(success({ ...company, employeeCount: employeeCount?.count || 0 }));
});

router.get('/declarations', auth, requireRole('hr', 'admin'), (req, res) => {
  const { page = 1, pageSize = 10, status, month } = req.query;
  let sql = `SELECT hd.*, c.company_name, u.name as hr_name 
             FROM hr_declarations hd 
             LEFT JOIN companies c ON hd.company_id = c.id 
             LEFT JOIN users u ON hd.hr_id = u.id 
             WHERE 1=1`;
  const params = [];
  if (req.user.userType === 'hr') {
    sql += ' AND hd.hr_id = ?';
    params.push(req.user.userId);
  }
  if (status && status !== 'all') {
    sql += ' AND hd.status = ?';
    params.push(status);
  }
  if (month) {
    sql += ' AND hd.declaration_month = ?';
    params.push(month);
  }
  sql += ' ORDER BY hd.created_at DESC';
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/declarations/:id', auth, requireRole('hr', 'admin'), (req, res) => {
  const declaration = getOne(
    `SELECT hd.*, c.company_name, c.unified_credit_code, u.name as hr_name 
     FROM hr_declarations hd 
     LEFT JOIN companies c ON hd.company_id = c.id 
     LEFT JOIN users u ON hd.hr_id = u.id 
     WHERE hd.id = ?`,
    [req.params.id]
  );
  if (!declaration) {
    return res.json(error('申报记录不存在', 404));
  }
  const changes = query(
    'SELECT * FROM hr_employee_changes WHERE declaration_id = ? ORDER BY created_at',
    [req.params.id]
  );
  res.json(success({ ...declaration, changes }));
});

router.post('/declarations', auth, requireRole('hr'), (req, res) => {
  const { companyId, declarationMonth, employeeCount, totalBase, totalAmount, changes, remark } = req.body;
  
  const result = runTransaction(() => {
    const decResult = query(
      `INSERT INTO hr_declarations
       (company_id, hr_id, declaration_month, employee_count, total_base, total_amount, status, remark)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [companyId, req.user.userId, declarationMonth, employeeCount, totalBase, totalAmount, remark || '']
    );
    
    if (changes && changes.length > 0) {
      const insertChange = db.prepare(
        `INSERT INTO hr_employee_changes
         (declaration_id, company_id, employee_id_card, employee_name, change_type, change_date, salary, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
      );
      changes.forEach(c => {
        insertChange.run(
          decResult.lastInsertRowid,
          companyId,
          c.employeeIdCard,
          c.employeeName,
          c.changeType,
          c.changeDate,
          c.salary,
        );
      });
    }
    
    return decResult.lastInsertRowid;
  });

  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'hr_service',
    `提交月度申报：${declarationMonth}，人数${employeeCount}`,
    req.ip
  );

  res.json(success({ id: result, message: '申报提交成功，等待审核' }));
});

router.put('/declarations/:id/approve', auth, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;
  query(
    'UPDATE hr_declarations SET status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, remark || '', id]
  );
  query(
    'UPDATE hr_employee_changes SET status = ? WHERE declaration_id = ?',
    [status === 'approved' ? 'approved' : 'rejected', id]
  );
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'hr_service',
    `审核申报：ID=${id}，结论=${status === 'approved' ? '通过' : '驳回'}`,
    req.ip
  );
  res.json(success(null, '审核完成'));
});

router.get('/employees', auth, requireRole('hr', 'admin'), (req, res) => {
  const { page = 1, pageSize = 10, keyword, status } = req.query;
  let sql = `SELECT DISTINCT 
               ir.id_card, 
               ir.user_id,
               u.name, 
               u.phone,
               MAX(ir.payment_month) as last_payment,
               MAX(CASE WHEN ir.insurance_type = 'pension' THEN ir.payment_base END) as base
             FROM insurance_records ir
             LEFT JOIN users u ON ir.id_card = u.id_card
             WHERE ir.company_id = (SELECT company_id FROM hr_declarations WHERE hr_id = ? LIMIT 1)`;
  const params = [req.user.userId];
  if (keyword) {
    sql += ' AND (u.name LIKE ? OR ir.id_card LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += ' GROUP BY ir.id_card, ir.user_id, u.name, u.phone ORDER BY last_payment DESC';
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/employees/:idCard', auth, requireRole('hr', 'admin'), (req, res) => {
  const { idCard } = req.params;
  const basic = getOne(`
    SELECT u.id, u.id_card, u.name, u.phone, u.social_card_no, sc.status as card_status
    FROM users u
    LEFT JOIN social_cards sc ON u.id = sc.user_id
    WHERE u.id_card = ?
  `, [idCard]);
  
  const records = query(`
    SELECT * FROM insurance_records 
    WHERE id_card = ? 
    ORDER BY payment_month DESC 
    LIMIT 24
  `, [idCard]);
  
  const changes = query(`
    SELECT * FROM hr_employee_changes 
    WHERE employee_id_card = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `, [idCard]);

  res.json(success({ basic, records, changes }));
});

router.post('/employee-changes', auth, requireRole('hr'), (req, res) => {
  const { companyId, employees, changeType } = req.body;
  if (!employees || employees.length === 0) {
    return res.json(error('员工列表不能为空', 400));
  }
  const changeDate = new Date().toISOString().slice(0, 10);
  
  runTransaction(() => {
    employees.forEach(emp => {
      query(
        `INSERT INTO hr_employee_changes
         (company_id, employee_id_card, employee_name, change_type, change_date, salary, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [companyId, emp.idCard, emp.name, changeType, changeDate, emp.salary || 0]
      );
    });
  });

  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'hr_service',
    `批量员工异动：类型${changeType}，人数${employees.length}`,
    req.ip
  );

  res.json(success(null, `批量${changeType === 'join' ? '增员' : changeType === 'leave' ? '减员' : '异动'}提交成功`));
});

router.get('/payment-verification', auth, requireRole('hr', 'admin'), (req, res) => {
  const { month, companyId } = req.query;
  const sql = `
    SELECT 
      c.company_name,
      hd.declaration_month,
      hd.employee_count,
      hd.total_base,
      hd.total_amount as declared_amount,
      COALESCE(SUM(ir.personal_payment + ir.company_payment), 0) as actual_paid,
      hd.status
    FROM hr_declarations hd
    LEFT JOIN companies c ON hd.company_id = c.id
    LEFT JOIN insurance_records ir ON ir.company_id = hd.company_id AND ir.payment_month = hd.declaration_month
    WHERE 1=1
  `;
  const params = [];
  if (month) {
    sql += ' AND hd.declaration_month = ?';
    params.push(month);
  }
  if (companyId) {
    sql += ' AND hd.company_id = ?';
    params.push(companyId);
  }
  sql += ' GROUP BY hd.id ORDER BY hd.declaration_month DESC';
  
  const list = query(sql, params).map(item => ({
    ...item,
    difference: item.actual_paid - item.declared_amount,
    status: item.actual_paid >= item.declared_amount ? '已足额缴费' : '待缴费'
  }));
  
  res.json(success(list));
});

router.get('/statistics', auth, requireRole('hr', 'admin'), (req, res) => {
  const companyId = getOne(
    'SELECT company_id FROM hr_declarations WHERE hr_id = ? LIMIT 1',
    [req.user.userId]
  )?.company_id;
  
  const pendingCount = getOne(
    'SELECT COUNT(*) as count FROM hr_declarations WHERE status = \'pending\'' + (companyId ? ' AND company_id = ?' : ''),
    companyId ? [companyId] : []
  ).count;
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentDeclaration = getOne(
    'SELECT * FROM hr_declarations WHERE declaration_month = ?' + (companyId ? ' AND company_id = ?' : ''),
    companyId ? [currentMonth, companyId] : [currentMonth]
  );

  res.json(success({
    pendingCount,
    currentMonth,
    currentDeclaration
  }));
});

module.exports = router;
