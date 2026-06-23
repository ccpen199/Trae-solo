import { Router } from 'express';
import { searchService } from '../services/SearchService';

const router = Router();

router.get('/', (req, res) => {
  const { q, cityId, limit } = req.query;
  
  if (!q || !cityId) {
    res.status(400).json({ error: '缺少必要参数 q 或 cityId' });
    return;
  }

  const results = searchService.search(
    String(q),
    String(cityId),
    parseInt(String(limit || '10'))
  );

  res.json({ results });
});

router.get('/hot', (req, res) => {
  const { cityId, limit } = req.query;
  
  if (!cityId) {
    res.status(400).json({ error: '缺少必要参数 cityId' });
    return;
  }

  const hotItems = searchService.getHotSearches(
    String(cityId),
    parseInt(String(limit || '8'))
  );

  res.json({ hotItems });
});

export default router;
