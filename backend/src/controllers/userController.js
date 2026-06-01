const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const userController = {
  getAllUsers: (req, res) => {
    try {
      const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getUserById: (req, res) => {
    try {
      const { id } = req.params;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const reservations = db.prepare(`
        SELECT r.*, s.name as station_name, ps.spot_number
        FROM reservations r
        JOIN stations s ON r.station_id = s.id
        LEFT JOIN parking_spots ps ON r.spot_id = ps.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `).all(id);

      const parkingOrders = db.prepare(`
        SELECT po.*, s.name as station_name, ps.spot_number
        FROM parking_orders po
        JOIN stations s ON po.station_id = s.id
        JOIN parking_spots ps ON po.spot_id = ps.id
        WHERE po.user_id = ?
        ORDER BY po.created_at DESC
        LIMIT 10
      `).all(id);

      const chargingOrders = db.prepare(`
        SELECT co.*, s.name as station_name, cg.gun_number
        FROM charging_orders co
        JOIN stations s ON co.station_id = s.id
        JOIN charging_guns cg ON co.gun_id = cg.id
        WHERE co.user_id = ?
        ORDER BY co.created_at DESC
        LIMIT 10
      `).all(id);

      res.json({
        success: true,
        data: { user, reservations, parkingOrders, chargingOrders }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createUser: (req, res) => {
    try {
      const { phone, name, plate_number, member_level } = req.body;

      const result = db.prepare(`
        INSERT INTO users (phone, name, plate_number, balance, member_level)
        VALUES (?, ?, ?, 0, ?)
      `).run(phone, name || '', plate_number || '', member_level || 'normal');

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateUser: (req, res) => {
    try {
      const { id } = req.params;
      const { name, plate_number, member_level, balance } = req.body;

      const updates = [];
      const params = [];

      if (name !== undefined) { updates.push('name = ?'); params.push(name); }
      if (plate_number !== undefined) { updates.push('plate_number = ?'); params.push(plate_number); }
      if (member_level !== undefined) { updates.push('member_level = ?'); params.push(member_level); }
      if (balance !== undefined) { updates.push('balance = ?'); params.push(balance); }

      if (updates.length > 0) {
        params.push(id);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(params);
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createReservation: (req, res) => {
    try {
      const { user_id, station_id, spot_id, reserve_time, expire_time } = req.body;
      const reservation_no = 'RES' + Date.now().toString().slice(-8);

      const result = db.prepare(`
        INSERT INTO reservations 
        (reservation_no, user_id, station_id, spot_id, reserve_time, expire_time, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
      `).run(reservation_no, user_id, station_id, spot_id || null, reserve_time, expire_time || null);

      if (spot_id) {
        db.prepare("UPDATE parking_spots SET status = 'reserved' WHERE id = ?").run(spot_id);
      }

      const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: reservation });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getReservations: (req, res) => {
    try {
      const { status, user_id } = req.query;
      
      let sql = `
        SELECT r.*, u.name as user_name, u.phone, u.plate_number,
               s.name as station_name, ps.spot_number
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN stations s ON r.station_id = s.id
        LEFT JOIN parking_spots ps ON r.spot_id = ps.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        sql += ' AND r.status = ?';
        params.push(status);
      }
      if (user_id) {
        sql += ' AND r.user_id = ?';
        params.push(user_id);
      }

      sql += ' ORDER BY r.created_at DESC';
      const reservations = db.prepare(sql).all(params);

      res.json({ success: true, data: reservations });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  cancelReservation: (req, res) => {
    try {
      const { id } = req.params;

      const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
      if (!reservation) {
        return res.status(404).json({ success: false, message: 'Reservation not found' });
      }

      db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(id);
      
      if (reservation.spot_id) {
        db.prepare("UPDATE parking_spots SET status = 'available' WHERE id = ?").run(reservation.spot_id);
      }

      const updated = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = userController;