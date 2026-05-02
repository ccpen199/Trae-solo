const express = require('express');
const router = express.Router();
const { authenticateToken, requireSupport } = require('../middlewares/auth');
const knowledgeVault = require('../engines/KnowledgeVault');
const { get, all, run } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { keyword, category, limit = 20, offset = 0 } = req.query;

    const result = await knowledgeVault.searchCases(
      keyword,
      category,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(result);
  } catch (error) {
    console.error('搜索案例错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await knowledgeVault.getCaseById(req.params.id, true);

    if (!result.success) {
      return res.status(404).json(result);
    }

    const related = await knowledgeVault.getRelatedCases(req.params.id, 5);

    res.json({
      ...result,
      relatedCases: related.success ? related.relatedCases : []
    });
  } catch (error) {
    console.error('获取案例详情错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/helpful', async (req, res) => {
  try {
    const result = await knowledgeVault.markHelpful(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('标记有用错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/batch-convert', authenticateToken, requireSupport, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await knowledgeVault.batchConvertEligible(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('批量转换案例错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/categories/list', (req, res) => {
  const categories = [
    { id: 'civil', name: '民事纠纷', count: 0 },
    { id: 'contract', name: '合同纠纷', count: 0 },
    { id: 'labor', name: '劳动争议', count: 0 },
    { id: 'criminal', name: '刑事辩护', count: 0 },
    { id: 'corporate', name: '公司事务', count: 0 },
    { id: 'intellectual', name: '知识产权', count: 0 },
    { id: 'real_estate', name: '房产纠纷', count: 0 },
    { id: 'traffic', name: '交通事故', count: 0 },
    { id: 'consumer', name: '消费维权', count: 0 }
  ];

  res.json({
    success: true,
    categories
  });
});

module.exports = router;
