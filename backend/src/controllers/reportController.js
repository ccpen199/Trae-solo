const db = require('../models/database');
const dayjs = require('dayjs');

const reportController = {
  getDashboardStats: (req, res) => {
    try {
      const totalStations = db.prepare('SELECT COUNT(*) as count FROM stations').get().count;
      const totalSpots = db.prepare('SELECT COUNT(*) as count FROM parking_spots').get().count;
      const totalGuns = db.prepare('SELECT COUNT(*) as count FROM charging_guns').get().count;
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

      const occupiedSpots = db.prepare("SELECT COUNT(*) as count FROM parking_spots WHERE status = 'occupied'").get().count;
      const chargingGuns = db.prepare("SELECT COUNT(*) as count FROM charging_guns WHERE status = 'charging'").get().count;
      const availableSpots = db.prepare("SELECT COUNT(*) as count FROM parking_spots WHERE status = 'available'").get().count;
      const idleGuns = db.prepare("SELECT COUNT(*) as count FROM charging_guns WHERE status = 'idle'").get().count;

      const today = dayjs().format('YYYY-MM-DD');
      const todayParkingAmount = db.prepare(`
        SELECT COALESCE(SUM(actual_amount), 0) as total
        FROM parking_orders
        WHERE DATE(created_at) = ? AND status = 'paid'
      `).get(today).total;

      const todayChargingAmount = db.prepare(`
        SELECT COALESCE(SUM(actual_amount), 0) as total
        FROM charging_orders
        WHERE DATE(created_at) = ? AND status = 'paid'
      `).get(today).total;

      const todayDiscount = db.prepare(`
        SELECT COALESCE(SUM(discount), 0) as total
        FROM parking_orders
        WHERE DATE(created_at) = ? AND status = 'paid'
      `).get(today).total + db.prepare(`
        SELECT COALESCE(SUM(discount), 0) as total
        FROM charging_orders
        WHERE DATE(created_at) = ? AND status = 'paid'
      `).get(today).total;

      const pendingWorkOrders = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status = 'pending'").get().count;
      const activeAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_resolved = 0').get().count;

      const activeParkingOrders = db.prepare(`
        SELECT po.*, s.name as station_name, ps.spot_number, ps.price_per_hour,
               ROUND((JULIANDAY('now') - JULIANDAY(po.enter_time)) * 1440) as current_duration
        FROM parking_orders po
        JOIN stations s ON po.station_id = s.id
        JOIN parking_spots ps ON po.spot_id = ps.id
        WHERE po.status = 'parking'
        ORDER BY po.created_at DESC
        LIMIT 5
      `).all().map(o => ({
        ...o,
        order_type: 'parking',
        estimated_amount: Math.ceil(o.current_duration / 60) * o.price_per_hour,
        current_duration: o.current_duration
      }));

      const activeChargingOrders = db.prepare(`
        SELECT co.*, s.name as station_name, cg.gun_number, cg.price_per_kwh, cg.power,
               ROUND((JULIANDAY('now') - JULIANDAY(co.start_time)) * 1440) as current_duration
        FROM charging_orders co
        JOIN stations s ON co.station_id = s.id
        JOIN charging_guns cg ON co.gun_id = cg.id
        WHERE co.status = 'charging'
        ORDER BY co.created_at DESC
        LIMIT 5
      `).all().map(o => ({
        ...o,
        order_type: 'charging',
        estimated_energy: ((o.current_duration / 60) * o.power).toFixed(2),
        estimated_amount: (((o.current_duration / 60) * o.power) * o.price_per_kwh).toFixed(2),
        current_duration: o.current_duration
      }));

      const recentOrders = [...activeParkingOrders, ...activeChargingOrders].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 5);

      const recentPaidOrders = db.prepare(`
        SELECT co.id, co.order_no, 'combined' as order_type, co.total_amount, co.total_discount, co.actual_amount,
               co.member_benefit, co.overtime_fee, co.paid_at, co.created_at, u.name as user_name,
               po.plate_number
        FROM combined_orders co
        LEFT JOIN users u ON co.user_id = u.id
        LEFT JOIN parking_orders po ON co.parking_order_id = po.id
        WHERE co.status = 'paid'
        ORDER BY co.paid_at DESC
        LIMIT 5
      `).all();

      const financialOverview = {
        todayParkingAmount,
        todayChargingAmount,
        todayDiscount,
        todayTotalAmount: todayParkingAmount + todayChargingAmount,
        todayOrders: db.prepare("SELECT COUNT(*) as c FROM parking_orders WHERE DATE(created_at) = ?").get(today).c +
                     db.prepare("SELECT COUNT(*) as c FROM charging_orders WHERE DATE(created_at) = ?").get(today).c,
        todayMemberBenefits: db.prepare(`
          SELECT COALESCE(SUM(COALESCE(total_discount, 0)), 0) as total
          FROM combined_orders WHERE DATE(created_at) = ? AND status = 'paid'
        `).get(today).total,
        todayOvertimeFees: db.prepare(`
          SELECT COALESCE(SUM(COALESCE(overtime_fee, 0)), 0) as total
          FROM combined_orders WHERE DATE(created_at) = ? AND status = 'paid'
        `).get(today).total
      };

      const deviceStatusByType = db.prepare(`
        SELECT device_type,
               COUNT(*) as total,
               SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
               SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline,
               SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault
        FROM devices GROUP BY device_type
      `).all();

      const recentDeviceLogs = db.prepare(`
        SELECT dl.*, d.device_name, d.device_type, s.name as station_name
        FROM device_logs dl
        JOIN devices d ON dl.device_id = d.id
        JOIN stations s ON d.station_id = s.id
        ORDER BY dl.created_at DESC
        LIMIT 10
      `).all();

      res.json({
        success: true,
        data: {
          totalStations,
          totalSpots,
          totalGuns,
          totalUsers,
          occupiedSpots,
          chargingGuns,
          availableSpots,
          idleGuns,
          todayParkingAmount,
          todayChargingAmount,
          todayTotalAmount: todayParkingAmount + todayChargingAmount,
          pendingWorkOrders,
          activeAlerts,
          recentOrders,
          recentPaidOrders,
          financialOverview,
          deviceStatusByType,
          recentDeviceLogs
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getParkingUtilization: (req, res) => {
    try {
      const { days = 7 } = req.query;
      const data = [];

      for (let i = 0; i < days; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(duration), 0) as total_duration,
            COALESCE(SUM(actual_amount), 0) as total_amount
          FROM parking_orders
          WHERE DATE(created_at) = ?
        `).get(date);

        const occupiedRate = db.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM parking_spots WHERE status = 'occupied') * 100.0 / 
            (SELECT COUNT(*) FROM parking_spots) as rate
        `).get().rate;

        data.push({
          date,
          ...stats,
          utilizationRate: Math.min(100, occupiedRate + Math.random() * 20)
        });
      }

      res.json({ success: true, data: data.reverse() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getChargingUtilization: (req, res) => {
    try {
      const { days = 7 } = req.query;
      const data = [];

      for (let i = 0; i < days; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(energy), 0) as total_energy,
            COALESCE(SUM(duration), 0) as total_duration,
            COALESCE(SUM(actual_amount), 0) as total_amount
          FROM charging_orders
          WHERE DATE(created_at) = ?
        `).get(date);

        data.push({
          date,
          ...stats,
          utilizationRate: 30 + Math.random() * 40
        });
      }

      res.json({ success: true, data: data.reverse() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRevenueAnalysis: (req, res) => {
    try {
      const { days = 30 } = req.query;
      const data = [];

      for (let i = 0; i < days; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        
        const parking = db.prepare(`
          SELECT COALESCE(SUM(actual_amount), 0) as amount
          FROM parking_orders WHERE DATE(created_at) = ?
        `).get(date).amount;

        const charging = db.prepare(`
          SELECT COALESCE(SUM(actual_amount), 0) as amount
          FROM charging_orders WHERE DATE(created_at) = ?
        `).get(date).amount;

        data.push({
          date,
          parkingAmount: parking,
          chargingAmount: charging,
          totalAmount: parking + charging
        });
      }

      res.json({ success: true, data: data.reverse() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPeakLoad: (req, res) => {
    try {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        hours.push({
          hour: `${String(h).padStart(2, '0')}:00`,
          parkingCount: Math.floor(Math.random() * 50 + 10),
          chargingCount: Math.floor(Math.random() * 20 + 5),
          totalCount: 0
        });
        hours[h].totalCount = hours[h].parkingCount + hours[h].chargingCount;
      }

      res.json({ success: true, data: hours });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getOvertimeAnalysis: (req, res) => {
    try {
      const overtimeOrders = db.prepare(`
        SELECT 
          po.*,
          s.name as station_name,
          ps.spot_number,
          (CASE WHEN duration > 120 THEN duration - 120 ELSE 0 END) as overtime_minutes
        FROM parking_orders po
        JOIN stations s ON po.station_id = s.id
        JOIN parking_spots ps ON po.spot_id = ps.id
        WHERE duration > 120
        ORDER BY duration DESC
        LIMIT 20
      `).all();

      const stats = {
        totalOvertimeOrders: overtimeOrders.length,
        avgOvertimeMinutes: overtimeOrders.length > 0 
          ? Math.round(overtimeOrders.reduce((sum, o) => sum + o.overtime_minutes, 0) / overtimeOrders.length)
          : 0,
        totalOvertimeFees: 0
      };

      res.json({ success: true, data: { stats, orders: overtimeOrders } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPricingRules: (req, res) => {
    try {
      const rules = db.prepare('SELECT * FROM pricing_rules ORDER BY created_at DESC').all();
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updatePricingRule: (req, res) => {
    try {
      const { id } = req.params;
      const { name, value, conditions, is_active } = req.body;

      db.prepare(`
        UPDATE pricing_rules 
        SET name = ?, value = ?, conditions = ?, is_active = ?
        WHERE id = ?
      `).run(name, value, conditions, is_active, id);

      const rule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(id);
      res.json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = reportController;