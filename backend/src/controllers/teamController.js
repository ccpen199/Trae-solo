const db = require('../models/database');

exports.getAllTeams = (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT t.*,
             (SELECT COUNT(*) FROM tourists WHERE team_id = t.id) as tourist_count,
             (SELECT COUNT(*) FROM team_reservations WHERE team_id = t.id) as reservation_count
      FROM teams t
    `;
    const params = [];
    
    if (status) {
      sql += ' WHERE t.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY t.departure_date DESC, t.created_at DESC';
    
    const teams = db.prepare(sql).all(...params);
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTeam = (req, res) => {
  try {
    const { name, route, departure_date, sales_manager } = req.body;
    const result = db.prepare(
      'INSERT INTO teams (name, route, departure_date, sales_manager) VALUES (?, ?, ?, ?)'
    ).run(name, route, departure_date, sales_manager);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTeam = (req, res) => {
  try {
    const { id } = req.params;
    const { name, route, departure_date, sales_manager, status } = req.body;
    db.prepare(
      'UPDATE teams SET name = ?, route = ?, departure_date = ?, sales_manager = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, route, departure_date, sales_manager, status, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTeam = (req, res) => {
  try {
    const { id } = req.params;
    
    const reservations = db.prepare('SELECT * FROM team_reservations WHERE team_id = ?').all(id);
    for (const resv of reservations) {
      const plan = db.prepare('SELECT * FROM control_plans WHERE id = ?').get(resv.control_plan_id);
      if (plan) {
        const newUsed = Math.max(0, plan.used_rooms - resv.rooms_needed);
        db.prepare('UPDATE control_plans SET used_rooms = ? WHERE id = ?').run(newUsed, plan.id);
      }
    }
    
    db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeamReservations = (req, res) => {
  try {
    const { teamId } = req.params;
    const reservations = db.prepare(`
      SELECT tr.*, h.name as hotel_name, rt.name as room_type_name, cp.date, cp.price
      FROM team_reservations tr
      LEFT JOIN control_plans cp ON tr.control_plan_id = cp.id
      LEFT JOIN hotels h ON cp.hotel_id = h.id
      LEFT JOIN room_types rt ON cp.room_type_id = rt.id
      WHERE tr.team_id = ?
      ORDER BY tr.created_at DESC
    `).all(teamId);
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createReservation = (req, res) => {
  try {
    const { team_id, control_plan_id, rooms_needed, check_in, check_out } = req.body;
    
    const plan = db.prepare('SELECT * FROM control_plans WHERE id = ?').get(control_plan_id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '控房计划不存在' });
    }
    
    const available = plan.total_rooms - plan.used_rooms;
    if (rooms_needed > available) {
      return res.status(400).json({ success: false, error: `房量不足，可用${available}间` });
    }
    
    const result = db.prepare(
      'INSERT INTO team_reservations (team_id, control_plan_id, rooms_needed, check_in, check_out) VALUES (?, ?, ?, ?, ?)'
    ).run(team_id, control_plan_id, rooms_needed, check_in, check_out);
    
    db.prepare('UPDATE control_plans SET used_rooms = used_rooms + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(rooms_needed, control_plan_id);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelReservation = (req, res) => {
  try {
    const { id } = req.params;
    const reservation = db.prepare('SELECT * FROM team_reservations WHERE id = ?').get(id);
    
    if (!reservation) {
      return res.status(404).json({ success: false, error: '预订不存在' });
    }
    
    db.prepare('UPDATE control_plans SET used_rooms = MAX(0, used_rooms - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(reservation.rooms_needed, reservation.control_plan_id);
    
    db.prepare('UPDATE team_reservations SET status = ? WHERE id = ?').run('cancelled', id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTourists = (req, res) => {
  try {
    const { teamId } = req.params;
    const tourists = db.prepare(
      'SELECT * FROM tourists WHERE team_id = ? ORDER BY created_at DESC'
    ).all(teamId);
    res.json({ success: true, data: tourists });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addTourist = (req, res) => {
  try {
    const { team_id, name, id_card, phone, gender, room_number, check_in, check_out } = req.body;
    const result = db.prepare(
      'INSERT INTO tourists (team_id, name, id_card, phone, gender, room_number, check_in, check_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(team_id, name, id_card, phone, gender, room_number, check_in, check_out);
    
    const count = db.prepare('SELECT COUNT(*) as cnt FROM tourists WHERE team_id = ?').get(team_id);
    db.prepare('UPDATE teams SET tourist_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(count.cnt, team_id);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTourist = (req, res) => {
  try {
    const { id } = req.params;
    const { name, id_card, phone, gender, room_number, check_in, check_out, status } = req.body;
    db.prepare(
      'UPDATE tourists SET name = ?, id_card = ?, phone = ?, gender = ?, room_number = ?, check_in = ?, check_out = ?, status = ? WHERE id = ?'
    ).run(name, id_card, phone, gender, room_number, check_in, check_out, status, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTourist = (req, res) => {
  try {
    const { id } = req.params;
    const tourist = db.prepare('SELECT * FROM tourists WHERE id = ?').get(id);
    
    if (!tourist) {
      return res.status(404).json({ success: false, error: '游客不存在' });
    }
    
    db.prepare('DELETE FROM tourists WHERE id = ?').run(id);
    
    const count = db.prepare('SELECT COUNT(*) as cnt FROM tourists WHERE team_id = ?').get(tourist.team_id);
    db.prepare('UPDATE teams SET tourist_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(count.cnt, tourist.team_id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
