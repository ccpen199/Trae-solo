const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/overview', (req, res) => {
  try {
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const availableRooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE status = ?').get('available').count;
    const rentedRooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE status = ?').get('rented').count;
    const reservedRooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE status = ?').get('reserved').count;
    
    const totalArea = db.prepare('SELECT SUM(area) as total FROM rooms').get().total || 0;
    const rentedArea = db.prepare('SELECT SUM(area) as total FROM rooms WHERE status = ?').get('rented').total || 0;
    
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const newLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE status = ?').get('new').count;
    const followingLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE status = ?').get('following').count;
    const convertedLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE status = ?').get('converted').count;
    
    const totalContracts = db.prepare('SELECT COUNT(*) as count FROM contracts').get().count;
    const activeContracts = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE status = ?').get('active').count;
    const pendingContracts = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE status = ?').get('pending').count;
    
    const totalRent = db.prepare('SELECT SUM(rent_amount) as total FROM contracts WHERE status = ?').get('active').total || 0;
    
    res.json({
      rooms: {
        total: totalRooms,
        available: availableRooms,
        rented: rentedRooms,
        reserved: reservedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0
      },
      area: {
        total: totalArea,
        rented: rentedArea,
        occupancyRate: totalArea > 0 ? Math.round((rentedArea / totalArea) * 100) : 0
      },
      leads: {
        total: totalLeads,
        new: newLeads,
        following: followingLeads,
        converted: convertedLeads,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
        pending: pendingContracts
      },
      finance: {
        monthlyRent: totalRent
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/building-occupancy', (req, res) => {
  try {
    const buildings = db.prepare(`
      SELECT 
        b.id,
        b.name,
        COUNT(r.id) as total_rooms,
        SUM(CASE WHEN r.status = 'rented' THEN 1 ELSE 0 END) as rented_rooms,
        SUM(r.area) as total_area,
        SUM(CASE WHEN r.status = 'rented' THEN r.area ELSE 0 END) as rented_area
      FROM buildings b
      LEFT JOIN rooms r ON b.id = r.building_id
      GROUP BY b.id, b.name
      ORDER BY b.name
    `).all();
    
    const result = buildings.map(b => ({
      ...b,
      room_occupancy_rate: b.total_rooms > 0 ? Math.round((b.rented_rooms / b.total_rooms) * 100) : 0,
      area_occupancy_rate: b.total_area > 0 ? Math.round((b.rented_area / b.total_area) * 100) : 0
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lead-source', (req, res) => {
  try {
    const sources = db.prepare(`
      SELECT 
        source_channel as name,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
      FROM leads
      WHERE source_channel IS NOT NULL AND source_channel != ''
      GROUP BY source_channel
      ORDER BY count DESC
    `).all();
    
    const result = sources.map(s => ({
      ...s,
      conversion_rate: s.count > 0 ? Math.round((s.converted / s.count) * 100) : 0
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monthly-contracts', (req, res) => {
  try {
    const contracts = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count,
        SUM(rent_amount) as total_rent
      FROM contracts
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all();
    
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/industry-analysis', (req, res) => {
  try {
    const industries = db.prepare(`
      SELECT 
        industry as name,
        COUNT(*) as lead_count,
        SUM(CASE WHEN l.status = 'converted' THEN 1 ELSE 0 END) as converted_count,
        COUNT(DISTINCT c.id) as contract_count,
        SUM(c.rent_amount) as total_rent
      FROM leads l
      LEFT JOIN contracts c ON l.id = c.lead_id AND c.status = 'active'
      WHERE l.industry IS NOT NULL AND l.industry != ''
      GROUP BY l.industry
      ORDER BY lead_count DESC
    `).all();
    
    res.json(industries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
