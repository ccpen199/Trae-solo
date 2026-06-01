require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const db = require('./database');
const moment = require('moment');

const app = express();
const PORT = process.env.BACKEND_PORT || 58858;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48858}`
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/buildings', (req, res) => {
  const buildings = db.prepare('SELECT * FROM buildings ORDER BY name').all();
  res.json(buildings);
});

app.post('/api/buildings', (req, res) => {
  const { name, address, total_area } = req.body;
  try {
    const result = db.prepare('INSERT INTO buildings (name, address, total_area) VALUES (?, ?, ?)').run(name, address, total_area);
    res.json({ id: result.lastInsertRowid, name, address, total_area });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/enterprises', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT e.*, b.name as building_name 
    FROM enterprises e 
    LEFT JOIN buildings b ON e.building_id = b.id
  `;
  const params = [];
  if (status) {
    sql += ' WHERE e.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY e.name';
  const enterprises = db.prepare(sql).all(...params);
  res.json(enterprises);
});

app.post('/api/enterprises', (req, res) => {
  const { name, building_id, floor, room_no, area, workstations, contact_person, contact_phone, lease_start_date, lease_end_date } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO enterprises (name, building_id, floor, room_no, area, workstations, contact_person, contact_phone, lease_start_date, lease_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, building_id, floor, room_no, area, workstations, contact_person, contact_phone, lease_start_date, lease_end_date);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/enterprises/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    db.prepare('UPDATE enterprises SET status = ? WHERE id = ?').run(status, id);
    res.json({ id, status });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/meters', (req, res) => {
  const { enterprise_id, building_id, energy_type, is_public } = req.query;
  let sql = `
    SELECT m.*, e.name as enterprise_name, b.name as building_name
    FROM meters m
    LEFT JOIN enterprises e ON m.enterprise_id = e.id
    LEFT JOIN buildings b ON m.building_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (enterprise_id) {
    sql += ' AND m.enterprise_id = ?';
    params.push(enterprise_id);
  }
  if (building_id) {
    sql += ' AND m.building_id = ?';
    params.push(building_id);
  }
  if (energy_type) {
    sql += ' AND m.energy_type = ?';
    params.push(energy_type);
  }
  if (is_public !== undefined) {
    sql += ' AND m.is_public = ?';
    params.push(is_public);
  }
  sql += ' ORDER BY m.meter_no';
  const meters = db.prepare(sql).all(...params);
  res.json(meters);
});

app.post('/api/meters', (req, res) => {
  const { meter_no, meter_name, energy_type, building_id, enterprise_id, location, multiplier, is_public } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO meters (meter_no, meter_name, energy_type, building_id, enterprise_id, location, multiplier, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(meter_no, meter_name, energy_type, building_id, enterprise_id, location, multiplier || 1, is_public || 0);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/meters/:id/change', (req, res) => {
  const { id } = req.params;
  const { new_meter_no, old_final_reading, new_initial_reading, change_date, reason, operator } = req.body;
  
  const oldMeter = db.prepare('SELECT * FROM meters WHERE id = ?').get(id);
  if (!oldMeter) {
    return res.status(404).json({ error: '表计不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO meter_changes (meter_id, old_meter_no, new_meter_no, old_final_reading, new_initial_reading, change_date, reason, operator)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, oldMeter.meter_no, new_meter_no, old_final_reading, new_initial_reading, change_date, reason, operator);

    db.prepare('UPDATE meters SET meter_no = ?, initial_reading = ? WHERE id = ?').run(new_meter_no, new_initial_reading, id);
  });

  try {
    tx();
    res.json({ success: true, message: '换表成功' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/meters/:id/changes', (req, res) => {
  const changes = db.prepare('SELECT * FROM meter_changes WHERE meter_id = ? ORDER BY change_date DESC').all(req.params.id);
  res.json(changes);
});

app.get('/api/meter-readings', (req, res) => {
  const { meter_id, start_date, end_date, status } = req.query;
  let sql = `
    SELECT mr.*, m.meter_no, m.meter_name, m.energy_type, e.name as enterprise_name
    FROM meter_readings mr
    JOIN meters m ON mr.meter_id = m.id
    LEFT JOIN enterprises e ON m.enterprise_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (meter_id) {
    sql += ' AND mr.meter_id = ?';
    params.push(meter_id);
  }
  if (start_date) {
    sql += ' AND mr.reading_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND mr.reading_date <= ?';
    params.push(end_date);
  }
  if (status) {
    sql += ' AND mr.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY mr.reading_date DESC, mr.created_at DESC';
  const readings = db.prepare(sql).all(...params);
  res.json(readings);
});

function detectAnomaly(meterId, readingDate, readingValue) {
  const lastReading = db.prepare(`
    SELECT * FROM meter_readings 
    WHERE meter_id = ? AND reading_date < ? AND status != 'rejected'
    ORDER BY reading_date DESC LIMIT 1
  `).get(meterId, readingDate);

  if (!lastReading) return null;

  if (readingValue < lastReading.reading_value) {
    return { type: 'decrease', message: '读数倒挂', lastValue: lastReading.reading_value };
  }

  const diff = readingValue - lastReading.reading_value;
  const daysDiff = moment(readingDate).diff(moment(lastReading.reading_date), 'days');
  if (daysDiff > 0) {
    const dailyAvg = diff / daysDiff;
    const expectedRange = lastReading.reading_value * 0.5;
    if (diff > expectedRange) {
      return { type: 'spike', message: '读数突增', lastValue: lastReading.reading_value, increase: diff };
    }
  }

  return null;
}

app.post('/api/meter-readings', (req, res) => {
  const readings = Array.isArray(req.body) ? req.body : [req.body];
  const results = [];

  for (const reading of readings) {
    const { meter_id, reading_date, reading_value, reading_type, source } = reading;
    
    const existing = db.prepare(`
      SELECT id FROM meter_readings WHERE meter_id = ? AND reading_date = ?
    `).get(meter_id, reading_date);
    
    if (existing) {
      results.push({ error: '该表当日已有读数记录', meter_id, reading_date });
      continue;
    }
    
    const anomaly = detectAnomaly(meter_id, reading_date, reading_value);
    const status = anomaly ? 'pending_review' : 'normal';
    
    try {
      const result = db.prepare(`
        INSERT INTO meter_readings (meter_id, reading_date, reading_value, reading_type, source, status, anomaly_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(meter_id, reading_date, reading_value, reading_type || 'manual', source || '', status, anomaly?.type || null);
      
      results.push({
        id: result.lastInsertRowid,
        ...reading,
        status,
        anomaly
      });
    } catch (e) {
      results.push({ error: e.message, ...reading });
    }
  }

  res.json(results);
});

app.put('/api/meter-readings/:id/review', (req, res) => {
  const { id } = req.params;
  const { status, reviewed_by, remark } = req.body;
  
  try {
    db.prepare(`
      UPDATE meter_readings 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewed_by, id);
    
    res.json({ id, status, reviewed_by });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/allocation-rules', (req, res) => {
  const { energy_type, status } = req.query;
  let sql = `
    SELECT ar.*, m.meter_no as source_meter_no, m.meter_name as source_meter_name, b.name as building_name
    FROM allocation_rules ar
    LEFT JOIN meters m ON ar.source_meter_id = m.id
    LEFT JOIN buildings b ON ar.building_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (energy_type) {
    sql += ' AND ar.energy_type = ?';
    params.push(energy_type);
  }
  if (status) {
    sql += ' AND ar.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY ar.effective_date DESC';
  const rules = db.prepare(sql).all(...params);
  res.json(rules);
});

app.post('/api/allocation-rules', (req, res) => {
  const { rule_name, energy_type, allocation_type, building_id, source_meter_id, effective_date, description } = req.body;
  
  try {
    if (effective_date) {
      db.prepare(`
        UPDATE allocation_rules 
        SET end_date = date(?, '-1 day'), status = 'inactive'
        WHERE energy_type = ? AND allocation_type = ? AND status = 'active'
        AND (building_id = ? OR (building_id IS NULL AND ? IS NULL))
      `).run(effective_date, energy_type, allocation_type, building_id, building_id);
    }

    const result = db.prepare(`
      INSERT INTO allocation_rules (rule_name, energy_type, allocation_type, building_id, source_meter_id, effective_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(rule_name, energy_type, allocation_type, building_id, source_meter_id, effective_date, description);
    
    res.json({ id: result.lastInsertRowid, ...req.body, status: 'active' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/energy-prices', (req, res) => {
  const prices = db.prepare('SELECT * FROM energy_prices ORDER BY energy_type, effective_date DESC').all();
  res.json(prices);
});

app.get('/api/bills', (req, res) => {
  const { enterprise_id, billing_period, status } = req.query;
  let sql = `
    SELECT b.*, e.name as enterprise_name
    FROM bills b
    JOIN enterprises e ON b.enterprise_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (enterprise_id) {
    sql += ' AND b.enterprise_id = ?';
    params.push(enterprise_id);
  }
  if (billing_period) {
    sql += ' AND b.billing_period = ?';
    params.push(billing_period);
  }
  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY b.created_at DESC';
  const bills = db.prepare(sql).all(...params);
  res.json(bills);
});

app.get('/api/bills/:id', (req, res) => {
  const bill = db.prepare(`
    SELECT b.*, e.name as enterprise_name, e.contact_person, e.contact_phone
    FROM bills b
    JOIN enterprises e ON b.enterprise_id = e.id
    WHERE b.id = ?
  `).get(req.params.id);
  
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' });
  }

  const items = db.prepare(`
    SELECT bi.*, m.meter_no, m.meter_name, ar.rule_name
    FROM bill_items bi
    LEFT JOIN meters m ON bi.meter_id = m.id
    LEFT JOIN allocation_rules ar ON bi.allocation_rule_id = ar.id
    WHERE bi.bill_id = ?
  `).all(req.params.id);

  const logs = db.prepare('SELECT * FROM bill_operation_logs WHERE bill_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ ...bill, items, logs });
});

function calculateUsage(meterId, startDate, endDate) {
  const readings = db.prepare(`
    SELECT * FROM meter_readings 
    WHERE meter_id = ? AND reading_date BETWEEN ? AND ? AND status = 'normal'
    ORDER BY reading_date
  `).all(meterId, startDate, endDate);

  if (readings.length < 2) return 0;

  const meter = db.prepare('SELECT multiplier FROM meters WHERE id = ?').get(meterId);
  const first = readings[0];
  const last = readings[readings.length - 1];
  
  return (last.reading_value - first.reading_value) * (meter?.multiplier || 1);
}

app.post('/api/bills/generate', (req, res) => {
  const { billing_period, enterprise_id, energy_type } = req.body;
  const year = billing_period.substring(0, 4);
  const month = billing_period.substring(4, 6);
  const startDate = `${year}-${month}-01`;
  const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

  const tx = db.transaction(() => {
    let enterprises = [];
    if (enterprise_id) {
      enterprises = db.prepare("SELECT * FROM enterprises WHERE id = ? AND status = 'active'").all(enterprise_id);
    } else {
      enterprises = db.prepare("SELECT * FROM enterprises WHERE status = 'active'").all();
    }

    const energyTypes = energy_type ? [energy_type] : ['electricity', 'water', 'gas', 'cooling'];
    const generatedBills = [];

    for (const ent of enterprises) {
      for (const etype of energyTypes) {
        const existing = db.prepare(`
          SELECT id FROM bills 
          WHERE enterprise_id = ? AND billing_period = ? AND energy_type = ?
        `).get(ent.id, billing_period, etype);
        
        if (existing) continue;

        const price = db.prepare(`
          SELECT * FROM energy_prices 
          WHERE energy_type = ? AND effective_date <= ? AND (end_date IS NULL OR end_date >= ?)
          ORDER BY effective_date DESC LIMIT 1
        `).get(etype, endDate, startDate);

        if (!price) continue;

        const directMeters = db.prepare(`
          SELECT * FROM meters 
          WHERE enterprise_id = ? AND energy_type = ? AND is_public = 0 AND status = 'active'
        `).all(ent.id, etype);

        let directUsage = 0;
        const billItems = [];

        for (const meter of directMeters) {
          const usage = calculateUsage(meter.id, startDate, endDate);
          if (usage > 0) {
            directUsage += usage;
            const firstReading = db.prepare(`
              SELECT id FROM meter_readings 
              WHERE meter_id = ? AND reading_date BETWEEN ? AND ? AND status = 'normal'
              ORDER BY reading_date LIMIT 1
            `).get(meter.id, startDate, endDate);
            
            billItems.push({
              item_type: 'direct',
              meter_id: meter.id,
              meter_reading_id: firstReading?.id,
              usage,
              unit_price: price.price,
              amount: usage * price.price,
              remark: meter.meter_name
            });
          }
        }

        const rules = db.prepare(`
          SELECT ar.*, m.multiplier as source_multiplier
          FROM allocation_rules ar
          JOIN meters m ON ar.source_meter_id = m.id
          WHERE ar.energy_type = ? AND ar.status = 'active'
          AND (ar.building_id = ? OR ar.building_id IS NULL)
        `).all(etype, ent.building_id);

        let allocatedUsage = 0;

        for (const rule of rules) {
          const sourceUsage = calculateUsage(rule.source_meter_id, startDate, endDate);
          
          if (sourceUsage > 0) {
            const directMetersInBuilding = db.prepare(`
              SELECT SUM(
                (SELECT COALESCE(MAX(reading_value) - MIN(reading_value), 0)
                 FROM meter_readings mr 
                 WHERE mr.meter_id = m.id 
                   AND mr.reading_date BETWEEN ? AND ? 
                   AND mr.status = 'normal') * m.multiplier
              ) as total_direct
              FROM meters m
              WHERE m.building_id = ? AND m.energy_type = ? AND m.is_public = 0 AND m.status = 'active'
            `).get(startDate, endDate, rule.building_id, etype);

            const totalDirect = directMetersInBuilding?.total_direct || 0;
            let publicUsage = Math.max(0, sourceUsage - totalDirect);
            let allocationRatio = 0;

            if (rule.allocation_type === 'area' && rule.building_id) {
              const building = db.prepare('SELECT total_area FROM buildings WHERE id = ?').get(rule.building_id);
              if (building && ent.area) {
                allocationRatio = ent.area / building.total_area;
              }
            } else if (rule.allocation_type === 'workstation') {
              const totalWorkstations = db.prepare('SELECT SUM(workstations) as total FROM enterprises WHERE status = "active"').get()?.total || 1;
              allocationRatio = (ent.workstations || 0) / totalWorkstations;
            }

            const entAllocatedUsage = publicUsage * allocationRatio;
            if (entAllocatedUsage > 0) {
              allocatedUsage += entAllocatedUsage;
              billItems.push({
                item_type: 'allocation',
                allocation_rule_id: rule.id,
                usage: entAllocatedUsage,
                unit_price: price.price,
                amount: entAllocatedUsage * price.price,
                remark: rule.rule_name
              });
            }
          }
        }

        const totalUsage = directUsage + allocatedUsage;
        const subtotal = totalUsage * price.price;
        const taxAmount = subtotal * price.tax_rate;
        const totalAmount = subtotal + taxAmount;

        if (totalUsage > 0) {
          const billNo = `BILL-${billing_period}-${String(ent.id).padStart(4, '0')}-${etype.substring(0, 1).toUpperCase()}`;
          
          const billResult = db.prepare(`
            INSERT INTO bills (bill_no, enterprise_id, billing_period, energy_type, 
              direct_usage, allocated_usage, total_usage, unit_price, subtotal, tax_amount, total_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(billNo, ent.id, billing_period, etype, directUsage, allocatedUsage, 
                 totalUsage, price.price, subtotal, taxAmount, totalAmount);

          const billId = billResult.lastInsertRowid;
          const insertItem = db.prepare(`
            INSERT INTO bill_items (bill_id, item_type, meter_id, meter_reading_id, allocation_rule_id, usage, unit_price, amount, remark)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          billItems.forEach(item => {
            insertItem.run(billId, item.item_type, item.meter_id, item.meter_reading_id, 
                          item.allocation_rule_id, item.usage, item.unit_price, item.amount, item.remark);
          });

          db.prepare(`
            INSERT INTO bill_operation_logs (bill_id, operation, operator, remark)
            VALUES (?, ?, ?, ?)
          `).run(billId, 'generate', 'system', `账单生成于 ${new Date().toISOString()}`);

          generatedBills.push({
            id: billId,
            bill_no: billNo,
            enterprise_name: ent.name,
            energy_type: etype,
            total_usage: totalUsage,
            total_amount: totalAmount
          });
        }
      }
    }

    return generatedBills;
  });

  try {
    const bills = tx();
    res.json({ success: true, generated: bills.length, bills });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/bills/:id/confirm', (req, res) => {
  const { id } = req.params;
  const { confirmed_by } = req.body;
  
  try {
    db.prepare(`
      UPDATE bills 
      SET enterprise_confirm_status = 'confirmed', 
          enterprise_confirm_at = CURRENT_TIMESTAMP,
          enterprise_confirm_by = ?,
          status = 'confirmed'
      WHERE id = ?
    `).run(confirmed_by || '企业经办人', id);

    db.prepare(`
      INSERT INTO bill_operation_logs (bill_id, operation, operator, remark)
      VALUES (?, ?, ?, ?)
    `).run(id, 'enterprise_confirm', confirmed_by || '企业经办人', '企业已确认账单');

    res.json({ success: true, message: '账单已确认' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/bills/:id/pay', (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;
  
  try {
    db.prepare(`
      UPDATE bills 
      SET payment_status = 'paid', 
          payment_at = CURRENT_TIMESTAMP,
          payment_method = ?,
          status = 'paid'
      WHERE id = ?
    `).run(payment_method || 'bank_transfer', id);

    db.prepare(`
      INSERT INTO bill_operation_logs (bill_id, operation, operator, remark)
      VALUES (?, ?, ?, ?)
    `).run(id, 'payment', '财务', '账单已收款');

    res.json({ success: true, message: '账单已收款' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/bills/:id/recalculate', (req, res) => {
  const { id } = req.params;
  
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' });
  }

  try {
    db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(id);
    
    const billingPeriod = bill.billing_period;
    const year = billingPeriod.substring(0, 4);
    const month = billingPeriod.substring(4, 6);
    const startDate = `${year}-${month}-01`;
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');
    const etype = bill.energy_type;

    const price = db.prepare(`
      SELECT * FROM energy_prices 
      WHERE energy_type = ? AND effective_date <= ? AND (end_date IS NULL OR end_date >= ?)
      ORDER BY effective_date DESC LIMIT 1
    `).get(etype, endDate, startDate);

    if (!price) {
      return res.status(400).json({ error: '未找到对应能源价格' });
    }

    const ent = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(bill.enterprise_id);

    const directMeters = db.prepare(`
      SELECT * FROM meters 
      WHERE enterprise_id = ? AND energy_type = ? AND is_public = 0 AND status = 'active'
    `).all(bill.enterprise_id, etype);

    let directUsage = 0;
    const billItems = [];

    for (const meter of directMeters) {
      const usage = calculateUsage(meter.id, startDate, endDate);
      if (usage > 0) {
        directUsage += usage;
        const firstReading = db.prepare(`
          SELECT id FROM meter_readings 
          WHERE meter_id = ? AND reading_date BETWEEN ? AND ? AND status = 'normal'
          ORDER BY reading_date LIMIT 1
        `).get(meter.id, startDate, endDate);
        
        billItems.push({
          item_type: 'direct',
          meter_id: meter.id,
          meter_reading_id: firstReading?.id,
          usage,
          unit_price: price.price,
          amount: usage * price.price,
          remark: meter.meter_name
        });
      }
    }

    const rules = db.prepare(`
      SELECT ar.*
      FROM allocation_rules ar
      WHERE ar.energy_type = ? AND ar.status = 'active'
      AND (ar.building_id = ? OR ar.building_id IS NULL)
    `).all(etype, ent.building_id);

    let allocatedUsage = 0;

    for (const rule of rules) {
      const sourceUsage = calculateUsage(rule.source_meter_id, startDate, endDate);
      
      if (sourceUsage > 0) {
        const directMetersInBuilding = db.prepare(`
          SELECT SUM(
            (SELECT COALESCE(MAX(reading_value) - MIN(reading_value), 0)
             FROM meter_readings mr 
             WHERE mr.meter_id = m.id 
               AND mr.reading_date BETWEEN ? AND ? 
               AND mr.status = 'normal') * m.multiplier
          ) as total_direct
          FROM meters m
          WHERE m.building_id = ? AND m.energy_type = ? AND m.is_public = 0 AND m.status = 'active'
        `).get(startDate, endDate, rule.building_id, etype);

        const totalDirect = directMetersInBuilding?.total_direct || 0;
        let publicUsage = Math.max(0, sourceUsage - totalDirect);
        let allocationRatio = 0;

        if (rule.allocation_type === 'area' && rule.building_id) {
          const building = db.prepare('SELECT total_area FROM buildings WHERE id = ?').get(rule.building_id);
          if (building && ent.area) {
            allocationRatio = ent.area / building.total_area;
          }
        } else if (rule.allocation_type === 'workstation') {
          const totalWorkstations = db.prepare('SELECT SUM(workstations) as total FROM enterprises WHERE status = "active"').get()?.total || 1;
          allocationRatio = (ent.workstations || 0) / totalWorkstations;
        }

        const entAllocatedUsage = publicUsage * allocationRatio;
        if (entAllocatedUsage > 0) {
          allocatedUsage += entAllocatedUsage;
          billItems.push({
            item_type: 'allocation',
            allocation_rule_id: rule.id,
            usage: entAllocatedUsage,
            unit_price: price.price,
            amount: entAllocatedUsage * price.price,
            remark: rule.rule_name
          });
        }
      }
    }

    const totalUsage = directUsage + allocatedUsage;
    const subtotal = totalUsage * price.price;
    const taxAmount = subtotal * price.tax_rate;
    const totalAmount = subtotal + taxAmount;

    db.prepare(`
      UPDATE bills 
      SET direct_usage = ?, allocated_usage = ?, total_usage = ?, 
          unit_price = ?, subtotal = ?, tax_amount = ?, total_amount = ?,
          status = 'draft', enterprise_confirm_status = 'pending'
      WHERE id = ?
    `).run(directUsage, allocatedUsage, totalUsage, price.price, subtotal, taxAmount, totalAmount, id);

    const insertItem = db.prepare(`
      INSERT INTO bill_items (bill_id, item_type, meter_id, meter_reading_id, allocation_rule_id, usage, unit_price, amount, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    billItems.forEach(item => {
      insertItem.run(id, item.item_type, item.meter_id, item.meter_reading_id, 
                    item.allocation_rule_id, item.usage, item.unit_price, item.amount, item.remark);
    });

    db.prepare(`
      INSERT INTO bill_operation_logs (bill_id, operation, operator, remark)
      VALUES (?, ?, ?, ?)
    `).run(id, 'recalculate', '系统', '账单已重新计算');

    res.json({ success: true, message: '账单已重算', total_usage: totalUsage, total_amount: totalAmount });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/dashboard/stats', (req, res) => {
  const stats = {};
  
  stats.enterpriseCount = db.prepare("SELECT COUNT(*) as count FROM enterprises WHERE status = 'active'").get().count;
  stats.meterCount = db.prepare("SELECT COUNT(*) as count FROM meters WHERE status = 'active'").get().count;
  stats.billCount = db.prepare("SELECT COUNT(*) as count FROM bills WHERE status != 'draft'").get().count;
  stats.pendingReadings = db.prepare("SELECT COUNT(*) as count FROM meter_readings WHERE status = 'pending_review'").get().count;

  const totalAmount = db.prepare("SELECT SUM(total_amount) as total FROM bills WHERE status != 'draft'").get();
  stats.totalAmount = totalAmount?.total || 0;

  const paidAmount = db.prepare("SELECT SUM(total_amount) as total FROM bills WHERE payment_status = 'paid'").get();
  stats.paidAmount = paidAmount?.total || 0;

  res.json(stats);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
