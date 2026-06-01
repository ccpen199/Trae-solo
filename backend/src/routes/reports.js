import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/supplier-grading', (req, res) => {
  const suppliers = db.prepare(`
    SELECT 
      s.id,
      s.name,
      s.industry,
      s.region,
      s.risk_level,
      s.is_key_supplier,
      MAX(a.total_score) as latest_score,
      COUNT(a.id) as assessment_count
    FROM suppliers s
    LEFT JOIN assessments a ON s.id = a.supplier_id AND a.status = 'approved'
    GROUP BY s.id
    ORDER BY s.is_key_supplier DESC, latest_score DESC
  `).all();

  const result = suppliers.map(s => ({
    ...s,
    grade: s.latest_score >= 80 ? 'A' : 
           s.latest_score >= 60 ? 'B' : 
           s.latest_score >= 40 ? 'C' : 'D'
  }));

  res.json(result);
});

router.get('/statistics', (req, res) => {
  const totalSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
  const keySuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers WHERE is_key_supplier = 1').get().count;
  const totalAssessments = db.prepare('SELECT COUNT(*) as count FROM assessments').get().count;
  const approvedAssessments = db.prepare("SELECT COUNT(*) as count FROM assessments WHERE status = 'approved'").get().count;
  const pendingRectifications = db.prepare("SELECT COUNT(*) as count FROM rectifications WHERE status IN ('pending', 'submitted')").get().count;

  const riskDistribution = db.prepare(`
    SELECT risk_level, COUNT(*) as count
    FROM suppliers
    GROUP BY risk_level
  `).all();

  const industryDistribution = db.prepare(`
    SELECT industry, COUNT(*) as count
    FROM suppliers
    GROUP BY industry
  `).all();

  res.json({
    total_suppliers: totalSuppliers,
    key_suppliers: keySuppliers,
    total_assessments: totalAssessments,
    approved_assessments: approvedAssessments,
    pending_rectifications: pendingRectifications,
    risk_distribution: riskDistribution,
    industry_distribution: industryDistribution
  });
});

router.get('/acceptance-checklist', (req, res) => {
  const assessments = db.prepare(`
    SELECT 
      a.id,
      s.name as supplier_name,
      q.name as questionnaire_name,
      q.version as questionnaire_version,
      a.total_score,
      a.risk_level,
      a.status,
      a.created_at,
      a.review_date,
      a.next_review_date
    FROM assessments a
    JOIN suppliers s ON a.supplier_id = s.id
    JOIN questionnaires q ON a.questionnaire_id = q.id
    WHERE a.status = 'approved'
    ORDER BY a.created_at DESC
  `).all();

  const result = assessments.map(a => {
    const evidenceCount = db.prepare("SELECT COUNT(*) as count FROM evidences WHERE assessment_id = ? AND status = 'approved'").get(a.id).count;
    const pendingRectifications = db.prepare("SELECT COUNT(*) as count FROM rectifications WHERE assessment_id = ? AND status != 'completed'").get(a.id).count;
    
    return {
      ...a,
      evidence_count: evidenceCount,
      pending_rectifications: pendingRectifications,
      has_sufficient_evidence: evidenceCount >= 5,
      all_rectifications_closed: pendingRectifications === 0
    };
  });

  res.json(result);
});

export default router;
