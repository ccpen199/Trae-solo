const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

router.get('/', (req, res) => {
  const {
    keyword,
    status,
    riskLevel,
    scoreMin,
    scoreMax,
    page = 1,
    pageSize = 10
  } = req.query;
  const currentPage = Math.max(parseInt(page), 1);
  const limit = Math.min(Math.max(parseInt(pageSize), 1), 100);
  const offset = (currentPage - 1) * limit;
  const searchKeyword = String(keyword || '').trim();
  
  const baseSelect = `SELECT e.*,
                    COALESCE(h.total_score, 75) as total_score,
                    COALESCE(h.risk_level, '中风险') as risk_level
             FROM enterprises e 
             LEFT JOIN health_scores h ON e.id = h.enterprise_id`;
  const filterConditions = [];
  const filterParams = [];

  if (status) {
    filterConditions.push(`e.status = ?`);
    filterParams.push(String(status));
  }

  if (riskLevel) {
    filterConditions.push(`COALESCE(h.risk_level, '中风险') = ?`);
    filterParams.push(String(riskLevel));
  }

  if (scoreMin !== undefined && scoreMin !== '') {
    filterConditions.push(`COALESCE(h.total_score, 75) >= ?`);
    filterParams.push(Number(scoreMin));
  }

  if (scoreMax !== undefined && scoreMax !== '') {
    filterConditions.push(`COALESCE(h.total_score, 75) <= ?`);
    filterParams.push(Number(scoreMax));
  }

  const buildWhere = (includeKeyword) => {
    const conditions = [...filterConditions];
    const params = [...filterParams];

    if (includeKeyword && searchKeyword) {
      conditions.unshift(`(e.name LIKE ? OR e.unified_social_credit LIKE ?)`);
      params.unshift(`%${searchKeyword}%`, `%${searchKeyword}%`);
    }

    return {
      clause: conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  };

  let where = buildWhere(true);
  let sql = `${baseSelect}${where.clause}`;
  let countSql = `SELECT COUNT(*) as count FROM enterprises e LEFT JOIN health_scores h ON e.id = h.enterprise_id${where.clause}`;
  let params = [...where.params];
  let countParams = [...where.params];
  
  sql += ` ORDER BY e.id LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  let enterprises = db.prepare(sql).all(...params);
  let { count } = db.prepare(countSql).get(...countParams);
  let fallback = false;

  if (searchKeyword && count === 0) {
    fallback = true;
    where = buildWhere(false);
    sql = `${baseSelect}${where.clause} ORDER BY h.total_score ASC, e.id LIMIT ? OFFSET ?`;
    countSql = `SELECT COUNT(*) as count FROM enterprises e LEFT JOIN health_scores h ON e.id = h.enterprise_id${where.clause}`;
    enterprises = db.prepare(sql).all(...where.params, limit, offset);
    count = db.prepare(countSql).get(...where.params).count;
  }
  
  res.json({
    list: enterprises,
    total: count,
    page: currentPage,
    pageSize: limit,
    fallback,
    keyword: searchKeyword,
    filters: {
      status: status || '',
      riskLevel: riskLevel || '',
      scoreMin: scoreMin || '',
      scoreMax: scoreMax || ''
    }
  });
});

router.get('/:id', (req, res) => {
  const enterprise = db.prepare(`
    SELECT e.*, COALESCE(h.total_score, 75) as total_score,
           COALESCE(h.risk_level, '中风险') as risk_level,
           COALESCE(h.business_score, 20) as business_score,
           COALESCE(h.judicial_score, 18) as judicial_score,
           COALESCE(h.bidding_score, 12) as bidding_score,
           COALESCE(h.qualification_score, 12) as qualification_score,
           COALESCE(h.personnel_score, 8) as personnel_score,
           COALESCE(h.credit_score, 5) as credit_score
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
    WHERE e.id = ?
  `).get(req.params.id);
  
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  res.json(enterprise);
});

router.get('/:id/business', (req, res) => {
  const data = db.prepare(`
    SELECT * FROM enterprises WHERE id = ?
  `).get(req.params.id);
  
  res.json({
    ...data,
    _meta: {
      source: data.data_source,
      updatedAt: data.data_updated_at,
      sourceUrl: data.source_url
    }
  });
});

router.get('/:id/judicial', (req, res) => {
  const data = db.prepare(`
    SELECT * FROM judicial_records WHERE enterprise_id = ? ORDER BY filing_date DESC
  `).all(req.params.id);
  
  res.json(data.map(item => ({
    ...item,
    _meta: {
      source: item.data_source,
      updatedAt: item.data_updated_at,
      sourceUrl: item.source_url
    }
  })));
});

router.get('/:id/bidding', (req, res) => {
  const data = db.prepare(`
    SELECT * FROM bidding_records WHERE enterprise_id = ? ORDER BY bidding_date DESC
  `).all(req.params.id);
  
  res.json(data.map(item => ({
    ...item,
    _meta: {
      source: item.data_source,
      updatedAt: item.data_updated_at,
      sourceUrl: item.source_url
    }
  })));
});

router.get('/:id/qualification', (req, res) => {
  const data = db.prepare(`
    SELECT * FROM qualifications WHERE enterprise_id = ? ORDER BY issue_date DESC
  `).all(req.params.id);
  
  res.json(data.map(item => ({
    ...item,
    _meta: {
      source: item.data_source,
      updatedAt: item.data_updated_at,
      sourceUrl: item.source_url
    }
  })));
});

router.get('/:id/personnel', (req, res) => {
  const data = db.prepare(`
    SELECT * FROM personnel WHERE enterprise_id = ? ORDER BY id
  `).all(req.params.id);
  
  res.json(data.map(item => ({
    ...item,
    _meta: {
      source: item.data_source,
      updatedAt: item.data_updated_at,
      sourceUrl: item.source_url
    }
  })));
});

router.get('/:id/credit', (req, res) => {
  const data = db.prepare(`
    SELECT *,
           julianday(display_deadline) - julianday('now') as days_remaining
    FROM credit_records 
    WHERE enterprise_id = ? 
    ORDER BY effective_date DESC
  `).all(req.params.id);
  
  res.json(data.map(item => ({
    ...item,
    _meta: {
      source: item.data_source,
      updatedAt: item.data_updated_at,
      sourceUrl: item.source_url
    }
  })));
});

router.get('/:id/abnormalities', (req, res) => {
  const data = db.prepare(`
    SELECT * FROM business_abnormalities WHERE enterprise_id = ? ORDER BY decision_date DESC
  `).all(req.params.id);
  
  res.json(data);
});

router.get('/:id/penetration', (req, res) => {
  const id = req.params.id;
  
  const enterprise = db.prepare(`
    SELECT e.*, COALESCE(h.total_score, 75) as total_score,
           COALESCE(h.risk_level, '中风险') as risk_level,
           COALESCE(h.business_score, 20) as business_score,
           COALESCE(h.judicial_score, 18) as judicial_score,
           COALESCE(h.bidding_score, 12) as bidding_score,
           COALESCE(h.qualification_score, 12) as qualification_score,
           COALESCE(h.personnel_score, 8) as personnel_score,
           COALESCE(h.credit_score, 5) as credit_score
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
    WHERE e.id = ?
  `).get(id);
  const judicial = db.prepare(`SELECT * FROM judicial_records WHERE enterprise_id = ?`).all(id);
  const bidding = db.prepare(`SELECT * FROM bidding_records WHERE enterprise_id = ?`).all(id);
  const qualification = db.prepare(`SELECT * FROM qualifications WHERE enterprise_id = ?`).all(id);
  const personnel = db.prepare(`SELECT * FROM personnel WHERE enterprise_id = ?`).all(id);
  const credit = db.prepare(`
    SELECT *, julianday(display_deadline) - julianday('now') as days_remaining
    FROM credit_records WHERE enterprise_id = ?
  `).all(id);
  const abnormalities = db.prepare(`SELECT * FROM business_abnormalities WHERE enterprise_id = ?`).all(id);
  const health = db.prepare(`SELECT * FROM health_scores WHERE enterprise_id = ?`).get(id);
  const rigging = db.prepare(`SELECT * FROM bid_rigging_suspects WHERE enterprise_id = ?`).all(id);
  const blacklist = db.prepare(`SELECT * FROM subcontractor_blacklist WHERE enterprise_id = ?`).all(id);
  
  res.json({
    enterprise,
    business: { ...enterprise },
    judicial,
    bidding,
    qualification,
    personnel,
    credit,
    abnormalities,
    health,
    rigging,
    blacklist
  });
});

module.exports = router;
