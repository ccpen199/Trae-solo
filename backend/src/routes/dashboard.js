const express = require('express');
const { db } = require('../database');

const router = express.Router();

router.get('/statistics', (req, res) => {
  const insuredCount = db.prepare('SELECT COUNT(*) as count FROM insured_persons WHERE status = ?').get('正常参保');
  const credentialCount = db.prepare('SELECT COUNT(*) as count FROM electronic_credentials WHERE status = ?').get('有效');
  const prescriptionCount = db.prepare('SELECT COUNT(*) as count FROM prescriptions').get();
  const settlementCount = db.prepare('SELECT COUNT(*) as count FROM settlement_records').get();
  const totalAmount = db.prepare('SELECT SUM(total_amount) as amount FROM settlement_records').get();
  const alertCount = db.prepare('SELECT COUNT(*) as count FROM abnormal_behavior_alerts WHERE status = ?').get('待处理');
  
  res.json({
    insured_count: insuredCount.count,
    credential_count: credentialCount.count,
    prescription_count: prescriptionCount.count,
    settlement_count: settlementCount.count,
    total_settlement_amount: totalAmount.amount || 0,
    pending_alerts: alertCount.count
  });
});

router.get('/recent-activities', (req, res) => {
  const activities = [];
  
  const recentPrescriptions = db.prepare(`
    SELECT p.id, p.prescription_date, '处方' as type, p.status, ip.name
    FROM prescriptions p
    LEFT JOIN insured_persons ip ON p.insured_person_id = ip.id
    ORDER BY p.prescription_date DESC LIMIT 5
  `).all();
  
  const recentSettlements = db.prepare(`
    SELECT s.id, s.settlement_date, '结算' as type, s.settlement_type, ip.name, s.total_amount
    FROM settlement_records s
    LEFT JOIN insured_persons ip ON s.insured_person_id = ip.id
    ORDER BY s.settlement_date DESC LIMIT 5
  `).all();
  
  const recentOffsites = db.prepare(`
    SELECT o.id, o.created_at, '异地备案' as type, o.status, ip.name
    FROM offsite_records o
    LEFT JOIN insured_persons ip ON o.insured_person_id = ip.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();
  
  res.json({
    prescriptions: recentPrescriptions,
    settlements: recentSettlements,
    offsite_records: recentOffsites
  });
});

router.get('/charts/settlement-trend', (req, res) => {
  const trend = db.prepare(`
    SELECT 
      settlement_date as date,
      COUNT(*) as count,
      SUM(total_amount) as amount
    FROM settlement_records
    GROUP BY settlement_date
    ORDER BY settlement_date DESC
    LIMIT 15
  `).all();
  
  res.json(trend.reverse());
});

router.get('/charts/insurance-types', (req, res) => {
  const types = db.prepare(`
    SELECT 
      insurance_type as name,
      COUNT(*) as value
    FROM insured_persons
    GROUP BY insurance_type
  `).all();
  
  res.json(types);
});

router.get('/charts/settlement-types', (req, res) => {
  const types = db.prepare(`
    SELECT 
      settlement_type as name,
      COUNT(*) as value
    FROM settlement_records
    GROUP BY settlement_type
  `).all();
  
  res.json(types);
});

module.exports = router;
