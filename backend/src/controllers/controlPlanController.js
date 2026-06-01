const db = require('../models/database');
const dayjs = require('dayjs');

exports.getAllPlans = (req, res) => {
  try {
    const { startDate, endDate, hotelId } = req.query;
    let sql = `
      SELECT cp.*, h.name as hotel_name, rt.name as room_type_name,
             (cp.total_rooms - cp.used_rooms) as available_rooms
      FROM control_plans cp
      LEFT JOIN hotels h ON cp.hotel_id = h.id
      LEFT JOIN room_types rt ON cp.room_type_id = rt.id
      WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
      sql += ' AND cp.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND cp.date <= ?';
      params.push(endDate);
    }
    if (hotelId) {
      sql += ' AND cp.hotel_id = ?';
      params.push(hotelId);
    }
    sql += ' ORDER BY cp.date DESC, cp.created_at DESC';
    
    const plans = db.prepare(sql).all(...params);
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPlan = (req, res) => {
  try {
    const { hotel_id, room_type_id, date, total_rooms, price, release_date, team_name, created_by } = req.body;
    
    const existing = db.prepare(
      'SELECT * FROM control_plans WHERE hotel_id = ? AND room_type_id = ? AND date = ?'
    ).get(hotel_id, room_type_id, date);
    
    if (existing) {
      return res.status(400).json({ success: false, error: '该酒店房型在该日期已有控房计划' });
    }
    
    const result = db.prepare(
      `INSERT INTO control_plans 
       (hotel_id, room_type_id, date, total_rooms, price, release_date, team_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(hotel_id, room_type_id, date, total_rooms, price, release_date, team_name, created_by);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePlan = (req, res) => {
  try {
    const { id } = req.params;
    const { total_rooms, price, release_date, team_name } = req.body;
    
    const plan = db.prepare('SELECT * FROM control_plans WHERE id = ?').get(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '控房计划不存在' });
    }
    
    if (total_rooms < plan.used_rooms) {
      return res.status(400).json({ success: false, error: '总房量不能小于已使用房量' });
    }
    
    db.prepare(
      `UPDATE control_plans 
       SET total_rooms = ?, price = ?, release_date = ?, team_name = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(total_rooms, price, release_date, team_name, id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deletePlan = (req, res) => {
  try {
    const { id } = req.params;
    const plan = db.prepare('SELECT * FROM control_plans WHERE id = ?').get(id);
    
    if (plan && plan.used_rooms > 0) {
      return res.status(400).json({ success: false, error: '该控房计划已有房间被使用，无法删除' });
    }
    
    db.prepare('DELETE FROM control_plans WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.adjustRooms = (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment_type, rooms_change, reason, operator, team_id } = req.body;
    
    const plan = db.prepare('SELECT * FROM control_plans WHERE id = ?').get(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '控房计划不存在' });
    }
    
    let newUsedRooms = plan.used_rooms;
    if (adjustment_type === 'occupy') {
      newUsedRooms += rooms_change;
      if (newUsedRooms > plan.total_rooms) {
        return res.status(400).json({ success: false, error: '超量占房已被拦截，房量不足' });
      }
    } else if (adjustment_type === 'release') {
      newUsedRooms -= rooms_change;
      if (newUsedRooms < 0) newUsedRooms = 0;
    }
    
    db.prepare('UPDATE control_plans SET used_rooms = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newUsedRooms, id);
    db.prepare(
      'INSERT INTO room_adjustments (control_plan_id, team_id, adjustment_type, rooms_change, reason, operator) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, team_id, adjustment_type, rooms_change, reason, operator);
    
    res.json({ success: true, data: { used_rooms: newUsedRooms } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAdjustments = (req, res) => {
  try {
    const { planId } = req.params;
    const adjustments = db.prepare(`
      SELECT ra.*, t.name as team_name
      FROM room_adjustments ra
      LEFT JOIN teams t ON ra.team_id = t.id
      WHERE ra.control_plan_id = ?
      ORDER BY ra.created_at DESC
    `).all(planId);
    res.json({ success: true, data: adjustments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.checkExpiredPlans = (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const expiredPlans = db.prepare(`
      SELECT cp.*, h.name as hotel_name, rt.name as room_type_name
      FROM control_plans cp
      LEFT JOIN hotels h ON cp.hotel_id = h.id
      LEFT JOIN room_types rt ON cp.room_type_id = rt.id
      WHERE cp.release_date <= ? AND cp.used_rooms < cp.total_rooms
      ORDER BY cp.release_date
    `).all(today);
    
    res.json({ success: true, data: expiredPlans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
