import express from 'express';
import orderService from '../services/order-service.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, type, risk_level } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (risk_level) filters.risk_level = parseInt(risk_level);
    
    const products = orderService.getAllProducts(filters);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = orderService.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
