const { db } = require('../models/database');

const getBanners = (req, res) => {
  const rows = db.prepare('SELECT * FROM banners WHERE status = 1 ORDER BY sort ASC').all();
  res.json({ code: 200, msg: 'success', data: rows });
};

const getThemes = (req, res) => {
  const rows = db.prepare('SELECT * FROM themes WHERE status = 1 ORDER BY sort ASC').all();
  const themes = rows.map(theme => ({
    ...theme,
    product_ids: JSON.parse(theme.product_ids || '[]')
  }));
  res.json({ code: 200, msg: 'success', data: themes });
};

const getNewProducts = (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE is_new = 1 AND status = 1 ORDER BY id DESC LIMIT 10').all();
  const products = rows.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]')
  }));
  res.json({ code: 200, msg: 'success', data: products });
};

const getRecommendProducts = (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE is_recommend = 1 AND status = 1 ORDER BY sales DESC LIMIT 10').all();
  const products = rows.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]')
  }));
  res.json({ code: 200, msg: 'success', data: products });
};

const getHomeData = (req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE status = 1 ORDER BY sort ASC').all();
  const themes = db.prepare('SELECT * FROM themes WHERE status = 1 ORDER BY sort ASC LIMIT 6').all();
  const newProducts = db.prepare('SELECT * FROM products WHERE is_new = 1 AND status = 1 ORDER BY id DESC LIMIT 8').all();
  const recommendProducts = db.prepare('SELECT * FROM products WHERE is_recommend = 1 AND status = 1 ORDER BY sales DESC LIMIT 8').all();
  
  const data = {
    banners,
    themes: themes.map(t => ({ ...t, product_ids: JSON.parse(t.product_ids || '[]') })),
    newProducts: newProducts.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
    recommendProducts: recommendProducts.map(p => ({ ...p, images: JSON.parse(p.images || '[]') }))
  };
  res.json({ code: 200, msg: 'success', data });
};

module.exports = { getBanners, getThemes, getNewProducts, getRecommendProducts, getHomeData };
