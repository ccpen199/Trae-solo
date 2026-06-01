const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;

    const orderStats = db.prepare(`
      SELECT status, COUNT(*) AS count FROM orders GROUP BY status
    `).all();

    const dispatchStats = db.prepare(`
      SELECT status, COUNT(*) AS count FROM dispatches GROUP BY status
    `).all();

    const onsiteStats = db.prepare(`
      SELECT status, COUNT(*) AS count FROM on_site_records GROUP BY status
    `).all();

    const ticketStats = db.prepare(`
      SELECT type, COUNT(*) AS count FROM service_tickets GROUP BY type
    `).all();

    const ticketStatusStats = db.prepare(`
      SELECT status, COUNT(*) AS count FROM service_tickets GROUP BY status
    `).all();

    const settlementStats = db.prepare(`
      SELECT status, SUM(total_fee) AS total_fee, COUNT(*) AS count FROM settlements GROUP BY status
    `).all();

    const recentOrders = db.prepare(`
      SELECT o.id, o.order_no, o.consumer_name, o.consumer_phone, o.product_model,
        o.purchase_channel, o.install_address, o.appointment_time,
        o.parts_requirements, o.warranty_status, o.status, o.created_at,
        b.name AS brand_name, sc.name AS service_center_name,
        d.id AS dispatch_id, d.status AS dispatch_status, d.technician_id,
        d.dispatch_type, d.dispatch_time, d.accept_time,
        t.name AS technician_name,
        r.id AS onsite_record_id, r.status AS onsite_status,
        r.exception_notes AS onsite_exception,
        r.unboxing_photos, r.install_steps, r.user_signature, r.auxiliary_charges,
        r.latitude, r.longitude,
        s.id AS settlement_id, s.status AS settlement_status, s.total_fee AS settlement_total,
        (SELECT COUNT(*) FROM service_tickets WHERE order_id = o.id AND status IN ('open', 'in_progress')) AS active_tickets
      FROM orders o
      LEFT JOIN brands b ON o.brand_id = b.id
      LEFT JOIN service_centers sc ON o.service_center_id = sc.id
      LEFT JOIN dispatches d ON d.order_id = o.id AND d.status != 'rejected'
      LEFT JOIN technicians t ON d.technician_id = t.id
      LEFT JOIN on_site_records r ON r.order_id = o.id
      LEFT JOIN settlements s ON s.order_id = o.id
      ORDER BY o.created_at DESC LIMIT 10
    `).all();

    recentOrders.forEach(order => {
      try { order.unboxing_photos = JSON.parse(order.unboxing_photos); } catch { order.unboxing_photos = []; }
      try { order.install_steps = JSON.parse(order.install_steps); } catch { order.install_steps = []; }
      try {
        order.auxiliary_charges = JSON.parse(order.auxiliary_charges);
        if (!Array.isArray(order.auxiliary_charges)) order.auxiliary_charges = [];
      } catch { order.auxiliary_charges = []; }
    });

    const pendingTickets = db.prepare(`
      SELECT st.id, st.order_id, st.type, st.description, st.status,
        st.handler_name, st.resolution, st.created_at, st.updated_at,
        o.order_no, o.consumer_name, o.consumer_phone,
        o.product_model, o.install_address, o.status AS order_status,
        o.warranty_status, o.appointment_time,
        s.id AS settlement_id, s.status AS settlement_status, s.total_fee,
        r.id AS onsite_id, r.status AS onsite_status,
        d.id AS dispatch_id, d.status AS dispatch_status
      FROM service_tickets st
      LEFT JOIN orders o ON st.order_id = o.id
      LEFT JOIN settlements s ON s.order_id = o.id
      LEFT JOIN on_site_records r ON r.order_id = o.id
      LEFT JOIN dispatches d ON d.order_id = o.id AND d.status != 'rejected'
      WHERE st.status IN ('open', 'in_progress')
      ORDER BY st.created_at DESC LIMIT 20
    `).all();

    const pendingSettlementTotal = db.prepare(`
      SELECT COALESCE(SUM(total_fee), 0) AS total FROM settlements WHERE status = 'pending'
    `).get();

    res.json({
      orderStats,
      dispatchStats,
      onsiteStats,
      ticketStats,
      ticketStatusStats,
      settlementStats,
      recentOrders,
      pendingTickets,
      pendingSettlementTotal: pendingSettlementTotal.total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
