const db = require('../models/database');

exports.getConfirmations = (req, res) => {
  try {
    const { teamId, hotelId } = req.query;
    let sql = `
      SELECT hc.*, t.name as team_name, h.name as hotel_name
      FROM hotel_confirmations hc
      LEFT JOIN teams t ON hc.team_id = t.id
      LEFT JOIN hotels h ON hc.hotel_id = h.id
      WHERE 1=1
    `;
    const params = [];
    
    if (teamId) {
      sql += ' AND hc.team_id = ?';
      params.push(teamId);
    }
    if (hotelId) {
      sql += ' AND hc.hotel_id = ?';
      params.push(hotelId);
    }
    sql += ' ORDER BY hc.created_at DESC';
    
    const confirmations = db.prepare(sql).all(...params);
    res.json({ success: true, data: confirmations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createConfirmation = (req, res) => {
  try {
    const { team_id, hotel_id, confirmed_rooms, remark } = req.body;
    const result = db.prepare(
      `INSERT INTO hotel_confirmations 
       (team_id, hotel_id, confirmed_rooms, remark)
       VALUES (?, ?, ?, ?)`
    ).run(team_id, hotel_id, confirmed_rooms, remark);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateConfirmation = (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed_rooms, actual_checkin, cancelled, no_show, price_diff, invoice_status, status, remark } = req.body;
    db.prepare(
      `UPDATE hotel_confirmations 
       SET confirmed_rooms = ?, actual_checkin = ?, cancelled = ?, no_show = ?, 
           price_diff = ?, invoice_status = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(confirmed_rooms, actual_checkin, cancelled, no_show, price_diff, invoice_status, status, remark, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSettlements = (req, res) => {
  try {
    const { teamId, hotelId, status } = req.query;
    let sql = `
      SELECT s.*, t.name as team_name, h.name as hotel_name
      FROM settlements s
      LEFT JOIN teams t ON s.team_id = t.id
      LEFT JOIN hotels h ON s.hotel_id = h.id
      WHERE 1=1
    `;
    const params = [];
    
    if (teamId) {
      sql += ' AND s.team_id = ?';
      params.push(teamId);
    }
    if (hotelId) {
      sql += ' AND s.hotel_id = ?';
      params.push(hotelId);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY s.created_at DESC';
    
    const settlements = db.prepare(sql).all(...params);
    res.json({ success: true, data: settlements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSettlement = (req, res) => {
  try {
    const { team_id, hotel_id, total_amount, remark } = req.body;
    const result = db.prepare(
      'INSERT INTO settlements (team_id, hotel_id, total_amount, remark) VALUES (?, ?, ?, ?)'
    ).run(team_id, hotel_id, total_amount, remark);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSettlement = (req, res) => {
  try {
    const { id } = req.params;
    const { total_amount, actual_amount, paid_amount, invoice_amount, status, remark } = req.body;
    db.prepare(
      `UPDATE settlements 
       SET total_amount = ?, actual_amount = ?, paid_amount = ?, invoice_amount = ?, 
           status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(total_amount, actual_amount, paid_amount, invoice_amount, status, remark, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDashboardStats = (req, res) => {
  try {
    const totalHotels = db.prepare('SELECT COUNT(*) as count FROM hotels').get().count;
    const totalTeams = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
    const activeTeams = db.prepare("SELECT COUNT(*) as count FROM teams WHERE status = 'active'").get().count;
    const totalTourists = db.prepare('SELECT COUNT(*) as count FROM tourists').get().count;
    
    const roomStats = db.prepare(`
      SELECT 
        SUM(total_rooms) as total_rooms,
        SUM(used_rooms) as used_rooms
      FROM control_plans
    `).get();
    
    const pendingSettlements = db.prepare("SELECT COUNT(*) as count FROM settlements WHERE status = 'pending'").get().count;
    
    res.json({
      success: true,
      data: {
        totalHotels,
        totalTeams,
        activeTeams,
        totalTourists,
        totalRooms: roomStats.total_rooms || 0,
        usedRooms: roomStats.used_rooms || 0,
        availableRooms: (roomStats.total_rooms || 0) - (roomStats.used_rooms || 0),
        pendingSettlements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
