import express from 'express';
import assetTrackEngine from '../engines/asset-track-engine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const assets = assetTrackEngine.getUserAssets(req.user.userId);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', authenticateToken, (req, res) => {
  try {
    const summary = assetTrackEngine.getAssetSummary(req.user.userId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:productId', authenticateToken, (req, res) => {
  try {
    const asset = assetTrackEngine.getAsset(req.user.userId, req.params.productId);
    if (!asset) {
      return res.status(404).json({ error: '资产记录不存在' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
