const express = require('express');
const { db, saveDB, generateId } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const ads = db.ads.filter(a => a.is_active === 1).sort((a, b) => b.id - a.id);
  res.json(ads);
});

router.get('/:id', (req, res) => {
  const ad = db.ads.find(a => a.id === parseInt(req.params.id));
  if (!ad) return res.status(404).json({ error: '广告不存在' });
  res.json(ad);
});

router.post('/:id/favorite', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const adId = parseInt(req.params.id);
  const favoriteIndex = db.ad_favorites.findIndex(f => f.user_id === userId && f.ad_id === adId);
  if (favoriteIndex > -1) {
    db.ad_favorites.splice(favoriteIndex, 1);
    saveDB();
    res.json({ favorited: false });
  } else {
    db.ad_favorites.push({
      id: generateId('ad_favorites'),
      user_id: userId,
      ad_id: adId,
      created_at: new Date().toISOString()
    });
    saveDB();
    res.json({ favorited: true });
  }
});

router.get('/:id/favorite/check', authMiddleware, (req, res) => {
  const favorite = db.ad_favorites.find(f => f.user_id === req.user.userId && f.ad_id === parseInt(req.params.id));
  res.json({ favorited: !!favorite });
});

module.exports = router;
