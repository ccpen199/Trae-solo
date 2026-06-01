require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 53428;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43428}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const tableColumns = (table) => new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(column => column.name));
const billColumns = tableColumns('bills');
const billAmountExpr = billColumns.has('bill_amount') ? 'bill_amount' : 'amount';
const billDiscountExpr = billColumns.has('discount_amount') ? 'discount_amount' : (billColumns.has('reduction') ? 'reduction' : '0');
const billRemainingExpr = billColumns.has('remaining_amount')
  ? 'remaining_amount'
  : `(${billAmountExpr} - paid_amount - ${billDiscountExpr})`;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const activeContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'active'").get().count;
    const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const unpaidAmount = db.prepare(`SELECT COALESCE(SUM(${billRemainingExpr}), 0) as total FROM bills WHERE status IN ('unpaid', 'partial')`).get().total;
    const overdueBills = db.prepare("SELECT COUNT(*) as count FROM bills WHERE overdue_days > 0").get().count;
    const highRiskCustomers = db.prepare("SELECT COUNT(*) as count FROM customers WHERE credit_level IN ('C', 'D')").get().count;

    res.json({
      totalCustomers,
      activeContracts,
      totalDevices,
      unpaidAmount,
      overdueBills,
      highRiskCustomers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/overdue-trend', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT 
        strftime('%Y-%m', due_date) as month,
        COUNT(*) as count,
        SUM(${billRemainingExpr}) as amount
      FROM bills 
      WHERE overdue_days > 0
      GROUP BY strftime('%Y-%m', due_date)
      ORDER BY month DESC
      LIMIT 6
    `).all();
    res.json(data.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers', (req, res) => {
  try {
    const { status, keyword } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (keyword) {
      sql += " AND (company_name LIKE ? OR contact_person LIKE ? OR contact_phone LIKE ?)";
      const search = `%${keyword}%`;
      params.push(search, search, search);
    }
    sql += ' ORDER BY created_at DESC';

    const customers = db.prepare(sql).all(...params);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    const history = db.prepare('SELECT * FROM lease_history WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
    const contracts = db.prepare('SELECT * FROM contracts WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...customer, history, contracts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const {
      company_name, credit_code, legal_representative, registered_capital,
      established_date, industry, business_scope, address, contact_person,
      contact_phone, contact_email, annual_revenue, employee_count,
      guarantee_type, guarantee_detail, historical_leases, historical_overdue,
      historical_default, credit_score, credit_level, suggested_limit
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO customers (
        company_name, credit_code, legal_representative, registered_capital,
        established_date, industry, business_scope, address, contact_person,
        contact_phone, contact_email, annual_revenue, employee_count,
        credit_score, credit_level, suggested_limit, guarantee_type, guarantee_detail,
        historical_leases, historical_overdue, historical_default, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      company_name, credit_code, legal_representative, registered_capital,
      established_date, industry, business_scope, address, contact_person,
      contact_phone, contact_email, annual_revenue, employee_count,
      credit_score || 600, credit_level || 'C', suggested_limit || 0,
      guarantee_type, guarantee_detail, historical_leases,
      historical_overdue || 0, historical_default || 'no'
    );

    res.json({ id: result.lastInsertRowid, credit_score, credit_level, suggested_limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id/approve', (req, res) => {
  try {
    const { approved_limit, approved_by } = req.body;
    db.prepare(`
      UPDATE customers 
      SET approved_limit = ?, status = 'approved', 
          approved_by = ?, approved_at = datetime('now'),
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(approved_limit, approved_by || '系统', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id/reject', (req, res) => {
  try {
    const { reason, rejected_by } = req.body;
    db.prepare(`
      UPDATE customers 
      SET status = 'rejected', 
          reject_reason = ?, rejected_by = ?, rejected_at = datetime('now'),
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(reason, rejected_by || '系统', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contracts', (req, res) => {
  try {
    const contracts = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contracts/:id', (req, res) => {
  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: '合同不存在' });
    }
    const devices = db.prepare('SELECT * FROM devices WHERE contract_id = ?').all(req.params.id);
    const bills = db.prepare('SELECT * FROM bills WHERE contract_id = ? ORDER BY due_date').all(req.params.id);
    res.json({ ...contract, devices, bills });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contracts', (req, res) => {
  try {
    const {
      customer_id, customer_name, total_amount, lease_term,
      start_date, end_date, deposit, delivery_address,
      insurance_coverage, default_clause, devices
    } = req.body;

    const contractNo = 'HT' + Date.now().toString().slice(-8);

    const stmt = db.prepare(`
      INSERT INTO contracts (
        contract_no, customer_id, customer_name, total_amount, lease_term,
        start_date, end_date, deposit, delivery_address, insurance_coverage, default_clause, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      contractNo, customer_id, customer_name, total_amount, lease_term,
      start_date, end_date, deposit, delivery_address, insurance_coverage, default_clause
    );

    const contractId = result.lastInsertRowid;

    if (devices && devices.length > 0) {
      const deviceStmt = db.prepare(`
        INSERT INTO devices (
          serial_no, device_name, device_model, brand, purchase_price,
          current_value, contract_id, customer_id, current_location, status, delivery_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_use', 'pending')
      `);

      devices.forEach(d => {
        deviceStmt.run(
          'SN' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase(),
          d.device_name, d.device_model, d.brand, d.unit_price,
          d.unit_price * 0.9, contractId, customer_id, delivery_address
        );
      });
    }

    const monthlyRent = total_amount / lease_term;
    const billStmt = db.prepare(`
      INSERT INTO bills (bill_no, contract_id, customer_id, bill_type, amount, due_date, status)
      VALUES (?, ?, ?, 'rent', ?, ?, 'unpaid')
    `);

    for (let i = 0; i < lease_term; i++) {
      const dueDate = new Date(start_date);
      dueDate.setMonth(dueDate.getMonth() + i);
      const billNo = 'ZD' + Date.now() + i.toString().padStart(2, '0');
      billStmt.run(billNo, contractId, customer_id, monthlyRent, dueDate.toISOString().split('T')[0]);
    }

    res.json({ id: contractId, contract_no: contractNo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices', (req, res) => {
  try {
    const { status, contract_id } = req.query;
    let sql = 'SELECT * FROM devices WHERE 1=1';
    const params = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (contract_id) {
      sql += " AND contract_id = ?";
      params.push(contract_id);
    }
    sql += ' ORDER BY created_at DESC';

    const devices = db.prepare(sql).all(...params);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices/:id', (req, res) => {
  try {
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    const maintenance = db.prepare('SELECT * FROM maintenance_records WHERE device_id = ? ORDER BY maintenance_date DESC').all(req.params.id);
    const alerts = db.prepare('SELECT * FROM device_alerts WHERE device_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...device, maintenance, alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/devices/:id/location', (req, res) => {
  try {
    const { current_location } = req.body;
    const device = db.prepare('SELECT current_location FROM devices WHERE id = ?').get(req.params.id);
    
    if (device && device.current_location && device.current_location !== current_location) {
      db.prepare(`
        INSERT INTO device_alerts (device_id, alert_type, alert_level, description, status)
        VALUES (?, 'abnormal_movement', 'warning', ?, 'active')
      `).run(req.params.id, `设备位置从 ${device.current_location} 变更为 ${current_location}`);
      
      db.prepare('UPDATE devices SET abnormal_movement = abnormal_movement + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(req.params.id);
    }

    db.prepare('UPDATE devices SET current_location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(current_location, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/devices/:id/maintenance', (req, res) => {
  try {
    const { maintenance_date, maintenance_type, description, cost, technician } = req.body;
    db.prepare(`
      INSERT INTO maintenance_records (device_id, maintenance_date, maintenance_type, description, cost, technician)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, maintenance_date, maintenance_type, description, cost, technician);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts', (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT da.*, d.serial_no, d.device_name 
      FROM device_alerts da 
      JOIN devices d ON da.device_id = d.id 
      ORDER BY da.created_at DESC
    `).all();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/alerts/:id/resolve', (req, res) => {
  try {
    const { handled_by, handle_result, handle_notes } = req.body;
    db.prepare(`
      UPDATE device_alerts 
      SET status = 'resolved', 
          handled_by = ?, 
          handled_at = datetime('now'),
          handle_result = ?,
          handle_notes = ?
      WHERE id = ?
    `).run(handled_by, handle_result, handle_notes, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bills', (req, res) => {
  try {
    const { status, overdue } = req.query;
    let sql = `
      SELECT b.*, c.contract_no, c.customer_name 
      FROM bills b 
      JOIN contracts c ON b.contract_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += " AND b.status = ?";
      params.push(status);
    }
    if (overdue === 'true') {
      sql += " AND b.overdue_days > 0";
    }
    sql += ' ORDER BY b.due_date ASC';

    const bills = db.prepare(sql).all(...params);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bills/:id', (req, res) => {
  try {
    const bill = db.prepare(`
      SELECT b.*, c.contract_no, c.customer_name 
      FROM bills b 
      JOIN contracts c ON b.contract_id = c.id 
      WHERE b.id = ?
    `).get(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ error: '账单不存在' });
    }
    
    const collections = db.prepare('SELECT * FROM collection_records WHERE bill_id = ? ORDER BY collection_date DESC').all(req.params.id);
    res.json({ ...bill, collections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bills/:id/pay', (req, res) => {
  try {
    const { amount } = req.body;
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ error: '账单不存在' });
    }

    const newPaidAmount = bill.paid_amount + parseFloat(amount);
    let status = bill.status;
    if (newPaidAmount >= bill.amount) {
      status = 'paid';
    } else if (newPaidAmount > 0) {
      status = 'partial';
    }

    db.prepare(`
      UPDATE bills 
      SET paid_amount = ?, paid_date = CURRENT_TIMESTAMP, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newPaidAmount, status, req.params.id);

    res.json({ success: true, new_paid_amount: newPaidAmount, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bills/:id/collection', (req, res) => {
  try {
    const { collection_date, collection_method, collector, result, notes } = req.body;
    db.prepare(`
      INSERT INTO collection_records (bill_id, collection_date, collection_method, collector, result, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, collection_date, collection_method, collector, result, notes);

    db.prepare("UPDATE bills SET collection_status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bills/:id/reduction', (req, res) => {
  try {
    const { reduction_amount, reason } = req.body;
    db.prepare(`
      UPDATE bills 
      SET reduction = reduction + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(reduction_amount, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
