const express = require('express');
const { db, saveDB, generateId } = require('../database');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const router = express.Router();

router.get('/hot', (req, res) => {
  const hotSearches = [...db.hot_searches].sort((a, b) => a.sort_order - b.sort_order);
  res.json(hotSearches);
});

router.get('/history', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const historyMap = new Map();
  db.search_history
    .filter(h => h.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .forEach(h => {
      if (!historyMap.has(h.keyword)) {
        historyMap.set(h.keyword, h);
      }
    });
  res.json(Array.from(historyMap.values()).slice(0, 10));
});

router.get('/suggestions', (req, res) => {
  const { q } = req.query;
  const products = db.products.filter(p => p.name.includes(q)).slice(0, 10);
  const suggestions = products.map(p => p.name);
  res.json(suggestions);
});

router.get('/', (req, res) => {
  const { q } = req.query;
  if (q && req.headers.authorization) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        db.search_history.push({
          id: generateId('search_history'),
          user_id: decoded.userId,
          keyword: q,
          created_at: new Date().toISOString()
        });
        saveDB();
      } catch (e) {}
    }
  }
  const products = db.products.filter(p => p.name.includes(q) || p.description.includes(q));
  res.json(products);
});

module.exports = router;
