import express from 'express';
import riskProfilingEngine, { RiskQuestions, RiskLevelMapping } from '../engines/risk-profiling-engine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/questions', (req, res) => {
  res.json({ questions: RiskQuestions, riskLevels: RiskLevelMapping });
});

router.get('/assessment', authenticateToken, (req, res) => {
  try {
    const assessment = riskProfilingEngine.getUserAssessment(req.user.userId);
    const isValid = assessment ? riskProfilingEngine.isAssessmentValid(assessment) : false;
    res.json({ assessment, isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/submit', authenticateToken, (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: '请完成所有问题' });
    }
    const result = riskProfilingEngine.submitAssessment(req.user.userId, answers);
    res.json({ success: true, assessment: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/check-eligibility', authenticateToken, (req, res) => {
  try {
    const { productRiskLevel } = req.body;
    const eligibility = riskProfilingEngine.checkPurchaseEligibility(req.user.userId, productRiskLevel);
    res.json(eligibility);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
