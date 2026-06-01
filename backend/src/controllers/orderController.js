const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const generateOrderNo = () => {
  return 'ORD' + Date.now().toString() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

const orderController = {
  createParkingOrder: (req, res) => {
    try {
      const { station_id, spot_id, plate_number, user_id } = req.body;
      const order_no = generateOrderNo();

      const result = db.prepare(`
        INSERT INTO parking_orders 
        (order_no, user_id, station_id, spot_id, plate_number, enter_time, status)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'parking')
      `).run(order_no, user_id || null, station_id, spot_id, plate_number);

      db.prepare('UPDATE parking_spots SET status = ? WHERE id = ?').run('occupied', spot_id);

      const order = db.prepare('SELECT * FROM parking_orders WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createChargingOrder: (req, res) => {
    try {
      const { station_id, gun_id, user_id, start_soc } = req.body;
      const order_no = generateOrderNo();

      const result = db.prepare(`
        INSERT INTO charging_orders 
        (order_no, user_id, station_id, gun_id, start_time, start_soc, status)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'charging')
      `).run(order_no, user_id || null, station_id, gun_id, start_soc || 20);

      db.prepare('UPDATE charging_guns SET status = ? WHERE id = ?').run('charging', gun_id);

      const order = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  stopCharging: (req, res) => {
    try {
      const { id } = req.params;
      const { end_soc } = req.body;

      const order = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(id);
      if (!order || order.status !== 'charging') {
        return res.status(400).json({ success: false, message: 'Invalid charging order' });
      }

      const startTime = dayjs(order.start_time);
      const endTime = dayjs();
      const duration = endTime.diff(startTime, 'minute');
      const energy = (duration / 60) * 7;
      const gun = db.prepare('SELECT price_per_kwh FROM charging_guns WHERE id = ?').get(order.gun_id);
      const amount = energy * gun.price_per_kwh;

      db.prepare(`
        UPDATE charging_orders 
        SET end_time = CURRENT_TIMESTAMP, duration = ?, end_soc = ?, energy = ?, amount = ?, actual_amount = ?, status = 'completed'
        WHERE id = ?
      `).run(duration, end_soc || 80, energy.toFixed(2), amount.toFixed(2), amount.toFixed(2), id);

      db.prepare('UPDATE charging_guns SET status = ? WHERE id = ?').run('idle', order.gun_id);

      const updatedOrder = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(id);
      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  exitParking: (req, res) => {
    try {
      const { id } = req.params;

      const order = db.prepare('SELECT * FROM parking_orders WHERE id = ?').get(id);
      if (!order || order.status !== 'parking') {
        return res.status(400).json({ success: false, message: 'Invalid parking order' });
      }

      const enterTime = dayjs(order.enter_time);
      const exitTime = dayjs();
      const duration = exitTime.diff(enterTime, 'minute');
      const spot = db.prepare('SELECT price_per_hour FROM parking_spots WHERE id = ?').get(order.spot_id);
      const amount = Math.ceil(duration / 60) * spot.price_per_hour;

      db.prepare(`
        UPDATE parking_orders 
        SET exit_time = CURRENT_TIMESTAMP, duration = ?, amount = ?, actual_amount = ?, status = 'pending'
        WHERE id = ?
      `).run(duration, amount.toFixed(2), amount.toFixed(2), id);

      db.prepare('UPDATE parking_spots SET status = ? WHERE id = ?').run('available', order.spot_id);

      const updatedOrder = db.prepare('SELECT * FROM parking_orders WHERE id = ?').get(id);
      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getOrders: (req, res) => {
    try {
      const { type = 'all', status } = req.query;
      let orders = [];

      if (type === 'all' || type === 'parking') {
        const parkingOrders = db.prepare(`
          SELECT po.*, s.name as station_name, ps.spot_number
          FROM parking_orders po
          JOIN stations s ON po.station_id = s.id
          JOIN parking_spots ps ON po.spot_id = ps.id
          ${status ? 'WHERE po.status = ?' : ''}
          ORDER BY po.created_at DESC
        `).all(status ? [status] : []);
        orders = [...orders, ...parkingOrders.map(o => ({ ...o, order_type: 'parking' }))];
      }

      if (type === 'all' || type === 'charging') {
        const chargingOrders = db.prepare(`
          SELECT co.*, s.name as station_name, cg.gun_number
          FROM charging_orders co
          JOIN stations s ON co.station_id = s.id
          JOIN charging_guns cg ON co.gun_id = cg.id
          ${status ? 'WHERE co.status = ?' : ''}
          ORDER BY co.created_at DESC
        `).all(status ? [status] : []);
        orders = [...orders, ...chargingOrders.map(o => ({ ...o, order_type: 'charging' }))];
      }

      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getCombinedOrders: (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT co.*, 
          u.name as user_name, u.phone,
          po.plate_number, po.enter_time, po.exit_time, po.duration as parking_duration,
          po.amount as parking_amount, po.discount as parking_discount,
          co2.energy, co2.duration as charging_duration,
          co2.amount as charging_amount, co2.discount as charging_discount
        FROM combined_orders co
        LEFT JOIN users u ON co.user_id = u.id
        LEFT JOIN parking_orders po ON co.parking_order_id = po.id
        LEFT JOIN charging_orders co2 ON co.charging_order_id = co2.id
        ORDER BY co.created_at DESC
      `).all();

      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createCombinedPayment: (req, res) => {
    try {
      const { parking_order_id, charging_order_id, user_id, payment_method } = req.body;

      const parkingOrder = parking_order_id ? 
        db.prepare('SELECT * FROM parking_orders WHERE id = ?').get(parking_order_id) : null;
      const chargingOrder = charging_order_id ? 
        db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(charging_order_id) : null;

      let totalAmount = 0;
      let totalDiscount = 0;

      if (parkingOrder) {
        totalAmount += parkingOrder.amount || 0;
        totalDiscount += parkingOrder.discount || 0;
      }
      if (chargingOrder) {
        totalAmount += chargingOrder.amount || 0;
        totalDiscount += chargingOrder.discount || 0;
      }

      const actualAmount = totalAmount - totalDiscount;
      const order_no = generateOrderNo();

      const result = db.prepare(`
        INSERT INTO combined_orders 
        (order_no, user_id, parking_order_id, charging_order_id, total_amount, total_discount, actual_amount, status, paid_at, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP, ?)
      `).run(order_no, user_id || null, parking_order_id || null, charging_order_id || null, 
             totalAmount, totalDiscount, actualAmount, payment_method || 'wechat');

      if (parking_order_id) {
        db.prepare('UPDATE parking_orders SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run('paid', parking_order_id);
      }
      if (charging_order_id) {
        db.prepare('UPDATE charging_orders SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run('paid', charging_order_id);
      }

      const combinedOrder = db.prepare('SELECT * FROM combined_orders WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: combinedOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getOrderDetail: (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.query;

      let order;
      if (type === 'parking') {
        order = db.prepare(`
          SELECT po.*, s.name as station_name, s.address, ps.spot_number
          FROM parking_orders po
          JOIN stations s ON po.station_id = s.id
          JOIN parking_spots ps ON po.spot_id = ps.id
          WHERE po.id = ?
        `).get(id);
      } else {
        order = db.prepare(`
          SELECT co.*, s.name as station_name, s.address, cg.gun_number
          FROM charging_orders co
          JOIN stations s ON co.station_id = s.id
          JOIN charging_guns cg ON co.gun_id = cg.id
          WHERE co.id = ?
        `).get(id);
      }

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = orderController;