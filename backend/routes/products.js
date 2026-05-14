const express = require('express');
const { db } = require('../database');

const router = express.Router();

router.get('/categories', (req, res) => {
  const categories = [...db.categories].sort((a, b) => a.sort_order - b.sort_order);
  res.json(categories);
});

router.get('/', (req, res) => {
  const { category_id, is_new, is_hot, limit = 20, offset = 0 } = req.query;
  let products = [...db.products];
  if (category_id) {
    products = products.filter(p => p.category_id === parseInt(category_id));
  }
  if (is_new) {
    products = products.filter(p => p.is_new === 1);
  }
  if (is_hot) {
    products = products.filter(p => p.is_hot === 1);
  }
  products = products.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  res.json(products);
});

router.get('/recommend', (req, res) => {
  const personalized = db.products.filter(p => p.is_new === 1).slice(0, 10);
  const guessYouLike = [...db.products].sort(() => Math.random() - 0.5).slice(0, 10);
  const hot = db.products.filter(p => p.is_hot === 1).slice(0, 10);
  const brands = hot.slice(0, 5);
  res.json({ personalized, guessYouLike, hot, brands });
});

router.get('/:id', (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: '商品不存在' });
  res.json(product);
});

module.exports = router;
