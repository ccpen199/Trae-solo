const express = require('express');
const router = express.Router();
const hashChainService = require('../services/hashChainService');
const { getDb } = require('../database');

router.get('/hash-chain/verify', async (req, res) => {
  try {
    const result = hashChainService.verifyChain();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/hash-chain/records', async (req, res) => {
  try {
    const sql = getDb();
    const { recordType, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT * FROM hash_chain WHERE 1=1
    `;
    const params = [];
    
    if (recordType) {
      query += ' AND record_type = ?';
      params.push(recordType);
    }
    
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = sql.exec(query, params);
    
    let records = [];
    if (result.length > 0 && result[0].values.length > 0) {
      const columns = result[0].columns;
      records = result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }
    
    const countResult = sql.exec('SELECT COUNT(*) as total FROM hash_chain');
    const total = countResult.length > 0 && countResult[0].values.length > 0 
      ? countResult[0].values[0][0] 
      : 0;
    
    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/payment-audit', async (req, res) => {
  try {
    const sql = getDb();
    const { userId, sessionId, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        p.*,
        cs.start_time, cs.end_time, cs.total_energy,
        c.charger_code, s.name as station_name,
        hc.hash, hc.previous_hash, hc.timestamp as hash_timestamp
      FROM payments p
      LEFT JOIN charging_sessions cs ON p.session_id = cs.id
      LEFT JOIN chargers c ON cs.charger_id = c.id
      LEFT JOIN stations s ON c.station_id = s.id
      LEFT JOIN hash_chain hc ON hc.record_type = 'payment' AND hc.record_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (userId) {
      query += ' AND p.user_id = ?';
      params.push(userId);
    }
    
    if (sessionId) {
      query += ' AND p.session_id = ?';
      params.push(sessionId);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = sql.exec(query, params);
    
    let payments = [];
    if (result.length > 0 && result[0].values.length > 0) {
      const columns = result[0].columns;
      payments = result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/settlement-audit', async (req, res) => {
  try {
    const sql = getDb();
    const { operatorId, venueId, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        s.*,
        cs.start_time, cs.end_time, cs.total_energy,
        c.charger_code, st.name as station_name,
        o.name as operator_name, v.name as venue_name,
        hc.hash, hc.previous_hash
      FROM settlements s
      LEFT JOIN charging_sessions cs ON s.session_id = cs.id
      LEFT JOIN chargers c ON cs.charger_id = c.id
      LEFT JOIN stations st ON c.station_id = st.id
      LEFT JOIN operators o ON s.operator_id = o.id
      LEFT JOIN venues v ON s.venue_id = v.id
      LEFT JOIN hash_chain hc ON hc.record_type = 'settlement' AND hc.record_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (operatorId) {
      query += ' AND s.operator_id = ?';
      params.push(operatorId);
    }
    
    if (venueId) {
      query += ' AND s.venue_id = ?';
      params.push(venueId);
    }
    
    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = sql.exec(query, params);
    
    let settlements = [];
    if (result.length > 0 && result[0].values.length > 0) {
      const columns = result[0].columns;
      settlements = result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }
    
    res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/charging-logs', async (req, res) => {
  try {
    const sql = getDb();
    const { sessionId, chargerId, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        cr.*,
        c.charger_code,
        s.name as station_name,
        u.name as user_name,
        hc.hash, hc.previous_hash
      FROM charging_records cr
      LEFT JOIN charging_sessions cs ON cr.session_id = cs.id
      LEFT JOIN chargers c ON cs.charger_id = c.id
      LEFT JOIN stations s ON c.station_id = s.id
      LEFT JOIN users u ON cs.user_id = u.id
      LEFT JOIN hash_chain hc ON hc.record_type = 'charging_record' AND hc.record_id = cr.id
      WHERE 1=1
    `;
    const params = [];
    
    if (sessionId) {
      query += ' AND cr.session_id = ?';
      params.push(sessionId);
    }
    
    if (chargerId) {
      query += ' AND cs.charger_id = ?';
      params.push(chargerId);
    }
    
    query += ' ORDER BY cr.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = sql.exec(query, params);
    
    let records = [];
    if (result.length > 0 && result[0].values.length > 0) {
      const columns = result[0].columns;
      records = result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
