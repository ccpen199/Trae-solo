const express = require('express');
const { db } = require('../database');

const router = express.Router();

router.get('/overview', (req, res) => {
  const { days = 30 } = req.query;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const totalBaggage = db.prepare(`
    SELECT COUNT(*) as count FROM baggage WHERE created_at >= ?
  `).get(cutoff).count;

  const totalPickedUp = db.prepare(`
    SELECT COUNT(*) as count FROM baggage WHERE status = 'picked_up' AND updated_at >= ?
  `).get(cutoff).count;

  const totalExceptions = db.prepare(`
    SELECT COUNT(*) as count FROM baggage_exceptions WHERE report_time >= ?
  `).get(cutoff).count;

  const openExceptions = db.prepare(`
    SELECT COUNT(*) as count FROM baggage_exceptions WHERE status = 'open' OR status = 'in_progress'
  `).get().count;

  const totalCompensation = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM compensation_records WHERE created_at >= ?
  `).get(cutoff);

  const exceptionRate = totalBaggage > 0 ? ((totalExceptions / totalBaggage) * 100).toFixed(2) : 0;
  const pickupRate = totalBaggage > 0 ? ((totalPickedUp / totalBaggage) * 100).toFixed(2) : 0;

  res.json({
    period_days: parseInt(days),
    total_baggage: totalBaggage,
    total_picked_up: totalPickedUp,
    total_exceptions: totalExceptions,
    open_exceptions: openExceptions,
    exception_rate: `${exceptionRate}%`,
    pickup_rate: `${pickupRate}%`,
    compensation_count: totalCompensation.count,
    compensation_total: totalCompensation.total,
    average_compensation: totalCompensation.count > 0 ? (totalCompensation.total / totalCompensation.count).toFixed(2) : 0
  });
});

router.get('/exceptions-by-type', (req, res) => {
  const { days = 30 } = req.query;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const data = db.prepare(`
    SELECT exception_type, exception_name, COUNT(*) as count
    FROM baggage_exceptions
    WHERE report_time >= ?
    GROUP BY exception_type, exception_name
    ORDER BY count DESC
  `).all(cutoff);

  res.json({ period_days: parseInt(days), data });
});

router.get('/exceptions-by-route', (req, res) => {
  const { days = 30, top = 10 } = req.query;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const data = db.prepare(`
    SELECT b.departure, b.destination, 
           COUNT(DISTINCT be.id) as exception_count,
           COUNT(DISTINCT b.id) as total_baggage,
           ROUND(COUNT(DISTINCT be.id) * 100.0 / NULLIF(COUNT(DISTINCT b.id), 0), 2) as exception_rate
    FROM baggage b
    LEFT JOIN baggage_exceptions be ON b.id = be.baggage_id
    WHERE b.created_at >= ?
    GROUP BY b.departure, b.destination
    HAVING exception_count > 0
    ORDER BY exception_count DESC
    LIMIT ?
  `).all(cutoff, parseInt(top));

  res.json({ period_days: parseInt(days), data });
});

router.get('/exceptions-by-node', (req, res) => {
  const { days = 30 } = req.query;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const data = db.prepare(`
    SELECT 
      CASE 
        WHEN exception_type IN ('misrouted', 'delayed') THEN '中转环节'
        WHEN exception_type = 'damaged' THEN '装卸环节'
        WHEN exception_type = 'lost' THEN '存储/运输环节'
        WHEN exception_type = 'unclaimed' THEN '领取环节'
        ELSE '其他环节'
      END as node,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM baggage_exceptions WHERE report_time >= ?), 2) as percentage
    FROM baggage_exceptions
    WHERE report_time >= ?
    GROUP BY node
    ORDER BY count DESC
  `).all(cutoff, cutoff);

  res.json({ period_days: parseInt(days), data });
});

router.get('/compensation-by-party', (req, res) => {
  const { days = 30 } = req.query;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const data = db.prepare(`
    SELECT responsible_party, 
           COUNT(*) as count,
           COALESCE(SUM(amount), 0) as total_amount,
           ROUND(COALESCE(AVG(amount), 0), 2) as avg_amount
    FROM compensation_records
    WHERE created_at >= ?
    GROUP BY responsible_party
    ORDER BY total_amount DESC
  `).all(cutoff);

  res.json({ period_days: parseInt(days), data });
});

router.get('/daily-trend', (req, res) => {
  const { days = 30 } = req.query;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const baggageTrend = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as baggage_count
    FROM baggage
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(cutoff);

  const exceptionTrend = db.prepare(`
    SELECT DATE(report_time) as date, COUNT(*) as exception_count
    FROM baggage_exceptions
    WHERE report_time >= ?
    GROUP BY DATE(report_time)
    ORDER BY date ASC
  `).all(cutoff);

  const dateMap = {};
  baggageTrend.forEach(b => {
    dateMap[b.date] = { date: b.date, baggage_count: b.baggage_count, exception_count: 0 };
  });
  exceptionTrend.forEach(e => {
    if (!dateMap[e.date]) {
      dateMap[e.date] = { date: e.date, baggage_count: 0, exception_count: 0 };
    }
    dateMap[e.date].exception_count = e.exception_count;
  });

  const data = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  res.json({ period_days: parseInt(days), data });
});

router.get('/missing-nodes', (req, res) => {
  const { hours = 24 } = req.query;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const data = db.prepare(`
    SELECT 
      'check_in' as node, '托运' as name,
      COUNT(*) as missing_count
    FROM baggage b
    WHERE b.created_at >= ? 
      AND b.status != 'picked_up'
      AND NOT EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'check_in')
    UNION ALL
    SELECT 
      'security' as node, '安检' as name,
      COUNT(*) as missing_count
    FROM baggage b
    WHERE b.created_at >= ? 
      AND b.status != 'picked_up'
      AND EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'check_in')
      AND NOT EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'security')
    UNION ALL
    SELECT 
      'loading' as node, '装机' as name,
      COUNT(*) as missing_count
    FROM baggage b
    WHERE b.created_at >= ? 
      AND b.status != 'picked_up'
      AND EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'security')
      AND NOT EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'loading')
    UNION ALL
    SELECT 
      'unloading' as node, '卸机' as name,
      COUNT(*) as missing_count
    FROM baggage b
    WHERE b.created_at >= ? 
      AND b.status != 'picked_up'
      AND EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'loading')
      AND NOT EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'unloading')
    UNION ALL
    SELECT 
      'carousel' as node, '转盘' as name,
      COUNT(*) as missing_count
    FROM baggage b
    WHERE b.created_at >= ? 
      AND b.status != 'picked_up'
      AND EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'unloading')
      AND NOT EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'carousel')
    UNION ALL
    SELECT 
      'pickup' as node, '领取' as name,
      COUNT(*) as missing_count
    FROM baggage b
    WHERE b.created_at >= ? 
      AND b.status != 'picked_up'
      AND EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'carousel')
      AND NOT EXISTS (SELECT 1 FROM baggage_nodes bn WHERE bn.baggage_id = b.id AND bn.node_type = 'pickup')
  `).all(cutoff, cutoff, cutoff, cutoff, cutoff, cutoff);

  res.json({ period_hours: parseInt(hours), data });
});

module.exports = router;
