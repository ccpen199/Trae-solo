const express = require('express');
const { ServiceProvider } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const routingGateway = require('../services/routingGateway');

const router = express.Router();

router.post('/route', authMiddleware, async (req, res) => {
  const { category, city, payload } = req.body;
  if (!category) return res.status(400).json({ error: 'category 必填' });

  try {
    const result = await routingGateway.routeRequest(category, city, payload || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/providers/:category', authMiddleware, async (req, res) => {
  const { category } = req.params;
  try {
    const providers = await ServiceProvider.findAll({
      where: { category, status: 'approved' },
    });
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
