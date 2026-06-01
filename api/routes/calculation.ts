import express from 'express';
import { calculateTaxes } from '../services/taxCalculator.js';
import { saveCalculationResult, getCalculationById, getCalculationByOrderId, getAllCalculations } from '../models/calculation.js';

const router = express.Router();

router.post('/calculate', (req, res) => {
  try {
    const input = req.body;
    if (!input.orderId || !input.countryCode || !input.currency || !input.items || !Array.isArray(input.items)) {
      return res.status(400).json({ success: false, error: '缺少必填字段或字段格式错误' });
    }
    if (input.items.length === 0) {
      return res.status(400).json({ success: false, error: '订单商品不能为空' });
    }
    const result = calculateTaxes(input);
    const id = saveCalculationResult(result, input.createdBy);
    res.json({ success: true, data: { ...result, id } });
  } catch (error) {
    console.error('计算税费失败:', error);
    res.status(500).json({ success: false, error: '计算税费失败' });
  }
});

router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const records = getAllCalculations(limit);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取计算历史失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const record = getCalculationById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: '计算记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取计算记录失败' });
  }
});

router.get('/order/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const record = getCalculationByOrderId(orderId);
    if (!record) {
      return res.status(404).json({ success: false, error: '未找到该订单的计算记录' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单计算记录失败' });
  }
});

export default router;
