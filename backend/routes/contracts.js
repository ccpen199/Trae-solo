const express = require('express');
const router = express.Router();
const db = require('../db');

function generateContractNumber() {
  const date = new Date();
  const prefix = `HT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const last = db.prepare("SELECT MAX(contract_number) as max FROM contracts WHERE contract_number LIKE ?").get(`${prefix}%`);
  let seq = 1;
  if (last.max) {
    seq = parseInt(last.max.replace(prefix, '')) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function checkRoomConflict(roomIds, excludeContractId = null) {
  let sql = `
    SELECT DISTINCT c.id, c.contract_number, c.start_date, c.end_date, c.status
    FROM contracts c
    WHERE c.status IN ('active', 'pending')
  `;
  const params = [];
  
  if (excludeContractId) {
    sql += ' AND c.id != ?';
    params.push(excludeContractId);
  }
  
  const contracts = db.prepare(sql).all(...params);
  
  const conflicts = [];
  for (const contract of contracts) {
    if (contract.room_ids) {
      const contractRooms = contract.room_ids.split(',').map(id => parseInt(id.trim()));
      const commonRooms = roomIds.filter(id => contractRooms.includes(id));
      if (commonRooms.length > 0) {
        conflicts.push({
          contract_id: contract.id,
          contract_number: contract.contract_number,
          room_ids: commonRooms,
          start_date: contract.start_date,
          end_date: contract.end_date,
          status: contract.status
        });
      }
    }
  }
  
  return conflicts;
}

router.get('/', (req, res) => {
  try {
    const { status, approval_status } = req.query;
    let sql = `
      SELECT c.*, l.company_name
      FROM contracts c
      JOIN leads l ON c.lead_id = l.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (approval_status) {
      sql += ' AND c.approval_status = ?';
      params.push(approval_status);
    }
    
    sql += ' ORDER BY c.created_at DESC';
    
    const contracts = db.prepare(sql).all(...params);
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const contract = db.prepare(`
      SELECT c.*, l.company_name, l.contact_person, l.phone
      FROM contracts c
      JOIN leads l ON c.lead_id = l.id
      WHERE c.id = ?
    `).get(req.params.id);
    
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    
    if (contract.room_ids) {
      const roomIdList = contract.room_ids.split(',').map(id => parseInt(id.trim()));
      if (roomIdList.length > 0) {
        const placeholders = roomIdList.map(() => '?').join(',');
        const rooms = db.prepare(`
          SELECT r.*, b.name as building_name, f.floor_number
          FROM rooms r
          JOIN buildings b ON r.building_id = b.id
          JOIN floors f ON r.floor_id = f.id
          WHERE r.id IN (${placeholders})
        `).all(...roomIdList);
        contract.rooms = rooms;
      }
    }
    
    const checkIns = db.prepare('SELECT * FROM check_ins WHERE contract_id = ?').all(req.params.id);
    contract.checkIns = checkIns;
    
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/check-conflict', (req, res) => {
  const { room_ids, contract_id } = req.body;
  try {
    const conflicts = checkRoomConflict(room_ids || [], contract_id);
    res.json({ hasConflict: conflicts.length > 0, conflicts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { lead_id, quote_id, room_ids, start_date, end_date, rent_amount, rent_payment_cycle, deposit_amount, deposit_type, free_rent_days, property_fee, property_fee_cycle, delivery_items, created_by } = req.body;
  try {
    if (!room_ids || room_ids.length === 0) {
      return res.status(400).json({ error: '请选择房源' });
    }
    
    const conflicts = checkRoomConflict(room_ids);
    if (conflicts.length > 0) {
      return res.status(400).json({ error: '房源冲突', conflicts });
    }
    
    for (const roomId of room_ids) {
      const room = db.prepare('SELECT status FROM rooms WHERE id = ?').get(roomId);
      if (!room) {
        return res.status(404).json({ error: `房源 ${roomId} 不存在` });
      }
      if (room.status === 'rented') {
        return res.status(400).json({ error: `房源 ${roomId} 已出租，无法签约` });
      }
    }
    
    if (quote_id) {
      const quote = db.prepare('SELECT is_locked, expire_date FROM quotes WHERE id = ?').get(quote_id);
      if (!quote) {
        return res.status(404).json({ error: '报价单不存在' });
      }
      if (!quote.is_locked) {
        return res.status(400).json({ error: '报价单未锁定，无法签约' });
      }
      if (quote.expire_date && new Date(quote.expire_date) < new Date()) {
        return res.status(400).json({ error: '报价单已过期，请重新报价' });
      }
    }
    
    const contract_number = generateContractNumber();
    
    const result = db.prepare(`
      INSERT INTO contracts (lead_id, quote_id, room_ids, contract_number, start_date, end_date, rent_amount, rent_payment_cycle, deposit_amount, deposit_type, free_rent_days, property_fee, property_fee_cycle, delivery_items, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lead_id, quote_id || null, room_ids.join(','), contract_number, start_date, end_date, rent_amount, rent_payment_cycle || 'month', deposit_amount || 0, deposit_type || '', free_rent_days || 0, property_fee || 0, property_fee_cycle || 'month', delivery_items || '', created_by || '');
    
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/approve', (req, res) => {
  try {
    db.prepare("UPDATE contracts SET approval_status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/sign', (req, res) => {
  const { signed_by_tenant, signed_by_park, sign_date } = req.body;
  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    
    if (contract.approval_status !== 'approved') {
      return res.status(400).json({ error: '合同未审批通过，无法签约' });
    }
    
    db.prepare(`
      UPDATE contracts 
      SET status = 'active', signed_by_tenant = ?, signed_by_park = ?, sign_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(signed_by_tenant || '', signed_by_park || '', sign_date || new Date().toISOString().split('T')[0], req.params.id);
    
    if (contract.room_ids) {
      const roomIds = contract.room_ids.split(',').map(id => parseInt(id.trim()));
      for (const roomId of roomIds) {
        db.prepare("UPDATE rooms SET status = 'rented', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(roomId);
        
        db.prepare(`
          INSERT INTO room_history (room_id, field_name, old_value, new_value)
          VALUES (?, 'status', 'available', 'rented')
        `).run(roomId);
      }
    }
    
    const updatedContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    res.json(updatedContract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/checkin', (req, res) => {
  const { room_id, company_name, check_in_date, actual_check_in_date, handover_status, remarks } = req.body;
  try {
    const contract = db.prepare('SELECT room_ids, status FROM contracts WHERE id = ?').get(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    
    if (contract.status !== 'active') {
      return res.status(400).json({ error: '合同未生效，无法办理入驻' });
    }
    
    if (contract.room_ids) {
      const roomIds = contract.room_ids.split(',').map(id => parseInt(id.trim()));
      if (!roomIds.includes(room_id)) {
        return res.status(400).json({ error: '该房源不属于此合同' });
      }
    }
    
    const result = db.prepare(`
      INSERT INTO check_ins (contract_id, room_id, company_name, check_in_date, actual_check_in_date, handover_status, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, room_id, company_name || '', check_in_date || null, actual_check_in_date || null, handover_status || 'pending', remarks || '');
    
    db.prepare("UPDATE check_ins SET status = 'completed' WHERE id = ?").run(result.lastInsertRowid);
    
    const checkIn = db.prepare('SELECT * FROM check_ins WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(checkIn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const contract = db.prepare('SELECT room_ids, status FROM contracts WHERE id = ?').get(req.params.id);
    if (contract && contract.status === 'active') {
      return res.status(400).json({ error: '已生效合同不能删除' });
    }
    
    db.prepare('DELETE FROM check_ins WHERE contract_id = ?').run(req.params.id);
    db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
