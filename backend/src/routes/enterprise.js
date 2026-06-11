const express = require('express');
const multer = require('multer');
const db = require('../utils/database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function getEnterpriseByUserId(userId) {
  return db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(userId);
}

router.get('/info', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  res.json({ code: 0, data: ent });
});

router.get('/employment-records', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.json({ code: 0, data: [] });
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  const list = db.prepare('SELECT * FROM employment_records WHERE enterprise_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(ent.id, parseInt(pageSize), offset);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM employment_records WHERE enterprise_id = ?').get(ent.id).cnt;
  res.json({ code: 0, data: { list, total: parseInt(total), page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.post('/employment-records/batch-import', authRequired, upload.single('file'), (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.status(400).json({ code: 400, message: '企业信息不存在' });
  let records = [];
  if (req.file) {
    try {
      const csv = req.file.buffer.toString('utf-8');
      const lines = csv.split(/\r?\n/).filter(l => l.trim());
      lines.slice(1).forEach(line => {
        const cols = line.split(/[,\t]/);
        if (cols.length >= 3) {
          records.push({
            employee_name: cols[0]?.trim(),
            id_card: cols[1]?.trim(),
            phone: cols[2]?.trim(),
            position: cols[3]?.trim(),
            start_date: cols[4]?.trim(),
            salary: parseFloat(cols[5]) || 0,
            contract_type: cols[6]?.trim() || '固定期限'
          });
        }
      });
    } catch (e) {}
  } else if (req.body.records) {
    records = req.body.records;
  }
  const batch_no = 'BA' + Date.now().toString().slice(-10);
  const stmt = db.prepare(`INSERT INTO employment_records (enterprise_id, batch_no, employee_name, id_card, phone, position, start_date, salary, contract_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`);
  const tx = db.transaction((list) => {
    list.forEach(r => stmt.run(ent.id, batch_no, r.employee_name, r.id_card || '', r.phone || '', r.position || '', r.start_date || '', r.salary || 0, r.contract_type || '固定期限'));
  });
  tx(records);
  db.prepare('UPDATE enterprises SET employee_count = employee_count + ? WHERE id = ?').run(records.length, ent.id);
  res.json({ code: 0, data: { batch_no, imported: records.length }, message: `成功导入${records.length}条用工备案记录` });
});

router.get('/contracts/pending', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.json({ code: 0, data: [] });
  const list = db.prepare('SELECT * FROM labor_contracts WHERE enterprise_id = ? AND enterprise_sign_status = 0 ORDER BY created_at DESC').all(ent.id);
  res.json({ code: 0, data: list });
});

router.post('/contracts/sign/:id', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.status(400).json({ code: 400, message: '企业信息不存在' });
  const contract = db.prepare('SELECT * FROM labor_contracts WHERE id = ? AND enterprise_id = ?').get(req.params.id, ent.id);
  if (!contract) return res.status(404).json({ code: 404, message: '合同不存在' });
  db.prepare(`UPDATE labor_contracts SET enterprise_sign_status = 1, enterprise_sign_at = datetime('now', 'localtime'),
    status = CASE WHEN user_sign_status = 1 THEN 'completed' ELSE 'signed_enterprise' END WHERE id = ?`).run(contract.id);
  res.json({ code: 0, message: '企业签章成功' });
});

router.get('/training-subsidies', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.json({ code: 0, data: [] });
  const list = db.prepare('SELECT * FROM training_subsidies WHERE enterprise_id = ? ORDER BY created_at DESC').all(ent.id);
  res.json({ code: 0, data: list });
});

router.post('/training-subsidies/apply', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.status(400).json({ code: 400, message: '企业信息不存在' });
  const { training_name, training_type, trainee_count, training_start_date, training_end_date, training_institution, apply_amount, materials } = req.body;
  const application_no = 'PX' + Date.now().toString().slice(-10);
  db.prepare(`INSERT INTO training_subsidies (enterprise_id, application_no, training_name, training_type, trainee_count, training_start_date, training_end_date, training_institution, apply_amount, materials, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`).run(
    ent.id, application_no, training_name, training_type || '职业技能培训', trainee_count || 0,
    training_start_date, training_end_date, training_institution || '', apply_amount || 0, JSON.stringify(materials || [])
  );
  const item = db.prepare('SELECT * FROM training_subsidies WHERE application_no = ?').get(application_no);
  res.json({ code: 0, data: item, message: '培训补贴申请已提交' });
});

router.get('/wage-accounts', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.json({ code: 0, data: [] });
  const list = db.prepare('SELECT * FROM wage_special_accounts WHERE enterprise_id = ? ORDER BY created_at DESC').all(ent.id);
  res.json({ code: 0, data: list });
});

router.post('/wage-accounts/create', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.status(400).json({ code: 400, message: '企业信息不存在' });
  const { bank_name, account_balance, supervisor } = req.body;
  const account_no = 'GZ' + Date.now().toString().slice(-12);
  db.prepare(`INSERT INTO wage_special_accounts (enterprise_id, account_no, bank_name, account_balance, supervisor, status)
    VALUES (?, ?, ?, ?, ?, 'normal')`).run(ent.id, account_no, bank_name || '', account_balance || 0, supervisor || '');
  const item = db.prepare('SELECT * FROM wage_special_accounts WHERE account_no = ?').get(account_no);
  res.json({ code: 0, data: item, message: '工资专户已开立' });
});

router.get('/wage-accounts/:id/records', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.json({ code: 0, data: [] });
  const list = db.prepare('SELECT * FROM wage_payment_records WHERE account_id = ? AND enterprise_id = ? ORDER BY created_at DESC').all(req.params.id, ent.id);
  res.json({ code: 0, data: list });
});

router.post('/wage-accounts/:id/pay', authRequired, (req, res) => {
  const ent = getEnterpriseByUserId(req.user.id);
  if (!ent) return res.status(400).json({ code: 400, message: '企业信息不存在' });
  const account = db.prepare('SELECT * FROM wage_special_accounts WHERE id = ? AND enterprise_id = ?').get(req.params.id, ent.id);
  if (!account) return res.status(404).json({ code: 404, message: '专户不存在' });
  const { employee_name, id_card, amount, pay_month } = req.body;
  if (account.account_balance < amount) return res.status(400).json({ code: 400, message: '专户余额不足' });
  const transaction_no = 'TX' + Date.now().toString().slice(-12);
  db.prepare(`INSERT INTO wage_payment_records (account_id, enterprise_id, employee_name, id_card, amount, pay_month, transaction_no, pay_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')`).run(account.id, ent.id, employee_name, id_card || '', amount || 0, pay_month || '', transaction_no);
  db.prepare('UPDATE wage_special_accounts SET account_balance = account_balance - ?, total_paid = total_paid + ? WHERE id = ?').run(amount, amount, account.id);
  res.json({ code: 0, data: { transaction_no }, message: '工资发放成功' });
});

module.exports = router;
